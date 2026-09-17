import { TIMESCALE_ORDER, type ChartTimescale } from './types';

export const TIMESCALE_MS = {
  '30s': 30_000,
  '1m': 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
} as const satisfies Record<ChartTimescale, number>;

export function stepTimescale(current: ChartTimescale, direction: 1 | -1): ChartTimescale {
  const index = TIMESCALE_ORDER.indexOf(current);
  const next = Math.min(TIMESCALE_ORDER.length - 1, Math.max(0, index + direction));
  return TIMESCALE_ORDER[next] ?? current;
}

export function timescaleWindowMs(timescale: ChartTimescale): number {
  return TIMESCALE_MS[timescale];
}
