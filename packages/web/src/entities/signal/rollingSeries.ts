import type { SignalSeriesPoint } from './buildSignalSeries';

/** Окно сглаживания по умолчанию, в точках. */
export const DEFAULT_ROLLING_WINDOW = 5;

export type RollingSeriesKind = 'average' | 'max';

export type BuildRollingSeriesOptions = {
  /** Размер окна в точках; <1 → 1, не задан/NaN → {@link DEFAULT_ROLLING_WINDOW}. */
  window?: number;
};

export type RollingSeriesPoint = SignalSeriesPoint;

function normalizeWindow(size: number | undefined): number {
  if (size == null || !Number.isFinite(size)) return DEFAULT_ROLLING_WINDOW;
  return Math.max(1, Math.floor(size));
}

/** Только точки с валидными x/y: NaN/нечисла в окно не попадают. */
function finitePoints(points: readonly SignalSeriesPoint[]): SignalSeriesPoint[] {
  return points.filter((point) => Number.isFinite(point.x.getTime()) && Number.isFinite(point.y));
}

/**
 * Скользящее окно по последним `window` точкам (включая текущую).
 * В начале серии окно неполное — поэтому результат выровнен 1:1 по x исходных точек.
 */
function buildRollingSeries(
  points: readonly SignalSeriesPoint[],
  windowSize: number | undefined,
  aggregate: (values: readonly number[]) => number
): SignalSeriesPoint[] {
  const window = normalizeWindow(windowSize);
  const source = finitePoints(points);
  const out: SignalSeriesPoint[] = [];

  for (let index = 0; index < source.length; index += 1) {
    const start = Math.max(0, index - window + 1);
    const values: number[] = [];
    for (let cursor = start; cursor <= index; cursor += 1) {
      values.push(source[cursor]!.y);
    }
    out.push({ x: new Date(source[index]!.x.getTime()), y: aggregate(values) });
  }

  return out;
}

/** Скользящее среднее по окну `windowSize` точек, x совпадают с исходными. */
export function buildAverageSeries(
  points: readonly SignalSeriesPoint[],
  windowSize: number = DEFAULT_ROLLING_WINDOW
): SignalSeriesPoint[] {
  return buildRollingSeries(points, windowSize, (values) => {
    let sum = 0;
    for (const value of values) sum += value;
    return sum / values.length;
  });
}

/** Скользящий максимум по окну `windowSize` точек, x совпадают с исходными. */
export function buildMaxSeries(
  points: readonly SignalSeriesPoint[],
  windowSize: number = DEFAULT_ROLLING_WINDOW
): SignalSeriesPoint[] {
  return buildRollingSeries(points, windowSize, (values) => {
    let max = Number.NEGATIVE_INFINITY;
    for (const value of values) {
      if (value > max) max = value;
    }
    return max;
  });
}
