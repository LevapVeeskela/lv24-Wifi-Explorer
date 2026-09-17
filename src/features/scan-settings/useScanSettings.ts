import { useCallback, useEffect, useState } from 'react';
import { applyScanIntervalMs } from './applyScanInterval';
import { loadScanSettings, normalizeScanSettings, saveScanSettings } from './persist';
import type { ScanSettings } from './types';

export function useScanSettings(): {
  settings: ScanSettings;
  setSettings: (next: ScanSettings) => void;
  patchSettings: (partial: Partial<ScanSettings>) => void;
} {
  const [settings, setSettingsState] = useState<ScanSettings>(() => loadScanSettings());

  const commit = useCallback((next: ScanSettings) => {
    const normalized = normalizeScanSettings(next);
    setSettingsState(normalized);
    saveScanSettings(normalized);
    applyScanIntervalMs(normalized.scanIntervalSec);
  }, []);

  const setSettings = commit;

  const patchSettings = useCallback(
    (partial: Partial<ScanSettings>) => {
      setSettingsState((prev) => {
        const normalized = normalizeScanSettings({ ...prev, ...partial });
        saveScanSettings(normalized);
        applyScanIntervalMs(normalized.scanIntervalSec);
        return normalized;
      });
    },
    []
  );

  useEffect(() => {
    applyScanIntervalMs(settings.scanIntervalSec);
  }, []);

  return { settings, setSettings, patchSettings };
}
