import { enMessages } from './en';
import { ruMessages } from './ru';
import type { AppLocale, FormatMessageFn, FormatValues, MessageKey, MessageMap } from './types';

/** Default UI locale. */
export const DEFAULT_LOCALE: AppLocale = 'ru';

/** Locale used when a key is missing in the active catalog. */
export const FALLBACK_LOCALE: AppLocale = 'en';

const catalogs: Record<AppLocale, MessageMap> = {
  ru: ruMessages,
  en: enMessages,
};

export { enMessages, ruMessages };
export type { AppLocale, FormatMessageFn, FormatValues, MessageKey, MessageMap };

/** react-intl-style message maps keyed by locale. */
export const messagesByLocale = catalogs;

export function normalizeAppLocale(locale: string | undefined): AppLocale {
  if (locale?.toLowerCase().startsWith('en')) {
    return 'en';
  }
  return DEFAULT_LOCALE;
}

export function getMessageMap(locale: AppLocale): MessageMap {
  return catalogs[locale];
}

function interpolate(template: string, values?: FormatValues): string {
  if (!values) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

/**
 * Lightweight `formatMessage` compatible with react-intl call sites (`{count}` placeholders).
 * Resolves from the active locale, then {@link FALLBACK_LOCALE}, then the message id.
 */
export function createFormatMessage(locale: AppLocale): FormatMessageFn {
  const primary = getMessageMap(locale);
  const fallback = getMessageMap(FALLBACK_LOCALE);

  return (id: MessageKey, values?: FormatValues) => {
    const text = primary[id] ?? fallback[id] ?? id;
    return interpolate(text, values);
  };
}

export function formatMessage(locale: AppLocale, id: MessageKey, values?: FormatValues): string {
  return createFormatMessage(locale)(id, values);
}
