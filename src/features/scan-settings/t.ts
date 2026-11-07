import {
  createFormatMessage,
  DEFAULT_LOCALE,
  type FormatValues,
  type MessageKey,
} from '@/shared/i18n';

const format = createFormatMessage(DEFAULT_LOCALE);

/** Resolves settings copy from i18n catalogs (default locale, then English). */
export function t(key: string, values?: FormatValues): string {
  return format(key as MessageKey, values);
}
