import { enMessages } from './en';

/** Supported UI locales (default {@link DEFAULT_LOCALE}). */
export type AppLocale = 'ru' | 'en' | 'zh';

/** Runtime list of supported locales (storage whitelist). */
export const APP_LOCALES: readonly AppLocale[] = ['ru', 'en', 'zh'];

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (APP_LOCALES as readonly string[]).includes(value);
}

/** All message ids; English catalog is the source of truth for keys. */
export type MessageKey = keyof typeof enMessages;

/** Flat string map compatible with `react-intl` `messages` prop. */
export type MessageMap = Record<MessageKey, string>;

export type FormatValues = Record<string, string | number>;

export type FormatMessageFn = (id: MessageKey, values?: FormatValues) => string;
