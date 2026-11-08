import type { ObservedBss } from '@/domain/bss';
import { rssiToBarPercent } from '@/entities/bss';
import { timescaleWindowMs } from './timescale';
import type { ChartTimescale, SignalChartMetric, SignalChartUnit } from './types';

export type SignalSeriesPoint = {
  x: Date;
  y: number;
};

export type BuildSignalSeriesOptions = {
  timescale?: ChartTimescale;
  nowMs?: number;
};

export type BuildMetricSeriesOptions = BuildSignalSeriesOptions & {
  /** Единица RSSI (`pct` / `dbm`); для SNR и noise игнорируется. */
  unit?: SignalChartUnit;
};

type MetricSample = {
  rssiDbm: number;
  noiseDbm: number | null;
  snrDb: number | null;
};

function pointY(rssiDbm: number, unit: SignalChartUnit): number {
  return unit === 'dbm' ? rssiDbm : rssiToBarPercent(rssiDbm);
}

/** Значение метрики в единицах её оси; `null` — точку рисовать нельзя. */
function metricValue(
  sample: MetricSample,
  metric: SignalChartMetric,
  unit: SignalChartUnit
): number | null {
  const raw =
    metric === 'rssi'
      ? pointY(sample.rssiDbm, unit)
      : metric === 'snr'
        ? sample.snrDb
        : sample.noiseDbm;
  return raw != null && Number.isFinite(raw) ? raw : null;
}

export function filterSeriesByTimescale(
  points: readonly SignalSeriesPoint[],
  timescale: ChartTimescale,
  nowMs: number
): SignalSeriesPoint[] {
  const windowMs = timescaleWindowMs(timescale);
  const last = points[points.length - 1];
  const anchor = last ? Math.max(nowMs, last.x.getTime()) : nowMs;
  const start = anchor - windowMs;
  return points.filter((point) => {
    const t = point.x.getTime();
    return Number.isFinite(t) && t >= start && t <= anchor;
  });
}

function buildMetricPoints(
  bss: ObservedBss,
  metric: SignalChartMetric,
  unit: SignalChartUnit
): SignalSeriesPoint[] {
  if (bss.rssiHistory.length > 0) {
    const points: SignalSeriesPoint[] = [];
    for (const sample of bss.rssiHistory) {
      const y = metricValue(sample, metric, unit);
      if (y == null) continue;
      points.push({ x: new Date(sample.at), y });
    }
    if (points.length > 0) return points;
  }

  const fallback = metricValue(
    {
      rssiDbm: bss.signal.rssiDbm,
      noiseDbm: bss.signal.noiseDbm,
      snrDb: bss.signal.snrDb,
    },
    metric,
    unit
  );
  if (fallback == null) return [];
  return [{ x: new Date(bss.presence.lastSeenAt), y: fallback }];
}

function applyTimescale(
  raw: readonly SignalSeriesPoint[],
  options: BuildSignalSeriesOptions
): SignalSeriesPoint[] {
  const timescale = options.timescale;
  if (!timescale) return [...raw];
  const filtered = filterSeriesByTimescale(raw, timescale, options.nowMs ?? Date.now());
  if (filtered.length > 0) return filtered;
  const last = raw[raw.length - 1];
  return last ? [last] : [];
}

/**
 * История выбранной метрики для BSS: RSSI (% или dBm), SNR (dB), noise (dBm).
 * Точки без валидного значения (SNR/noise = null) пропускаются.
 */
export function buildMetricSeries(
  bss: ObservedBss | null,
  metric: SignalChartMetric,
  options: BuildMetricSeriesOptions = {}
): SignalSeriesPoint[] {
  if (!bss) return [];
  const raw = buildMetricPoints(bss, metric, options.unit ?? 'dbm');
  return applyTimescale(raw, options);
}

export function buildSignalSeries(
  bss: ObservedBss | null,
  unit: SignalChartUnit,
  options: BuildSignalSeriesOptions = {}
): SignalSeriesPoint[] {
  return buildMetricSeries(bss, 'rssi', { ...options, unit });
}
