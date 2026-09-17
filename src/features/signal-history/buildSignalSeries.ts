import type { ObservedBss } from '@/domain/bss';
import { rssiToBarPercent } from '@/entities/bss/formatters';
import { timescaleWindowMs } from './timescale';
import type { ChartTimescale, SignalChartUnit } from './types';

export type SignalSeriesPoint = {
  x: Date;
  y: number;
};

export type BuildSignalSeriesOptions = {
  timescale?: ChartTimescale;
  nowMs?: number;
};

function pointY(rssiDbm: number, unit: SignalChartUnit): number {
  return unit === 'dbm' ? rssiDbm : rssiToBarPercent(rssiDbm);
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

export function buildSignalSeries(
  bss: ObservedBss | null,
  unit: SignalChartUnit,
  options: BuildSignalSeriesOptions = {}
): SignalSeriesPoint[] {
  if (!bss) return [];

  const raw =
    bss.rssiHistory.length > 0
      ? bss.rssiHistory.map((point) => ({
          x: new Date(point.at),
          y: pointY(point.rssiDbm, unit),
        }))
      : [
          {
            x: new Date(bss.presence.lastSeenAt),
            y: pointY(bss.signal.rssiDbm, unit),
          },
        ];

  const timescale = options.timescale;
  if (!timescale) return raw;
  const filtered = filterSeriesByTimescale(raw, timescale, options.nowMs ?? Date.now());
  if (filtered.length > 0) return filtered;
  const last = raw[raw.length - 1];
  return last ? [last] : [];
}
