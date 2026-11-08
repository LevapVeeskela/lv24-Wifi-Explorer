export type ChartTimescale = '30s' | '1m' | '5m' | '15m' | '1h';

export const TIMESCALE_ORDER: ChartTimescale[] = ['30s', '1m', '5m', '15m', '1h'];

export type SignalChartUnit = 'pct' | 'dbm';

/** Метрика истории сигнала: RSSI (%, dBm), SNR (dB), noise (dBm). */
export type SignalChartMetric = 'rssi' | 'snr' | 'noise';

export const METRIC_ORDER: readonly SignalChartMetric[] = ['rssi', 'snr', 'noise'];
