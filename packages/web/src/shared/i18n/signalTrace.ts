import { formatMessage } from './core';
import type { AppLocale } from './types';

export const SIGNAL_TRACE_KINDS = ['live', 'average', 'max'] as const;

/** Signal history chart layer. */
export type SignalTraceKind = (typeof SIGNAL_TRACE_KINDS)[number];

const KEYS = {
  live: 'scan.chart.trace.live',
  average: 'scan.chart.trace.average',
  max: 'scan.chart.trace.max',
} as const;

export function signalTraceLabel(locale: AppLocale, kind: SignalTraceKind): string {
  return formatMessage(locale, KEYS[kind]);
}
