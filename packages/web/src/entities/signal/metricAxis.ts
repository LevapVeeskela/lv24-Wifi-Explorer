import type { SignalChartMetric, SignalChartUnit } from './types';

/** Единица оси Y выбранной метрики. */
export type MetricAxisUnit = 'pct' | 'dbm' | 'db';

export type MetricAxis = {
  min: number;
  max: number;
  unit: MetricAxisUnit;
};

export const METRIC_AXIS = {
  'rssi-pct': { min: 0, max: 100, unit: 'pct' },
  'rssi-dbm': { min: -100, max: 0, unit: 'dbm' },
  snr: { min: 0, max: 60, unit: 'db' },
  noise: { min: -100, max: -20, unit: 'dbm' },
} as const satisfies Record<string, MetricAxis>;

export function metricAxis(metric: SignalChartMetric, unit: SignalChartUnit): MetricAxis {
  if (metric === 'rssi') return unit === 'dbm' ? METRIC_AXIS['rssi-dbm'] : METRIC_AXIS['rssi-pct'];
  return METRIC_AXIS[metric];
}

/** Единица по умолчанию для метрики (RSSI — согласно выбранному unit). */
export function metricAxisUnit(metric: SignalChartMetric, unit: SignalChartUnit): MetricAxisUnit {
  return metricAxis(metric, unit).unit;
}

function suffixOf(unit: MetricAxisUnit): string {
  if (unit === 'pct') return '%';
  return unit === 'db' ? 'dB' : 'dBm';
}

/** Число с единицей: `52 %`, `-63 dBm`, `38 dB`. Округление до 0.1. */
export function formatMetricValue(unit: MetricAxisUnit, value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  const text = `${rounded}`;
  return unit === 'pct' ? `${text}%` : `${text} ${suffixOf(unit)}`;
}
