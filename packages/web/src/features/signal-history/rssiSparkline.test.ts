import { describe, expect, it } from 'vitest';
import type { ObservedBss } from '@/domain/bss';
import { rssiSparklinePoints } from './rssiSparkline';

function bss(rssiHistory: number[], currentRssi = -50): ObservedBss {
  return {
    signal: { rssiDbm: currentRssi },
    rssiHistory: rssiHistory.map((rssiDbm, index) => ({
      at: `2026-01-01T00:00:${String(index).padStart(2, '0')}Z`,
      rssiDbm,
    })),
  } as unknown as ObservedBss;
}

describe('rssiSparklinePoints', () => {
  it('returns empty string when there is no data', () => {
    expect(rssiSparklinePoints(null)).toBe('');
  });

  it('renders a single centered point for one sample', () => {
    const points = rssiSparklinePoints(bss([-60]), { width: 40, height: 20 });
    expect(points).toBe('20.0,10.0');
  });

  it('maps history to x/y points across the box', () => {
    const points = rssiSparklinePoints(bss([-70, -60, -50]), { width: 40, height: 20 });
    const coords = points.split(' ').map((p) => p.split(',').map(Number));
    expect(coords).toHaveLength(3);
    // x spans from pad to width-pad
    expect(coords[0]?.[0]).toBeCloseTo(2, 1);
    expect(coords[2]?.[0]).toBeCloseTo(38, 1);
    // higher RSSI → smaller y (higher on chart)
    const firstY = coords[0]?.[1];
    const lastY = coords[2]?.[1];
    if (firstY === undefined || lastY === undefined) throw new Error('missing coords');
    expect(firstY).toBeGreaterThan(lastY);
  });

  it('falls back to the current RSSI when history is empty', () => {
    const points = rssiSparklinePoints(bss([], -55));
    expect(points).not.toBe('');
  });
});
