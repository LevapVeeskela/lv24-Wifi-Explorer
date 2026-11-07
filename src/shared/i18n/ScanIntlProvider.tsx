import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  createFormatMessage,
  DEFAULT_LOCALE,
  normalizeAppLocale,
  type AppLocale,
  type FormatMessageFn,
  type FormatValues,
  type MessageKey,
} from './core';

type ScanIntlContextValue = {
  locale: AppLocale;
  formatMessage: FormatMessageFn;
};

const ScanIntlContext = createContext<ScanIntlContextValue | null>(null);

export type ScanIntlProviderProps = {
  locale?: string;
  children: ReactNode;
};

export function ScanIntlProvider({ locale = DEFAULT_LOCALE, children }: ScanIntlProviderProps) {
  const normalized = normalizeAppLocale(locale);
  const formatMessage = useMemo(() => createFormatMessage(normalized), [normalized]);

  const value = useMemo(
    () => ({
      locale: normalized,
      formatMessage,
    }),
    [formatMessage, normalized]
  );

  return <ScanIntlContext.Provider value={value}>{children}</ScanIntlContext.Provider>;
}

export function useScanIntl(): ScanIntlContextValue {
  const ctx = useContext(ScanIntlContext);
  if (!ctx) {
    throw new Error('useScanIntl must be used within ScanIntlProvider');
  }
  return ctx;
}

export type { MessageKey, FormatValues };
