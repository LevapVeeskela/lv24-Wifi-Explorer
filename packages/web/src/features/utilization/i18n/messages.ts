/**
 * Feature-local copy for the per-channel utilization table.
 *
 * Deliberately NOT merged into `shared/i18n` catalogs: the keys are private to
 * `features/utilization` and resolved through {@link createUtilizationFormatMessage}.
 * Keys are prefixed `utilization.*` so they can be promoted later without churn.
 */

import type { AppLocale } from '@/shared/i18n';

export const utilizationEnMessages = {
  'utilization.title': 'Per-channel utilization',
  'utilization.column.channel': 'Channel',
  'utilization.column.band': 'Band',
  'utilization.column.networks': 'Networks',
  'utilization.column.overlapping': 'Overlapping',
  'utilization.column.avgRssi': 'Avg RSSI',
  'utilization.column.beacon': 'Beacon overhead',
  'utilization.caption.estimate':
    'Beacon overhead is an estimate (beacon bytes at max rate), not a measurement.',
  'utilization.empty': 'No networks in this scan.',
  'utilization.estimatePrefix': 'est.',
  'utilization.band': '{band} GHz',
} as const;

export type UtilizationMessageKey = keyof typeof utilizationEnMessages;

export const utilizationRuMessages: Record<UtilizationMessageKey, string> = {
  'utilization.title': 'Загрузка по каналам',
  'utilization.column.channel': 'Канал',
  'utilization.column.band': 'Диапазон',
  'utilization.column.networks': 'Сети',
  'utilization.column.overlapping': 'Перекрытие',
  'utilization.column.avgRssi': 'Ср. RSSI',
  'utilization.column.beacon': 'Служебный трафик beacon',
  'utilization.caption.estimate':
    'Служебный трафик beacon — оценка (размер beacon на максимальной скорости), не измерение.',
  'utilization.empty': 'В этом скане нет сетей.',
  'utilization.estimatePrefix': 'оц.',
  'utilization.band': '{band} ГГц',
};

export const utilizationZhMessages: Record<UtilizationMessageKey, string> = {
  'utilization.title': '各信道利用率',
  'utilization.column.channel': '信道',
  'utilization.column.band': '频段',
  'utilization.column.networks': '网络数',
  'utilization.column.overlapping': '重叠',
  'utilization.column.avgRssi': '平均 RSSI',
  'utilization.column.beacon': 'Beacon 开销',
  'utilization.caption.estimate': 'Beacon 开销为估算值（最大速率下的 beacon 字节数），并非实测。',
  'utilization.empty': '本次扫描没有网络。',
  'utilization.estimatePrefix': '约',
  'utilization.band': '{band} GHz',
};

const catalogs: Record<AppLocale, Record<UtilizationMessageKey, string>> = {
  en: utilizationEnMessages,
  ru: utilizationRuMessages,
  zh: utilizationZhMessages,
};

export type UtilizationFormatValues = Record<string, string | number>;
export type UtilizationFormatMessageFn = (
  id: UtilizationMessageKey,
  values?: UtilizationFormatValues
) => string;

function interpolate(template: string, values?: UtilizationFormatValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

/** Local formatter with English fallback; mirrors `shared/i18n` `{placeholder}` syntax. */ export function createUtilizationFormatMessage(
  locale: AppLocale
): UtilizationFormatMessageFn {
  const primary = catalogs[locale];
  const fallback = utilizationEnMessages;
  return (id, values) => interpolate(primary[id] ?? fallback[id] ?? id, values);
}
