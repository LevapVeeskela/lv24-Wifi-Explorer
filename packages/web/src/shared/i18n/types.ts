import { enMessages } from './en';

/** Supported UI locales (default {@link DEFAULT_LOCALE}). */
export type AppLocale = 'ru' | 'en';

/** All message ids; English catalog is the source of truth for keys. */
export type MessageKey = keyof typeof enMessages;

/** Flat string map compatible with `react-intl` `messages` prop. */
export type MessageMap = Record<MessageKey, string>;

export type FormatValues = Record<string, string | number>;

export type FormatMessageFn = (id: MessageKey, values?: FormatValues) => string;
