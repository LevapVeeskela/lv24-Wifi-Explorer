import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { buildSignalSeries, filterSeriesByTimescale } from './buildSignalSeries';
import { stepTimescale, TIMESCALE_MS } from './timescale';
import type { ObservedBss } from '@/domain/bss';

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
    const now = Date.parse('2026-09-17T19:00:00.000Z');
    const points = [
      { x: new Date(now - 120_000), y: 40 },
      { x: new Date(now - 20_000), y: 50 },
      { x: new Date(now), y: 60 },
    ];
    const kept = filterSeriesByTimescale(points, '30s', now);
    assert.equal(kept.length, 2);
    assert.equal(kept[0]?.y, 50);
  });
});

describe('buildSignalSeries', () => {
  it('returns empty without a BSS', () => {
    assert.deepEqual(buildSignalSeries(null, 'pct'), []);
  });

  it('maps history to percent or dBm', () => {
    const bss = {
      rssiHistory: [
        { at: '2026-09-17T19:00:00.000Z', rssiDbm: -50, noiseDbm: -95, snrDb: 45, channelNumber: 6 },
      ],
      signal: { rssiDbm: -50 },
      presence: { lastSeenAt: '2026-09-17T19:00:00.000Z' },
    } as unknown as ObservedBss;
    const pct = buildSignalSeries(bss, 'pct');
    const dbm = buildSignalSeries(bss, 'dbm');
    assert.equal(dbm[0]?.y, -50);
    assert.ok((pct[0]?.y ?? 0) > 0);
    assert.ok((pct[0]?.y ?? 0) <= 100);
  });
});
