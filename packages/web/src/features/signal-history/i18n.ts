import type { AppLocale } from '@/shared/i18n';

export const SIGNAL_TRACE_KINDS = ['live', 'average', 'max'] as const;

/** Слой графика истории сигнала. */
export type SignalTraceKind = (typeof SIGNAL_TRACE_KINDS)[number];

type SignalTraceLabels = Record<SignalTraceKind, string>;

const catalogs: Record<AppLocale, SignalTraceLabels> = {
  ru: { live: 'Текущий', average: 'Среднее', max: 'Максимум' },
  en: { live: 'Live', average: 'Average', max: 'Max' },
};

/**
 * Локальные подписи слоёв графика (live / average / max).
 * Ключи живут здесь, а не в общем каталоге i18n, чтобы не раздувать его ради виджета.
 */
export function signalTraceLabel(locale: AppLocale, kind: SignalTraceKind): string {
  return catalogs[locale]?.[kind] ?? catalogs.en[kind];
}
