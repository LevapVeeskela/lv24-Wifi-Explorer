import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CoreWlanNetworkRecord } from '../../domain/bss';
import { SCAN_FILTER_DEFAULTS } from '../../domain/filters';
import { asIsoTime } from '../identity';
import { parseShallowIe } from '../ieShallow';
import { applyScanFilter } from '../applyScanFilter';
import { groupEss } from '../groupEss';
import {
  computeSignalView,
  estimateMaxRate,
  mapCoreWlanRecordToObservedBss,
  computePhyView,
} from '../mapObservedBss';
import { mergeSnapshots } from '../mergeSnapshots';
import { primaryCenterMhz } from '../channelMath';
import {
  DEMO_CAMPUS_24,
  DEMO_CAMPUS_5_80,
  DEMO_HIDDEN_A,
  DEMO_IBSS,
  DEMO_MISSING_NOISE,
  DEMO_OPEN,
  DEMO_OWE,
  DEMO_RANDOMIZED,
  DEMO_RAW_NETWORKS,
  DEMO_WEP,
  DEMO_WPA3_6GHZ,
  buildDemoSnapshot,
  buildDemoView,
  htCapabilitiesIe,
  htOperationIe,
  tlv,
  vhtOperationIe,
} from '../fixtures/demo';

const T0 = asIsoTime('2026-09-17T19:00:00.000Z');

function map(raw: CoreWlanNetworkRecord, prev?: ReturnType<typeof mapCoreWlanRecordToObservedBss>) {
  return mapCoreWlanRecordToObservedBss(raw, prev, T0, { location: 'granted' });
}

describe('signal', () => {
  it('SNR = rssi − noise; 0 and out-of-range noise dropped', () => {
    const ok = computeSignalView(-50, -90);
    assert.equal(ok.snrDb, 40);
    assert.equal(ok.noiseDbm, -90);
    assert.equal(ok.quality, 'excellent');
    assert.equal(ok.qualityBasis, 'snr');

    const zero = computeSignalView(-50, 0);
    assert.equal(zero.snrDb, null);
    assert.equal(zero.noiseDbm, null);
    assert.equal(zero.qualityBasis, 'rssi-fallback');
    assert.equal(zero.quality, 'excellent');

    assert.equal(computeSignalView(-50, -19).snrDb, null);
    assert.equal(computeSignalView(-50, -121).snrDb, null);
    assert.equal(computeSignalView(-50, -20).snrDb, -30);
    assert.equal(computeSignalView(-50, -120).snrDb, 70);
  });

  it('quality uses SNR table, else RSSI; not a percent', () => {
    assert.equal(computeSignalView(-70, -80).quality, 'poor'); // SNR 10
    assert.equal(computeSignalView(-70, -79).quality, 'unusable'); // SNR 9
    assert.equal(computeSignalView(-60, 0).quality, 'good');
    assert.equal(computeSignalView(-81, 0).quality, 'unusable');
    assert.equal(typeof computeSignalView(-50, -90).quality, 'string');
    assert.notEqual(computeSignalView(-50, -90).quality, '100');
  });
});

describe('channel', () => {
  it('primaryCenterMhz follows IEEE formulas including ch14', () => {
    assert.equal(primaryCenterMhz(2.4, 1), 2412);
    assert.equal(primaryCenterMhz(2.4, 6), 2437);
    assert.equal(primaryCenterMhz(2.4, 14), 2484);
    assert.equal(primaryCenterMhz(5, 36), 5180);
    assert.equal(primaryCenterMhz(6, 5), 5975);
  });

  it('occupying = primary at 20 MHz; IE CCFS; else standard-layout guess', () => {
    const campus20 = map(DEMO_CAMPUS_24);
    assert.equal(campus20.channel.band, 2.4);
    assert.equal(campus20.channel.primaryCenterMhz, 2437);
    assert.equal(campus20.channel.occupyingCenterMhz, 2437);
    assert.equal(campus20.channel.centerConfidence, 'ieee-primary-20');

    const withIe = map(DEMO_CAMPUS_5_80);
    assert.equal(withIe.channel.widthMhz, 80);
    assert.equal(withIe.channel.primaryCenterMhz, 5180);
    assert.equal(withIe.channel.occupyingCenterMhz, 5210);
    assert.equal(withIe.channel.centerConfidence, 'ie-operation');
    assert.deepEqual(withIe.channel.occupyingSpanMhz, { from: 5170, to: 5250 });

    const guessRaw: CoreWlanNetworkRecord = {
      ...DEMO_CAMPUS_5_80,
      informationElementData: null,
    };
    const guessed = map(guessRaw);
    assert.equal(guessed.channel.occupyingCenterMhz, 5210);
    assert.equal(guessed.channel.centerConfidence, 'standard-layout-guess');

    const six = map(DEMO_WPA3_6GHZ);
    assert.equal(six.channel.band, 6);
    assert.equal(six.channel.primaryCenterMhz, 5975);
    assert.equal(six.channel.occupyingCenterMhz, 5985);
    assert.equal(six.channel.centerConfidence, 'standard-layout-guess');
  });
});

