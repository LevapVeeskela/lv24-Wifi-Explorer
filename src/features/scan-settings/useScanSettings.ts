import { useCallback, useEffect, useState } from 'react';
import { applyScanSettingsEffects } from './applyScanSettingsEffects';
import { SCAN_SETTINGS_STORAGE_KEY } from './constants';
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
    applyScanSettingsEffects(normalized);
  }, []);

  const setSettings = commit;

  const patchSettings = useCallback(
    (partial: Partial<ScanSettings>) => {
      setSettingsState((prev) => {
        const normalized = normalizeScanSettings({ ...prev, ...partial });
        saveScanSettings(normalized);
        applyScanSettingsEffects(normalized);
        return normalized;
      });
    },
    []
  );

  useEffect(() => {
    applyScanSettingsEffects(settings);
  }, []);

  useEffect(() => {
    const reload = () => {
      const loaded = loadScanSettings();
      setSettingsState(loaded);
      applyScanSettingsEffects(loaded);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === SCAN_SETTINGS_STORAGE_KEY) reload();
    };
    window.addEventListener('lv24-scan-settings-changed', reload);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('lv24-scan-settings-changed', reload);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return { settings, setSettings, patchSettings };
}
