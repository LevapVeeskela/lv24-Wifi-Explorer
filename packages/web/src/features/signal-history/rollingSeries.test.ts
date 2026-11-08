import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { buildAverageSeries, buildMaxSeries, DEFAULT_ROLLING_WINDOW } from './rollingSeries';
import type { SignalSeriesPoint } from './buildSignalSeries';

const BASE = Date.parse('2026-09-17T19:00:00.000Z');

function pointsAt(values: number[], stepMs = 1_000): SignalSeriesPoint[] {
  return values.map((y, index) => ({ x: new Date(BASE + index * stepMs), y }));
}

function ys(points: readonly SignalSeriesPoint[]): number[] {
  return points.map((point) => point.y);
}

describe('buildAverageSeries', () => {
  it('averages a trailing window and uses a partial window at the start', () => {
    const series = buildAverageSeries(pointsAt([10, 20, 30, 40, 50]), 2);
    assert.deepEqual(ys(series), [10, 15, 25, 35, 45]);
  });

  it('defaults to a 5-point window', () => {
    const series = buildAverageSeries(pointsAt([0, 10, 20, 30, 40, 50]));
    assert.equal(DEFAULT_ROLLING_WINDOW, 5);
    assert.deepEqual(ys(series), [0, 5, 10, 15, 20, 30]);
  });

  it('keeps alignment with the x points', () => {
    const source = pointsAt([10, 20, 30]);
    const series = buildAverageSeries(source, 2);
    assert.deepEqual(
      series.map((point) => point.x.toISOString()),
      source.map((point) => point.x.toISOString())
    );
    assert.notEqual(series[0]?.x, source[0]?.x);
    assert.equal(source[0]?.y, 10);
  });

  it('clamps invalid windows to the nearest sane size', () => {
    const source = pointsAt([10, 20, 30]);
    assert.deepEqual(ys(buildAverageSeries(source, 0)), [10, 20, 30]);
    assert.deepEqual(ys(buildAverageSeries(source, -3)), [10, 20, 30]);
    assert.deepEqual(ys(buildAverageSeries(source, 2.7)), [10, 15, 25]);
    // NaN → default window (larger than the series → cumulative average).
    assert.deepEqual(ys(buildAverageSeries(source, Number.NaN)), [10, 15, 20]);
  });

  it('skips non-finite samples and ignores them in the window', () => {
    const source = pointsAt([10, Number.NaN, 30, Number.POSITIVE_INFINITY, 50]);
    const series = buildAverageSeries(source, 2);
    assert.deepEqual(ys(series), [10, 20, 40]);
    assert.deepEqual(
      series.map((point) => point.x.toISOString()),
      [0, 2, 4].map((index) => new Date(BASE + index * 1_000).toISOString())
    );
  });

  it('returns empty for an empty or fully invalid series', () => {
    assert.deepEqual(buildAverageSeries([], 3), []);
    assert.deepEqual(buildAverageSeries(pointsAt([Number.NaN, Number.NEGATIVE_INFINITY]), 3), []);
  });
});

describe('buildMaxSeries', () => {
  it('takes the trailing window maximum', () => {
    const series = buildMaxSeries(pointsAt([10, 30, 20, 5, 40]), 2);
    assert.deepEqual(ys(series), [10, 30, 30, 20, 40]);
  });

  it('uses a partial window at the start and keeps x alignment', () => {
    const source = pointsAt([-70, -55, -60]);
    const series = buildMaxSeries(source, 3);
    assert.deepEqual(ys(series), [-70, -55, -55]);
    assert.deepEqual(
      series.map((point) => point.x.getTime()),
      source.map((point) => point.x.getTime())
    );
  });

  it('clamps a window larger than the series to cumulative max', () => {
    const series = buildMaxSeries(pointsAt([3, 1, 2]), 999);
    assert.deepEqual(ys(series), [3, 3, 3]);
  });

  it('skips non-finite samples and returns empty without valid data', () => {
    assert.deepEqual(
      ys(buildMaxSeries(pointsAt([Number.NaN, 7, null as unknown as number]), 2)),
      [7]
    );
    assert.deepEqual(buildMaxSeries(pointsAt([Number.NaN]), 2), []);
  });
});
