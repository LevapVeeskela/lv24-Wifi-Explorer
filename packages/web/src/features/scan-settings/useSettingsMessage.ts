import { useCallback } from 'react';
import { useScanIntl, type FormatValues } from '@/shared/i18n';

/** Resolves settings copy from the active locale. */
export function useSettingsMessage(): (id: string, values?: FormatValues) => string {
  const { formatMessage } = useScanIntl();
  return useCallback(
    (id: string, values?: FormatValues) => formatMessage(id as never, values),
    [formatMessage]
  );
}