describe('phy and max rate', () => {
  it('display joins flags in PHY_DISPLAY_ORDER', () => {
    const phy = computePhyView(['ax', 'a', 'n', 'ac']);
    assert.equal(phy.display, 'a/n/ac/ax');
    assert.equal(phy.highest, 'ax');
    assert.deepEqual([...phy.supported], ['a', 'n', 'ac', 'ax']);
  });

  it('max rate is 1SS long-GI table only; no 866.7; no EHT estimate', () => {
    const campus = map(DEMO_CAMPUS_5_80);
    assert.ok(campus.maxRate);
    assert.equal(campus.maxRate.mbpsLow, 480);
    assert.equal(campus.maxRate.mbpsHigh, 960);
    assert.equal(campus.maxRate.basis, 'ie-nss-mcs');
    assert.equal(campus.maxRate.nssUsed, 2);
    assert.notEqual(campus.maxRate.mbpsHigh, 866.7);
    assert.notEqual(campus.maxRate.mbpsLow, 866.7);

    const beOnly = estimateMaxRate(computePhyView(['be']), 80, null);
    assert.equal(beOnly, null);

    const noNss = map({ ...DEMO_CAMPUS_24, informationElementData: null });
    assert.ok(noNss.maxRate);
    assert.equal(noNss.maxRate.mbpsLow, 65);
    assert.equal(noNss.maxRate.mbpsHigh, null);
    assert.equal(noNss.maxRate.basis, 'phy-width-1ss-long-gi');
    assert.equal(noNss.maxRate.nssUsed, 1);
  });
});

describe('security and location', () => {
  it('primary from SECURITY_PRIMARY_RANK; open is None only; OWE/WEP secure', () => {
    const open = map(DEMO_OPEN);
    assert.equal(open.security.primary, 'open');
    assert.equal(open.security.isOpen, true);
    assert.equal(open.security.isSecure, false);

    const owe = map(DEMO_OWE);
    assert.equal(owe.security.primary, 'owe');
    assert.equal(owe.security.isOpen, false);
    assert.equal(owe.security.isSecure, true);
    assert.equal(owe.security.authClass, 'enhanced-open');

    const wep = map(DEMO_WEP);
    assert.equal(wep.security.primary, 'wep');
    assert.equal(wep.security.isOpen, false);
    assert.equal(wep.security.isSecure, true);

    const transition = map(DEMO_CAMPUS_5_80);
    assert.equal(transition.security.primary, 'wpa3-personal');
    assert.equal(transition.security.isOpen, false);
  });

  it('LocationGated redacts ssid/bssid/country when location denied', () => {
    const denied = mapCoreWlanRecordToObservedBss(DEMO_OPEN, undefined, T0, {
      location: 'denied',
    });
    assert.equal(denied.identity.bssid.status, 'redacted');
    assert.equal(denied.identity.ssid.status, 'redacted');
    assert.equal(denied.countryCode.status, 'redacted');

    const granted = map(DEMO_OPEN);
    assert.equal(granted.identity.bssid.status, 'available');
    assert.equal(granted.identity.bssid.value, '00:11:22:0e:00:01');
    assert.equal(granted.identity.ssid.status, 'available');
    assert.equal(granted.identity.ssid.value.displayName, 'Cafe-Free');
    assert.equal(granted.countryCode.status, 'available');
  });

  it('randomized OUI is not an organization', () => {
    const row = map(DEMO_RANDOMIZED);
    assert.equal(row.vendor.match, 'randomized');
    assert.equal(row.vendor.locallyAdministered, true);
    assert.equal(row.vendor.organization, null);
    assert.equal(row.vendor.oui, '02:11:22');
  });
});

describe('IE shallow', () => {
  it('reads HT secondary, VHT CCFS0, NSS; absent when no bytes', () => {
    const buf = [
      ...htCapabilitiesIe(2),
      ...htOperationIe(36, 1),
      ...vhtOperationIe(42),
      ...tlv(48, [1, 0]),
    ];
    const ie = parseShallowIe(buf);
    assert.equal(ie.level, 'shallow-tags');
    assert.equal(ie.nssHint, 2);
    assert.equal(ie.htPrimaryChannel, 36);
    assert.equal(ie.htSecondaryOffset, 1);
    assert.equal(ie.ccfs0, 42);
    assert.equal(ie.rsnIe, true);
    assert.equal(parseShallowIe(null).level, 'absent');
  });

  it('reads WPS device name (221 00:50:f2 type 4, attr 0x1011) only when complete', () => {
    const name = [...new TextEncoder().encode('LV24-AP')];
    const attr = [0x10, 0x11, 0x00, name.length, ...name];
    const ie = parseShallowIe(tlv(221, [0x00, 0x50, 0xf2, 0x04, ...attr]));
    assert.equal(ie.wps, true);
    assert.equal(ie.wpsDeviceName, 'LV24-AP');

    const truncated = tlv(221, [0x00, 0x50, 0xf2, 0x04, 0x10, 0x11, 0x00, 0x20, 0x41]);
    assert.equal(parseShallowIe(truncated).wpsDeviceName, null);
  });
});

