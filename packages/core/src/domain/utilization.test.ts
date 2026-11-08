import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { ObservedBss } from './bss';
import {
  computeUtilization,
  DEFAULT_BEACON_BYTES,
  FALLBACK_BEACON_INTERVAL_SEC,
  FALLBACK_BEACON_RATE_MBPS,
} from './utilization';

function mockBss(partial: {
  bssid: string;
  band: 2.4 | 5 | 6;
  channel: number;
  widthMhz?: 20 | 40 | 80;
  rssiDbm: number;
  beaconIntervalMs?: number;
  maxRateMbps?: number | null;
}): ObservedBss {
  return {
    identity: {
      bssid: { status: 'available', value: partial.bssid },
      ssid: { status: 'redacted', reason: 'location-required' },
    },
    beaconIntervalMs: partial.beaconIntervalMs ?? 100,
    channel: {
      number: partial.channel,
      band: partial.band,
      widthMhz: partial.widthMhz ?? 20,
      primaryCenterMhz: 5000 + 5 * partial.channel,
      occupyingCenterMhz: 5000 + 5 * partial.channel,
      occupyingSpanMhz: null,
      centerConfidence: 'ieee-primary-20',
    },
    signal: { rssiDbm: partial.rssiDbm },
    maxRate:
      partial.maxRateMbps == null
        ? null
        : {
            mbpsLow: partial.maxRateMbps,
            mbpsHigh: null,
            basis: 'phy-mode',
            nssUsed: 1,
            disclaimer: 'not-a-link-speed',
          },
  } as unknown as ObservedBss;
}

describe('computeUtilization', () => {
  it('groups by band/channel and sorts ascending', () => {
    const report = computeUtilization([
      mockBss({ bssid: 'aa:00:00:00:00:01', band: 5, channel: 44, rssiDbm: -60 }),
      mockBss({ bssid: 'aa:00:00:00:00:02', band: 2.4, channel: 6, rssiDbm: -50 }),
      mockBss({ bssid: 'aa:00:00:00:00:03', band: 2.4, channel: 1, rssiDbm: -70 }),
      mockBss({ bssid: 'aa:00:00:00:00:04', band: 2.4, channel: 6, rssiDbm: -40 }),
    ]);

    assert.deepEqual(
      report.channels.map((row) => `${row.band}:${row.channel}`),
      ['2.4:1', '2.4:6', '5:44']
    );
    const ch6 = report.channels.find((row) => row.band === 2.4 && row.channel === 6);
    assert.ok(ch6);
    assert.equal(ch6.networkCount, 2);
    assert.equal(ch6.strongestRssiDbm, -40);
    assert.equal(ch6.averageRssiDbm, -45);
    assert.equal(report.overall.networkCount, 4);
    assert.deepEqual(
      report.byBand.map((total) => total.band),
      [2.4, 5]
    );
  });

  it('counts overlapping BSS using primary channel overlap', () => {
    const report = computeUtilization([
      mockBss({ bssid: 'aa:00:00:00:00:01', band: 2.4, channel: 6, rssiDbm: -50 }),
      // 20 MHz on ch 8: |8-6|*5 = 10 < 10+10 → overlaps ch 6.
      mockBss({ bssid: 'aa:00:00:00:00:02', band: 2.4, channel: 8, rssiDbm: -60 }),
      // 20 MHz on ch 13: |13-6|*5 = 35 ≥ 20 → no overlap with ch 6.
      mockBss({ bssid: 'aa:00:00:00:00:03', band: 2.4, channel: 13, rssiDbm: -65 }),
      // Different band never overlaps.
      mockBss({ bssid: 'aa:00:00:00:00:04', band: 5, channel: 6, rssiDbm: -70 }),
    ]);

    const ch6 = report.channels.find((row) => row.band === 2.4 && row.channel === 6);
    assert.ok(ch6);
    assert.equal(ch6.networkCount, 1);
    assert.equal(ch6.overlappingBssCount, 2);
    const ch13 = report.channels.find((row) => row.band === 2.4 && row.channel === 13);
    assert.equal(ch13?.overlappingBssCount, 1);
  });

  it('computes beacon overhead estimate with the documented formula', () => {
    const beaconBytes = 200;
    const report = computeUtilization(
      [
        mockBss({
          bssid: 'aa:00:00:00:00:01',
          band: 5,
          channel: 36,
          rssiDbm: -50,
          beaconIntervalMs: 100,
          maxRateMbps: 866,
        }),
        mockBss({
          bssid: 'aa:00:00:00:00:02',
          band: 5,
          channel: 36,
          rssiDbm: -60,
          beaconIntervalMs: 200,
          maxRateMbps: 433,
        }),
      ],
      { beaconBytes }
    );

    const ch36 = report.channels[0];
    assert.ok(ch36);
    const pctOf = (bytes: number, mbps: number, intervalSec: number) =>
      ((bytes * 8) / (mbps * 1_000_000) / intervalSec) * 100;
    const expected = pctOf(beaconBytes, 866, 0.1) + pctOf(beaconBytes, 433, 0.2);
    assert.equal(ch36.beacon.estimate, true);
    assert.equal(ch36.beacon.contributingBss, 2);
    assert.equal(ch36.beacon.usedFallbackRate, false);
    assert.equal(ch36.beacon.usedFallbackInterval, false);
    assert.ok(Math.abs(ch36.beacon.beaconAirtimePct - expected) < 0.001);
    assert.equal(report.overall.beaconAirtimePct, ch36.beacon.beaconAirtimePct);
  });

  it('falls back for missing maxRate / beacon interval', () => {
    const report = computeUtilization([
      mockBss({
        bssid: 'aa:00:00:00:00:01',
        band: 2.4,
        channel: 1,
        rssiDbm: -50,
        beaconIntervalMs: 0,
        maxRateMbps: null,
      }),
    ]);

    const ch1 = report.channels[0];
    assert.ok(ch1);
    assert.equal(ch1.beacon.usedFallbackRate, true);
    assert.equal(ch1.beacon.usedFallbackInterval, true);
    const expected =
      ((DEFAULT_BEACON_BYTES * 8) /
        (FALLBACK_BEACON_RATE_MBPS * 1_000_000) /
        FALLBACK_BEACON_INTERVAL_SEC) *
      100;
    assert.ok(Math.abs(ch1.beacon.beaconAirtimePct - expected) < 0.001);
  });

  it('clamps beacon overhead at 100%', () => {
    const report = computeUtilization(
      [mockBss({ bssid: 'aa:00:00:00:00:01', band: 2.4, channel: 1, rssiDbm: -50 })],
      { beaconBytes: 1_000_000 }
    );
    assert.equal(report.channels[0]?.beacon.beaconAirtimePct, 100);
    assert.equal(report.overall.beaconAirtimePct, 100);
  });

  it('returns an empty report for an empty scan', () => {
    const report = computeUtilization([]);
    assert.deepEqual(report.channels, []);
    assert.deepEqual(report.byBand, []);
    assert.equal(report.overall.networkCount, 0);
    assert.equal(report.overall.channelCount, 0);
    assert.equal(report.overall.strongestRssiDbm, null);
    assert.equal(report.overall.averageRssiDbm, null);
    assert.equal(report.overall.beaconAirtimePct, 0);
    assert.equal(report.estimate, true);
  });
});
