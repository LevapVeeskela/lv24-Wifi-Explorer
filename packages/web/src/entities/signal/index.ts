/**
 * Signal entity — pure time-series math for RSSI/SNR/noise charts and the
 * per-row sparkline. No React, no i18n catalogs.
 */
export {
  buildMetricSeries,
  buildSignalSeries,
  filterSeriesByTimescale,
  type BuildMetricSeriesOptions,
  type BuildSignalSeriesOptions,
  type SignalSeriesPoint,
} from './buildSignalSeries';
export { rssiSparklinePoints, type SparklineGeometry } from './rssiSparkline';
export {
  formatMetricValue,
  metricAxis,
  metricAxisUnit,
  METRIC_AXIS,
  type MetricAxis,
  type MetricAxisUnit,
} from './metricAxis';
export {
  buildAverageSeries,
  buildMaxSeries,
  DEFAULT_ROLLING_WINDOW,
  type BuildRollingSeriesOptions,
  type RollingSeriesKind,
  type RollingSeriesPoint,
} from './rollingSeries';
export { seriesStats, type SeriesStats } from './seriesStats';
export { stepTimescale, TIMESCALE_MS, timescaleWindowMs } from './timescale';
export {
  METRIC_ORDER,
  TIMESCALE_ORDER,
  type ChartTimescale,
  type SignalChartMetric,
  type SignalChartUnit,
} from './types';
