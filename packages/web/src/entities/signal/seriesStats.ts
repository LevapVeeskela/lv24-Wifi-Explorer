import type { SignalSeriesPoint } from './buildSignalSeries';

export type SeriesStats = {
  min: number;
  avg: number;
  max: number;
  count: number;
};

/** min/avg/max по точкам; `null`, если валидных точек нет. */
export function seriesStats(points: readonly SignalSeriesPoint[]): SeriesStats | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;
  let count = 0;

  for (const point of points) {
    if (!Number.isFinite(point.y)) continue;
    min = Math.min(min, point.y);
    max = Math.max(max, point.y);
    sum += point.y;
    count += 1;
  }

  if (count === 0) return null;
  return { min, avg: sum / count, max, count };
}