describe('groupEss', () => {
  it('merges same visible SSID; never merges hidden; isolates IBSS', () => {
    const view = buildDemoView();
    const campus = view.essGroups.filter(
      (g) => g.kind === 'infrastructure' && g.ssid.utf8 === 'LV24-Campus'
    );
    assert.equal(campus.length, 1);
    assert.equal(campus[0].bssCount, 3);
    assert.equal(campus[0].bandMix.length, 2);
    assert.equal(campus[0].securityMixed, true);

    const hidden = view.essGroups.filter((g) => g.kind === 'hidden-singleton');
    assert.equal(hidden.length, 2);
    assert.ok(hidden.every((g) => g.bssCount === 1));
    assert.notEqual(hidden[0].key, hidden[1].key);

    const ibss = view.essGroups.filter((g) => g.kind === 'ibss');
    assert.equal(ibss.length, 1);
    assert.ok(String(ibss[0].key).startsWith('ibss:'));

    const sameNameIbss = map({
      ...DEMO_IBSS,
      ssid: 'LV24-Campus',
      ssidData: [...new TextEncoder().encode('LV24-Campus')],
    });
    const mixed = groupEss([...campus[0].members, sameNameIbss]);
    assert.equal(mixed.filter((g) => g.kind === 'ibss').length, 1);
    assert.equal(mixed.filter((g) => g.kind === 'infrastructure').length, 1);
  });
});

describe('applyScanFilter', () => {
  it('filters band, open/secure, ssid, vendor OUI, min SNR, hidden/ibss', () => {
    const rows = buildDemoSnapshot().networks;
    const only24 = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, bands: [2.4] });
    assert.ok(only24.every((r) => r.channel.band === 2.4));

    const open = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, security: 'open' });
    assert.ok(open.every((r) => r.security.isOpen));
    assert.ok(
      open.some(
        (r) => r.identity.ssid.status === 'available' && r.identity.ssid.value.utf8 === 'Cafe-Free'
      )
    );
    assert.ok(!open.some((r) => r.security.primary === 'owe' || r.security.primary === 'wep'));

    const secure = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, security: 'secure' });
    assert.ok(secure.some((r) => r.security.primary === 'wep'));
    assert.ok(secure.some((r) => r.security.primary === 'owe'));

    const ssid = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, ssidQuery: 'campus' });
    assert.equal(ssid.length, 3);

    const vendor = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, vendorQuery: '02:11:22' });
    assert.equal(vendor.length, 1);
    const byName = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, vendorQuery: 'Apple' });
    assert.equal(byName.length, 0);

    const minSnr = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, minSnrDb: 40 });
    assert.ok(minSnr.every((r) => r.signal.snrDb != null && r.signal.snrDb >= 40));
    assert.ok(!minSnr.some((r) => r.lastRaw.bssid === DEMO_MISSING_NOISE.bssid));

    const noHidden = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, includeHiddenSsid: false });
    assert.ok(
      !noHidden.some((r) => r.identity.ssid.status === 'available' && r.identity.ssid.value.hidden)
    );

    const noIbss = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, includeIbss: false });
    assert.ok(!noIbss.some((r) => r.ibss));
  });
});

describe('location redaction vs hidden SSID', () => {
  it('treats all-null identity with granted location as redacted, not hidden', () => {
    const raw: CoreWlanNetworkRecord = {
      ...DEMO_CAMPUS_24,
      bssid: null,
      ssid: null,
      ssidData: null,
      countryCode: null,
    };
    const bss = mapCoreWlanRecordToObservedBss(raw, undefined, T0, { location: 'granted' });
    assert.equal(bss.identity.bssid.status, 'redacted');
    assert.equal(bss.identity.ssid.status, 'redacted');
  });

  it('keeps an empty ssidData array as a genuinely hidden network', () => {
    const raw: CoreWlanNetworkRecord = {
      ...DEMO_HIDDEN_A,
      bssid: '00:11:22:33:44:55',
      ssid: null,
      ssidData: [],
    };
    const bss = mapCoreWlanRecordToObservedBss(raw, undefined, T0, { location: 'granted' });
    assert.equal(bss.identity.ssid.status, 'available');
    if (bss.identity.ssid.status === 'available') {
      assert.equal(bss.identity.ssid.value.hidden, true);
    }
  });
});

