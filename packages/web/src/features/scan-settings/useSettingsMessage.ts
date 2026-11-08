import { useCallback } from 'react';
import type { FormatValues, MessageKey } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';
import { t } from './t';

/** Locale catalog first, then scan-settings `t.ts` fallbacks for new keys. */
export function useSettingsMessage(): (id: string, values?: FormatValues) => string {
  const { formatMessage } = useScanIntl();
  return useCallback(
    (id: string, values?: FormatValues) => {
      const formatted = formatMessage(id as MessageKey, values);
      if (formatted === id) return t(id, values);
      return formatted;
    },
    [formatMessage]
  );
}
