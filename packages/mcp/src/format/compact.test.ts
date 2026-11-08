// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { asIsoTime, type CoreWlanNetworkRecord } from '@lv24/wifi-core';
import { mapCoreWlanRecordsToObservedBss } from '@lv24/wifi-core/scan';
import { COMPACT_FIELDS, selectFields, toCompactNetwork, unknownFields } from './compact.js';

const CAPTURED_AT = asIsoTime('2026-01-01T00:00:00.000Z');

function mapOne(raw: Partial<CoreWlanNetworkRecord>) {
  const record: CoreWlanNetworkRecord = {
    ssid: null,
    ssidData: [],
    bssid: 'aa:bb:cc:dd:ee:ff',
    rssiDbm: -70,
    noiseDbm: -95,
    channelNumber: 149,
    channelBand: '5ghz',
    channelWidth: 'unknown',
    countryCode: null,
    beaconIntervalMs: 100,
    ibss: false,
    informationElementData: null,
    supportedSecurity: ['open'],
    supportedPhyModes: ['ac'],
    ...raw,
  };
  return mapCoreWlanRecordsToObservedBss([record], undefined, CAPTURED_AT, {
    location: 'granted',
  })[0]!;
}

describe('toCompactNetwork', () => {
  it('marks a hidden SSID and nulls an unknown width', () => {
    const compact = toCompactNetwork(mapOne({}));

    expect(compact).toMatchObject({
      bssid: 'aa:bb:cc:dd:ee:ff',
      ssid: null,
      hidden: true,
      rssiDbm: -70,
      snrDb: 25,
      noiseDbm: -95,
      channel: 149,
      band: 5,
      widthMhz: null,
      security: 'open',
      phy: 'ac',
      lastSeenAt: CAPTURED_AT,
    });
  });

  it('projects a visible SSID and a known width', () => {
    const compact = toCompactNetwork(
      mapOne({
        ssid: 'LV24-Lab',
        ssidData: [...Buffer.from('LV24-Lab')],
        channelNumber: 36,
        channelWidth: '80mhz',
        supportedSecurity: ['wpa3-personal'],
        supportedPhyModes: ['ac', 'ax'],
      })
    );

    expect(compact.ssid).toBe('LV24-Lab');
    expect(compact.hidden).toBe(false);
    expect(compact.widthMhz).toBe(80);
    expect(compact.security).toBe('wpa3-personal');
    expect(compact.phy).toBe('ac/ax');
    expect(compact.vendor).toBeNull();
  });

  it('nulls location-gated fields when location is denied', () => {
    const [row] = mapCoreWlanRecordsToObservedBss(
      [
        {
          ssid: 'x',
          ssidData: [0x78],
          bssid: 'aa:bb:cc:dd:ee:ff',
          rssiDbm: -60,
          noiseDbm: -90,
          channelNumber: 6,
          channelBand: '2ghz',
          channelWidth: '20mhz',
          countryCode: null,
          beaconIntervalMs: 100,
          ibss: false,
          informationElementData: null,
          supportedSecurity: ['wpa2-personal'],
          supportedPhyModes: ['n'],
        },
      ],
      undefined,
      CAPTURED_AT,
      { location: 'denied' }
    );
    const compact = toCompactNetwork(row!);

    expect(compact.bssid).toBeNull();
    expect(compact.ssid).toBeNull();
    expect(compact.hidden).toBeNull();
    expect(compact.security).toBe('wpa2-personal');
  });
});

describe('selectFields', () => {
  it('returns the default compact set when no fields are requested', () => {
    const [row] = selectFields([mapOne({})]);
    expect(Object.keys(row)).toEqual([...COMPACT_FIELDS]);
  });

  it('returns only the requested fields', () => {
    const [row] = selectFields([mapOne({})], ['bssid', 'channel']);
    expect(Object.keys(row)).toEqual(['bssid', 'channel']);
    expect(row.bssid).toBe('aa:bb:cc:dd:ee:ff');
  });

  it('ignores unknown fields with a warning', () => {
    const warn = vi.fn<(message: string) => void>();
    const [row] = selectFields([mapOne({})], ['bssid', 'bogus'], warn);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('bogus'));
    expect(Object.keys(row)).toEqual(['bssid']);
    expect(unknownFields(['bssid', 'bogus'])).toEqual(['bogus']);
  });
});