describe('presence and mergeSnapshots', () => {
  it('stale after 1 miss, disappeared after 3; history ring 120 / 600s', () => {
    const first = buildDemoSnapshot([DEMO_OPEN, DEMO_CAMPUS_24], T0);
    let view = mergeSnapshots(null, first);
    const openKey = '00:11:22:0e:00:01';
    assert.equal(
      view.bssRows.find((r) => r.lastRaw.bssid === openKey)?.presence.presence,
      'current'
    );

    const t1 = asIsoTime('2026-09-17T19:00:08.000Z');
    view = mergeSnapshots(view, { ...buildDemoSnapshot([DEMO_CAMPUS_24], t1), capturedAt: t1 });
    const after1 = view.bssRows.find((r) => r.lastRaw.bssid === openKey)!;
    assert.equal(after1.presence.presence, 'stale');
    assert.equal(after1.presence.consecutiveMisses, 1);

    const t2 = asIsoTime('2026-09-17T19:00:16.000Z');
    view = mergeSnapshots(view, { ...buildDemoSnapshot([DEMO_CAMPUS_24], t2), capturedAt: t2 });
    assert.equal(
      view.bssRows.find((r) => r.lastRaw.bssid === openKey)?.presence.consecutiveMisses,
      2
    );
    assert.equal(view.bssRows.find((r) => r.lastRaw.bssid === openKey)?.presence.presence, 'stale');

    const t3 = asIsoTime('2026-09-17T19:00:24.000Z');
    view = mergeSnapshots(view, { ...buildDemoSnapshot([DEMO_CAMPUS_24], t3), capturedAt: t3 });
    const gone = view.bssRows.find((r) => r.lastRaw.bssid === openKey)!;
    assert.equal(gone.presence.presence, 'disappeared');
    assert.equal(gone.presence.consecutiveMisses, 3);

    const t4 = asIsoTime('2026-09-17T19:00:32.000Z');
    view = mergeSnapshots(view, {
      ...buildDemoSnapshot([DEMO_OPEN, DEMO_CAMPUS_24], t4),
      capturedAt: t4,
    });
    const back = view.bssRows.find((r) => r.lastRaw.bssid === openKey)!;
    assert.equal(back.presence.presence, 'current');
    assert.equal(back.presence.consecutiveMisses, 0);
    assert.equal(back.presence.firstSeenAt, T0);

    const old = asIsoTime('2026-09-17T18:49:00.000Z');
    const aged = mapCoreWlanRecordToObservedBss(DEMO_OPEN, undefined, old, { location: 'granted' });
    const agedWithHistory = {
      ...aged,
      rssiHistory: [
        { at: old, rssiDbm: -80, noiseDbm: -90, snrDb: 10, channelNumber: 11 },
        ...Array.from({ length: 119 }, (_, i) => ({
          at: asIsoTime(new Date(Date.parse(T0) - (119 - i) * 1000).toISOString()),
          rssiDbm: -70,
          noiseDbm: -90,
          snrDb: 20,
          channelNumber: 11,
        })),
      ],
    };
    const mapped = mapCoreWlanRecordToObservedBss(DEMO_OPEN, agedWithHistory, T0, {
      location: 'granted',
    });
    assert.ok(mapped.rssiHistory.length <= 120);
    assert.ok(!mapped.rssiHistory.some((p) => p.at === old));
    assert.equal(mapped.rssiHistory[mapped.rssiHistory.length - 1].at, T0);
  });
});

describe('demo fixtures', () => {
  it('covers same-SSID many BSSID, hidden, IBSS, open, WPA3, 2.4/5/6, randomized, missing noise', () => {
    assert.equal(DEMO_RAW_NETWORKS.length, 12);
    const view = buildDemoView();
    assert.equal(view.bssRows.length, 12);
    assert.ok(view.bssRows.some((r) => r.channel.band === 2.4));
    assert.ok(view.bssRows.some((r) => r.channel.band === 5));
    assert.ok(view.bssRows.some((r) => r.channel.band === 6));
    assert.ok(view.bssRows.some((r) => r.ibss));
    assert.ok(view.bssRows.some((r) => r.security.primary === 'wpa3-personal'));
    assert.ok(view.bssRows.some((r) => r.security.isOpen));
    assert.ok(view.bssRows.some((r) => r.vendor.match === 'randomized'));
    assert.ok(view.bssRows.some((r) => r.signal.snrDb == null));
    assert.ok(
      view.bssRows.some(
        (r) => r.identity.ssid.status === 'available' && r.identity.ssid.value.hidden
      )
    );
    assert.equal(map(DEMO_MISSING_NOISE).signal.qualityBasis, 'rssi-fallback');
    assert.ok(view.essGroups.length >= 8);
  });
});
