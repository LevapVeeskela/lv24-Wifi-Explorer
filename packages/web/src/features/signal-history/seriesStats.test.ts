import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { seriesStats } from './seriesStats';
import type { SignalSeriesPoint } from './buildSignalSeries';

function points(...values: number[]): SignalSeriesPoint[] {
  return values.map((y, index) => ({ x: new Date(index * 1000), y }));
}

describe('seriesStats', () => {
  it('computes min/avg/max and count', () => {
    const stats = seriesStats(points(-60, -50, -70));
    assert.ok(stats);
    assert.equal(stats.min, -70);
    assert.equal(stats.max, -50);
    assert.equal(stats.avg, -60);
    assert.equal(stats.count, 3);
  });

  it('returns null for empty input', () => {
    assert.equal(seriesStats([]), null);
  });

  it('ignores non-finite values and returns null when nothing is valid', () => {
    const mixed = [...points(-60, -50), { x: new Date(3000), y: Number.NaN }];
    const stats = seriesStats(mixed);
    assert.ok(stats);
    assert.equal(stats.count, 2);
    assert.equal(stats.avg, -55);

    assert.equal(seriesStats([{ x: new Date(0), y: Number.POSITIVE_INFINITY }]), null);
  });
});
