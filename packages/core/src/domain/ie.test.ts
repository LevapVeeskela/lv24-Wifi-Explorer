import { describe, expect, it } from 'vitest';
import { buildIeTree, decodeInformationElements, parseShallowIe } from './ie';

function tlv(id: number, payload: readonly number[]): number[] {
  return [id, payload.length, ...payload];
}

function htCapabilitiesIe(nss: 1 | 2 | 3 | 4): number[] {
  const mcs = new Array(16).fill(0);
  for (let i = 0; i < nss; i += 1) mcs[i] = 0xff;
  return tlv(45, [0x00, 0x00, 0x00, ...mcs]);
}

function htOperationIe(primary: number, secondary: -1 | 0 | 1): number[] {
  const offsetBits = secondary === 1 ? 1 : secondary === -1 ? 3 : 0;
  return tlv(61, [primary, offsetBits]);
}

function vhtCapabilitiesIe(nss: 1 | 2 | 3 | 4 | 8, maxMcsBits = 2): number[] {
  let rx = 0;
  for (let i = 0; i < 8; i += 1) {
    const bits = i < nss ? maxMcsBits : 3;
    rx |= bits << (i * 2);
  }
  return tlv(191, [0, 0, 0, 0, rx & 0xff, (rx >> 8) & 0xff, 0, 0, 0, 0, 0, 0]);
}

function vhtOperationIe(ccfs0: number, widthCode = 1): number[] {
  return tlv(192, [widthCode, ccfs0, 0]);
}

function heCapabilitiesIe(nss: 1 | 2 | 3 | 4 | 8, maxMcsBits = 2): number[] {
  const afterExt = new Array(19).fill(0);
  let rx = 0;
  for (let i = 0; i < 8; i += 1) {
    const bits = i < nss ? maxMcsBits : 3;
    rx |= bits << (i * 2);
  }
  afterExt[17] = rx & 0xff;
  afterExt[18] = (rx >> 8) & 0xff;
  return tlv(255, [35, ...afterExt]);
}

function heOperationIe(color = 7): number[] {
  return tlv(255, [36, 0, 0, 0, color & 0x3f, 0, 0]);
}

const RSN_WPA2_PSK_CCMP = [
  0x01, 0x00, 0x00, 0x0f, 0xac, 0x04, 0x01, 0x00, 0x00, 0x0f, 0xac, 0x04, 0x01, 0x00, 0x00, 0x0f,
  0xac, 0x02, 0x80, 0x00,
];

