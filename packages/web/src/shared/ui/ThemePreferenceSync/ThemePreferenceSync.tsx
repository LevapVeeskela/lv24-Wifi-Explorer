import { useEffect } from 'react';
import { useColorScheme } from '@mui/material/styles';
import { loadScanSettings } from '@/features/scan-settings/persist';
import { persistThemePreference, resolveThemePreference } from '@/shared/lib/theme/preference';

export { persistThemePreference };

export function ThemePreferenceSync() {
  const { setMode } = useColorScheme();

  useEffect(() => {
    const settings = loadScanSettings();
    setMode(resolveThemePreference(settings.appearanceFollowSystem));
  }, [setMode]);

  return null;
}
