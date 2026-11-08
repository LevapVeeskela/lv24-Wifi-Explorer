import { describe, expect, it } from 'vitest';
import { messagesByLocale, normalizeAppLocale, zhMessages } from './core';
import { enMessages } from './en';
import { ruMessages } from './ru';
import {
  LOCALE_STORAGE_KEY,
  readLocalePreference,
  writeLocalePreference,
  type LocaleStorage,
} from './localePreference';

function memoryStorage(initial: Record<string, string> = {}): LocaleStorage & {
  map: Map<string, string>;
} {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? '').sort();
}

describe('normalizeAppLocale', () => {
  it.each(['zh', 'zh-CN', 'zh-Hans', 'zh-TW', 'zh_CN', 'ZH'])('maps %s to zh', (input) => {
    expect(normalizeAppLocale(input)).toBe('zh');
  });

  it.each(['en', 'en-US', 'en-GB'])('maps %s to en', (input) => {
    expect(normalizeAppLocale(input)).toBe('en');
  });

  it.each(['ru', 'ru-RU'])('maps %s to ru', (input) => {
    expect(normalizeAppLocale(input)).toBe('ru');
  });

  it('falls back to ru for unknown or missing locales', () => {
    expect(normalizeAppLocale('de-DE')).toBe('ru');
    expect(normalizeAppLocale('')).toBe('ru');
    expect(normalizeAppLocale(undefined)).toBe('ru');
  });
});

describe('message catalogs', () => {
  const enKeys = Object.keys(enMessages).sort();

  it('zh covers every English key', () => {
    expect(Object.keys(zhMessages).sort()).toEqual(enKeys);
  });

  it('ru covers every English key', () => {
    expect(Object.keys(ruMessages).sort()).toEqual(enKeys);
  });

  it('registers all three locales', () => {
    expect(Object.keys(messagesByLocale).sort()).toEqual(['en', 'ru', 'zh']);
  });

  it('keeps every translation non-empty with matching placeholders', () => {
    for (const key of enKeys as (keyof typeof enMessages)[]) {
      expect(zhMessages[key].trim()).not.toBe('');
      expect(ruMessages[key].trim()).not.toBe('');
      expect(placeholders(zhMessages[key])).toEqual(placeholders(enMessages[key]));
      expect(placeholders(ruMessages[key])).toEqual(placeholders(enMessages[key]));
    }
  });

  it('has a Chinese label for the language settings keys', () => {
    expect(zhMessages['scan.settings.language']).toBe('语言');
    expect(zhMessages['scan.settings.language.zh']).toBe('中文');
  });
});

describe('locale preference', () => {
  it('reads a whitelisted stored locale', () => {
    expect(readLocalePreference(memoryStorage({ [LOCALE_STORAGE_KEY]: 'zh' }))).toBe('zh');
    expect(readLocalePreference(memoryStorage({ [LOCALE_STORAGE_KEY]: 'en' }))).toBe('en');
    expect(readLocalePreference(memoryStorage({ [LOCALE_STORAGE_KEY]: 'ru' }))).toBe('ru');
  });

  it('rejects non-whitelisted stored values', () => {
    const fallback = normalizeAppLocale(navigator.language);
    expect(readLocalePreference(memoryStorage({ [LOCALE_STORAGE_KEY]: 'de' }))).toBe(fallback);
    expect(readLocalePreference(memoryStorage({ [LOCALE_STORAGE_KEY]: 'zh-CN' }))).toBe(fallback);
    expect(readLocalePreference(memoryStorage())).toBe(fallback);
  });

  it('writes the locale under lv24.locale', () => {
    const storage = memoryStorage();
    writeLocalePreference('zh', storage);
    expect(storage.map.get(LOCALE_STORAGE_KEY)).toBe('zh');
  });

  it('survives a throwing storage', () => {
    const broken: LocaleStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    expect(() => writeLocalePreference('en', broken)).not.toThrow();
    expect(readLocalePreference(broken)).toBe(normalizeAppLocale(navigator.language));
  });
});