describe('decodeInformationElements', () => {
  it('is absent when bytes are missing', () => {
    expect(decodeInformationElements(null).level).toBe('absent');
    expect(decodeInformationElements([]).level).toBe('absent');
    expect(parseShallowIe(null).level).toBe('absent');
  });

  it('is raw-only when the buffer is not a complete TLV', () => {
    const result = decodeInformationElements([48, 20]);
    expect(result.level).toBe('raw-only');
    expect(result.elements).toEqual([]);
  });

  it('decodes SSID(0), including hidden empty', () => {
    const visible = decodeInformationElements(tlv(0, [...new TextEncoder().encode('LV24')]));
    const ssid = visible.elements[0];
    expect(ssid.kind).toBe('ssid');
    if (ssid.kind !== 'ssid') return;
    expect(ssid.ssid).toBe('LV24');
    expect(ssid.hidden).toBe(false);

    const hidden = decodeInformationElements(tlv(0, []));
    expect(hidden.elements[0]).toMatchObject({ kind: 'ssid', hidden: true, ssid: '' });
  });

  it('decodes Rates(1/50) with basic bit = 500 kbps units', () => {
    // 0x8c = basic 6 Mbps; 0x12 = 9 Mbps
    const rates = decodeInformationElements([...tlv(1, [0x8c, 0x12]), ...tlv(50, [0x24])]);
    const basic = rates.elements.find((e) => e.id === 1);
    const ext = rates.elements.find((e) => e.id === 50);
    expect(basic).toMatchObject({ kind: 'rates', ratesMbps: [6, 9], basicRatesMbps: [6] });
    expect(ext).toMatchObject({ kind: 'rates', ratesMbps: [18], basicRatesMbps: [] });
  });

  it('decodes DS(3), Country(7), BSS Load(11)', () => {
    const buf = [
      ...tlv(3, [6]),
      ...tlv(7, [0x52, 0x55, 0x20, 1, 13, 20]),
      ...tlv(11, [0x04, 0x00, 51, 0x00, 0x00]),
    ];
    const result = decodeInformationElements(buf);
    expect(result.elements[0]).toMatchObject({ kind: 'ds', channel: 6 });
    expect(result.elements[1]).toMatchObject({
      kind: 'country',
      countryCode: 'RU',
      triplets: [{ firstChannel: 1, channelCount: 13, maxTxPowerDbm: 20 }],
    });
    const load = result.elements[2];
    expect(load.kind).toBe('bss-load');
    if (load.kind !== 'bss-load') return;
    expect(load.stationCount).toBe(4);
    expect(load.channelUtilization).toBe(51);
    expect(load.channelUtilPct).toBeCloseTo((51 * 100) / 255);
    expect(result.shallow.countryFromIe).toBe('RU');
  });

  it('decodes HT Cap(45), RSN(48), HT Op(61)', () => {
    const buf = [...htCapabilitiesIe(2), ...tlv(48, RSN_WPA2_PSK_CCMP), ...htOperationIe(36, 1)];
    const result = decodeInformationElements(buf);
    const ht = result.elements.find((e) => e.kind === 'ht-capabilities');
    const rsn = result.elements.find((e) => e.kind === 'rsn');
    const op = result.elements.find((e) => e.kind === 'ht-operation');
    expect(ht).toMatchObject({ kind: 'ht-capabilities', nss: 2 });
    expect(rsn).toMatchObject({
      kind: 'rsn',
      version: 1,
      groupCipher: { name: 'ccmp-128', oui: '00:0f:ac' },
      mfpc: true,
      mfpr: false,
    });
    // oxlint-disable vitest/no-conditional-expect
    if (rsn?.kind === 'rsn') {
      expect(rsn.pairwise.map((s) => s.name)).toEqual(['ccmp-128']);
      expect(rsn.akm.map((s) => s.name)).toEqual(['psk']);
    }
    // oxlint-enable vitest/no-conditional-expect
    expect(op).toMatchObject({ kind: 'ht-operation', primaryChannel: 36, secondaryOffset: 1 });
    expect(result.shallow.nssHint).toBe(2);
    expect(result.shallow.rsnIe).toBe(true);
    expect(result.shallow.htPrimaryChannel).toBe(36);
    expect(result.shallow.htSecondaryOffset).toBe(1);
  });

  it('decodes VHT Cap/Op 191/192', () => {
    const result = decodeInformationElements([...vhtCapabilitiesIe(2), ...vhtOperationIe(42, 1)]);
    expect(result.elements[0]).toMatchObject({ kind: 'vht-capabilities', nss: 2, maxMcs: 9 });
    expect(result.elements[1]).toMatchObject({
      kind: 'vht-operation',
      widthMhz: 80,
      ccfs0: 42,
    });
    expect(result.shallow.ccfs0).toBe(42);
    expect(result.shallow.vhtCapabilities).toBe(true);
  });

  it('decodes RSNX 244 (SAE H2E bit)', () => {
    const result = decodeInformationElements(tlv(244, [1 << 5]));
    expect(result.elements[0]).toMatchObject({ kind: 'rsnx', saeHashToElement: true });
  });

  it('decodes HE 255/35-36 shallow', () => {
    const result = decodeInformationElements([...heCapabilitiesIe(2), ...heOperationIe(12)]);
    expect(result.elements[0]).toMatchObject({
      kind: 'he-capabilities',
      nss: 2,
      maxMcs: 11,
      extId: 35,
    });
    expect(result.elements[1]).toMatchObject({
      kind: 'he-operation',
      bssColor: 12,
      extId: 36,
    });
    expect(result.shallow.heCapabilities).toBe(true);
    expect(result.shallow.nssHint).toBe(2);
  });

  it('decodes vendor 221 as raw + OUI (WPA 00:50:f2)', () => {
    const wpaBody = [
      0x00, 0x50, 0xf2, 0x01, 0x01, 0x00, 0x00, 0x0f, 0xac, 0x04, 0x01, 0x00, 0x00, 0x0f, 0xac,
      0x04, 0x01, 0x00, 0x00, 0x0f, 0xac, 0x02,
    ];
    const result = decodeInformationElements(tlv(221, wpaBody));
    expect(result.elements[0]).toMatchObject({
      kind: 'vendor-wpa',
      oui: '00:50:f2',
      version: 1,
      groupCipher: { name: 'ccmp-128' },
    });
    expect(result.shallow.wpaVendorIe).toBe(true);
  });

  it('decodes TIM(5), Power Constraint(32), Extended Capabilities(127)', () => {
    const extCap = new Array(4).fill(0);
    extCap[0] = 1 << 4;
    const buf = [...tlv(5, [2, 3, 0x00, 0xff]), ...tlv(32, [4]), ...tlv(127, extCap)];
    const result = decodeInformationElements(buf);
    expect(result.elements[0]).toMatchObject({
      kind: 'tim',
      dtimCount: 2,
      dtimPeriod: 3,
      partialBitmapLength: 1,
    });
    expect(result.elements[1]).toMatchObject({
      kind: 'power-constraint',
      localPowerConstraintDb: 4,
    });
    const ext = result.elements[2];
    expect(ext.kind).toBe('extended-capabilities');
    if (ext.kind !== 'extended-capabilities') return;
    expect(ext.setFlags.some((f) => f.name === 'BSS transition')).toBe(true);
  });

  it('decodes DTIM, BSS Load, mobility domain and WPS into the shallow view', () => {
    const buf = [
      ...tlv(5, [1, 3, 0x00, 0xff]),
      ...tlv(11, [0x0c, 0x00, 255, 0x00, 0x00]),
      ...tlv(54, [1, 2]),
      ...tlv(221, [0x00, 0x50, 0xf2, 4, 1]),
    ];
    const ie = parseShallowIe(buf);
    expect(ie.dtimPeriod).toBe(3);
    expect(ie.bssLoadStations).toBe(12);
    expect(ie.bssLoadUtilPct).toBe(100);
    expect(ie.mobilityDomain).toBe(true);
    expect(ie.wps).toBe(true);
  });

  it('decodes EHT Capabilities 255/108 when MCS map present', () => {
    const afterExt = new Array(13).fill(0);
    let rx = 0;
    for (let i = 0; i < 8; i += 1) {
      const bits = i < 2 ? 2 : 3;
      rx |= bits << (i * 2);
    }
    afterExt[11] = rx & 0xff;
    afterExt[12] = (rx >> 8) & 0xff;
    const result = decodeInformationElements(tlv(255, [108, ...afterExt]));
    expect(result.elements[0]).toMatchObject({
      kind: 'eht-capabilities',
      extId: 108,
      nss: 2,
      maxMcs: 13,
    });
    expect(result.shallow.ehtCapabilities).toBe(true);
  });

  it('buildIeTree lists meta and decoded fields', () => {
    const result = decodeInformationElements(tlv(0, [...new TextEncoder().encode('x')]));
    const tree = buildIeTree(result);
    expect(tree[0]?.label).toBe('Parse level');
    expect(tree.some((n) => n.label.startsWith('SSID'))).toBe(true);
  });

  it('unknown IE is id + hex, no invented name', () => {
    const payload = [0xde, 0xad];
    const result = decodeInformationElements(tlv(42, payload));
    expect(result.elements[0]).toEqual({
      id: 42,
      extId: null,
      kind: 'unknown',
      raw: payload,
      rawHex: 'dead',
    });
    expect(result.elements[0]).not.toHaveProperty('name');
  });

  it('unknown extension IE keeps extId + hex', () => {
    const payload = [99, 0xaa];
    const result = decodeInformationElements(tlv(255, payload));
    expect(result.elements[0]).toMatchObject({
      kind: 'unknown',
      id: 255,
      extId: 99,
      rawHex: '63aa',
    });
  });
});

