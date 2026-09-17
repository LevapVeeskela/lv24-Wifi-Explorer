import { describe, expect, it } from 'vitest';
import { decodeInformationElements, parseShallowIe, toHex } from './ie';

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
    if (rsn?.kind === 'rsn') {
      expect(rsn.pairwise.map((s) => s.name)).toEqual(['ccmp-128']);
      expect(rsn.akm.map((s) => s.name)).toEqual(['psk']);
    }
    expect(op).toMatchObject({ kind: 'ht-operation', primaryChannel: 36, secondaryOffset: 1 });
    expect(result.shallow.nssHint).toBe(2);
    expect(result.shallow.rsnIe).toBe(true);
    expect(result.shallow.htPrimaryChannel).toBe(36);
    expect(result.shallow.htSecondaryOffset).toBe(1);
  });

  it('decodes VHT Cap/Op 191/192', () => {
    const result = decodeInformationElements([
      ...vhtCapabilitiesIe(2),
      ...vhtOperationIe(42, 1),
    ]);
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
    const payload = [0x00, 0x50, 0xf2, 0x01, 0x01, 0x00];
    const result = decodeInformationElements(tlv(221, payload));
    expect(result.elements[0]).toMatchObject({
      kind: 'vendor',
      oui: '00:50:f2',
      vendorType: 0x01,
      rawHex: toHex(payload),
    });
    expect(result.shallow.wpaVendorIe).toBe(true);
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
    const payload = [108, 0xaa];
    const result = decodeInformationElements(tlv(255, payload));
    expect(result.elements[0]).toMatchObject({
      kind: 'unknown',
      id: 255,
      extId: 108,
      rawHex: '6caa',
    });
    expect(result.shallow.ehtCapabilities).toBe(true);
  });
});
