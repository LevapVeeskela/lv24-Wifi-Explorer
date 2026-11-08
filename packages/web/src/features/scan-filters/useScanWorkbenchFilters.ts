import { useCallback, useState } from 'react';
import { loadScanSettings } from '@/features/scan-settings';
import type { ScanSettings } from '@/features/scan-settings';
import { FILTER_DEFAULTS, type ScanWorkbenchFilters } from './types';

export type ScanSettingsFilterFields = Pick<ScanSettings, 'minRssiDbm' | 'includeHiddenSsid'>;

export function workbenchFiltersFromScanSettings(
  settings: ScanSettingsFilterFields
): ScanWorkbenchFilters {
  return {
    ...FILTER_DEFAULTS,
    minRssiDbm: settings.minRssiDbm,
    includeHiddenSsid: settings.includeHiddenSsid,
  };
}

export function useScanWorkbenchFilters(
  settings: ScanSettingsFilterFields,
  patchSettings: (partial: Partial<ScanSettings>) => void
): {
  filters: ScanWorkbenchFilters;
  onFiltersChange: (next: ScanWorkbenchFilters) => void;
  syncSettingsFields: (next: ScanSettingsFilterFields) => void;
} {
  const [filters, setFilters] = useState<ScanWorkbenchFilters>(() =>
    workbenchFiltersFromScanSettings(loadScanSettings())
  );

  const onFiltersChange = useCallback(
    (next: ScanWorkbenchFilters) => {
      setFilters(next);
      if (next.minRssiDbm !== settings.minRssiDbm) {
        patchSettings({ minRssiDbm: next.minRssiDbm });
      }
    },
    [patchSettings, settings.minRssiDbm]
  );

  const syncSettingsFields = useCallback((next: ScanSettingsFilterFields) => {
    setFilters((prev) => ({
      ...prev,
      minRssiDbm: next.minRssiDbm,
      includeHiddenSsid: next.includeHiddenSsid,
    }));
  }, []);

  return { filters, onFiltersChange, syncSettingsFields };
}
