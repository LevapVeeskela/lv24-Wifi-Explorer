import { normalizeAppLocale, type AppLocale } from './core';
import { isAppLocale } from './types';

/** localStorage key for the user's UI language choice. */
export const LOCALE_STORAGE_KEY = 'lv24.locale';

/** Window event fired after the stored UI language changes. */
export const LOCALE_CHANGE_EVENT = 'lv24-locale-changed';

export type LocaleStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function defaultLocaleStorage(): LocaleStorage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    return null;
  }
  return null;
}

function navigatorLanguage(): string | undefined {
  try {
    if (typeof navigator !== 'undefined') return navigator.language;
  } catch {
    return undefined;
  }
  return undefined;
}

/**
 * Stored locale (whitelisted) → `navigator.language` normalized → {@link DEFAULT_LOCALE}.
 */
export function readLocalePreference(
  storage: LocaleStorage | null = defaultLocaleStorage()
): AppLocale {
  try {
    const stored = storage?.getItem(LOCALE_STORAGE_KEY);
    if (isAppLocale(stored)) return stored;
  } catch {
    // private mode / quota
  }
  return normalizeAppLocale(navigatorLanguage());
}

export function writeLocalePreference(
  locale: AppLocale,
  storage: LocaleStorage | null = defaultLocaleStorage()
): void {
  try {
    storage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // quota / private mode
  }
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
    }
  } catch {
    // non-DOM runtime
  }
}

/** Subscribes to locale changes (same window and other browser windows). */
export function subscribeLocalePreference(listener: (locale: AppLocale) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const notify = () => listener(readLocalePreference());
  const onStorage = (event: StorageEvent) => {
    if (event.key === LOCALE_STORAGE_KEY) notify();
  };
  window.addEventListener(LOCALE_CHANGE_EVENT, notify);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(LOCALE_CHANGE_EVENT, notify);
    window.removeEventListener('storage', onStorage);
  };
}