function wpsAttr(type: number, value: readonly number[]): number[] {
  return [
    (type >> 8) & 0xff,
    type & 0xff,
    (value.length >> 8) & 0xff,
    value.length & 0xff,
    ...value,
  ];
}

function wpsIe(...attrs: readonly number[][]): number[] {
  return tlv(221, [0x00, 0x50, 0xf2, 0x04, ...attrs.flat()]);
}

describe('WPS device name (221 / 00:50:f2 / type 4)', () => {
  const DEVICE_NAME = [...new TextEncoder().encode('  LV24-AP-7F  ')];
  const VERSION = wpsAttr(0x104a, [0x10, 0x4a]);

  it('extracts 0x1011 as trimmed UTF-8 in both decoders', () => {
    const buf = wpsIe(VERSION, wpsAttr(0x1011, DEVICE_NAME));
    expect(decodeInformationElements(buf).shallow.wpsDeviceName).toBe('LV24-AP-7F');
    expect(parseShallowIe(buf).wpsDeviceName).toBe('LV24-AP-7F');
    expect(parseShallowIe(buf).wps).toBe(true);
  });

  it('skips other attributes and keeps the first 0x1011', () => {
    const buf = wpsIe(
      wpsAttr(0x1011, [...new TextEncoder().encode('first')]),
      wpsAttr(0x1011, [...new TextEncoder().encode('second')])
    );
    expect(parseShallowIe(buf).wpsDeviceName).toBe('first');
  });

  it('caps the name at 64 characters', () => {
    const long = [...new TextEncoder().encode('A'.repeat(100))];
    expect(parseShallowIe(wpsIe(wpsAttr(0x1011, long))).wpsDeviceName).toBe('A'.repeat(64));
  });

  it('is null when the attribute value is truncated', () => {
    // Outer IE length is valid; the WPS attribute claims 32 bytes but has 2.
    const truncated = tlv(221, [0x00, 0x50, 0xf2, 0x04, 0x10, 0x11, 0x00, 0x20, 0x41, 0x42]);
    const result = decodeInformationElements(truncated);
    expect(result.level).toBe('shallow-tags');
    expect(result.shallow.wps).toBe(true);
    expect(result.shallow.wpsDeviceName).toBeNull();
    expect(parseShallowIe(truncated).wpsDeviceName).toBeNull();
  });

  it('is null when the attribute header is cut mid-way', () => {
    const buf = tlv(221, [0x00, 0x50, 0xf2, 0x04, 0x10]);
    expect(parseShallowIe(buf).wps).toBe(true);
    expect(parseShallowIe(buf).wpsDeviceName).toBeNull();
  });

  it('ignores non-WPS vendor IEs and empty names', () => {
    expect(parseShallowIe(tlv(221, [0x00, 0x50, 0xf2, 0x01, 0x10, 0x11])).wpsDeviceName).toBeNull();
    expect(parseShallowIe(tlv(221, [0x00, 0x11, 0x22, 0x04, 0x10, 0x11])).wpsDeviceName).toBeNull();
    expect(parseShallowIe(wpsIe(wpsAttr(0x1011, [0x20, 0x20]))).wpsDeviceName).toBeNull();
  });
});
