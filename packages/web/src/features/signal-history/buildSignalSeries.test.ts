import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { buildMetricSeries, buildSignalSeries, filterSeriesByTimescale } from './buildSignalSeries';
import { stepTimescale, TIMESCALE_MS } from './timescale';
import type { ObservedBss } from '@/domain/bss';

const NOW = '2026-09-17T19:00:00.000Z';
const NOW_MS = Date.parse(NOW);

function bssWithHistory(
  points: { at: string; rssiDbm: number; noiseDbm: number | null; snrDb: number | null }[]
): ObservedBss {
  return {
    rssiHistory: points.map((point) => ({ ...point, channelNumber: 6 })),
    signal: { rssiDbm: -50, noiseDbm: -95, snrDb: 45 },
    presence: { lastSeenAt: NOW },
  } as unknown as ObservedBss;
}

describe('timescale', () => {
  it('steps 30s → 1m → … → 1h and clamps', () => {
    assert.equal(stepTimescale('30s', 1), '1m');
    assert.equal(stepTimescale('1h', 1), '1h');
    assert.equal(stepTimescale('30s', -1), '30s');
    assert.equal(stepTimescale('5m', -1), '1m');
  });

  it('maps button ids to window lengths', () => {
    assert.equal(TIMESCALE_MS['30s'], 30_000);
    assert.equal(TIMESCALE_MS['1m'], 60_000);
    assert.equal(TIMESCALE_MS['5m'], 300_000);
    assert.equal(TIMESCALE_MS['15m'], 900_000);
    assert.equal(TIMESCALE_MS['1h'], 3_600_000);
  });
});

describe('filterSeriesByTimescale', () => {
  it('keeps only points inside the window', () => {
    const points = [
      { x: new Date(NOW_MS - 120_000), y: 40 },
      { x: new Date(NOW_MS - 20_000), y: 50 },
      { x: new Date(NOW_MS), y: 60 },
    ];
    const kept = filterSeriesByTimescale(points, '30s', NOW_MS);
    assert.equal(kept.length, 2);
    assert.equal(kept[0]?.y, 50);
  });
});

describe('buildSignalSeries', () => {
  it('returns empty without a BSS', () => {
    assert.deepEqual(buildSignalSeries(null, 'pct'), []);
  });

  it('maps history to percent or dBm', () => {
    const bss = bssWithHistory([{ at: NOW, rssiDbm: -50, noiseDbm: -95, snrDb: 45 }]);
    const pct = buildSignalSeries(bss, 'pct');
    const dbm = buildSignalSeries(bss, 'dbm');
    assert.equal(dbm[0]?.y, -50);
    assert.ok((pct[0]?.y ?? 0) > 0);
    assert.ok((pct[0]?.y ?? 0) <= 100);
  });
});

describe('buildMetricSeries', () => {
  it('maps SNR to dB and skips samples without SNR', () => {
    const bss = bssWithHistory([
      { at: '2026-09-17T18:59:00.000Z', rssiDbm: -60, noiseDbm: null, snrDb: null },
      { at: '2026-09-17T18:59:30.000Z', rssiDbm: -55, noiseDbm: -95, snrDb: 40 },
      { at: NOW, rssiDbm: -50, noiseDbm: -95, snrDb: 45 },
    ]);
    const series = buildMetricSeries(bss, 'snr');
    assert.deepEqual(
      series.map((point) => point.y),
      [40, 45]
    );
    assert.equal(series[0]?.x.toISOString(), '2026-09-17T18:59:30.000Z');
  });

  it('maps noise to dBm and skips samples without noise', () => {
    const bss = bssWithHistory([
      { at: '2026-09-17T18:59:00.000Z', rssiDbm: -60, noiseDbm: null, snrDb: null },
      { at: NOW, rssiDbm: -50, noiseDbm: -92, snrDb: 42 },
    ]);
    const series = buildMetricSeries(bss, 'noise');
    assert.deepEqual(
      series.map((point) => point.y),
      [-92]
    );
  });

  it('treats RSSI as dBm by default and honours unit', () => {
    const bss = bssWithHistory([{ at: NOW, rssiDbm: -50, noiseDbm: -95, snrDb: 45 }]);
    assert.equal(buildMetricSeries(bss, 'rssi')[0]?.y, -50);
    const pct = buildMetricSeries(bss, 'rssi', { unit: 'pct' })[0]?.y ?? -1;
    assert.ok(pct > 0 && pct <= 100);
  });

  it('falls back to the last signal sample when history is empty', () => {
    const bss = {
      rssiHistory: [],
      signal: { rssiDbm: -62, noiseDbm: -94, snrDb: 32 },
      presence: { lastSeenAt: NOW },
    } as unknown as ObservedBss;
    assert.deepEqual(
      buildMetricSeries(bss, 'snr').map((point) => point.y),
      [32]
    );
    assert.deepEqual(
      buildMetricSeries(bss, 'noise').map((point) => point.y),
      [-94]
    );
  });

  it('returns empty when the metric has no valid sample', () => {
    const bss = {
      rssiHistory: [],
      signal: { rssiDbm: -62, noiseDbm: null, snrDb: null },
      presence: { lastSeenAt: NOW },
    } as unknown as ObservedBss;
    assert.deepEqual(buildMetricSeries(bss, 'snr'), []);
    assert.deepEqual(buildMetricSeries(null, 'noise'), []);
  });

  it('filters by timescale and keeps the last point when the window is empty', () => {
    const bss = bssWithHistory([
      { at: '2026-09-17T18:55:00.000Z', rssiDbm: -70, noiseDbm: -95, snrDb: 25 },
      { at: '2026-09-17T18:59:40.000Z', rssiDbm: -55, noiseDbm: -95, snrDb: 40 },
      { at: NOW, rssiDbm: -50, noiseDbm: -95, snrDb: 45 },
    ]);
    const filtered = buildMetricSeries(bss, 'snr', { timescale: '30s', nowMs: NOW_MS });
    assert.deepEqual(
      filtered.map((point) => point.y),
      [40, 45]
    );

    const stale = bssWithHistory([
      { at: '2026-09-17T18:40:00.000Z', rssiDbm: -70, noiseDbm: -95, snrDb: 25 },
      { at: '2026-09-17T18:50:00.000Z', rssiDbm: -60, noiseDbm: -95, snrDb: 35 },
    ]);
    const kept = buildMetricSeries(stale, 'snr', { timescale: '30s', nowMs: NOW_MS });
    assert.deepEqual(
      kept.map((point) => point.y),
      [35]
    );
  });
});
