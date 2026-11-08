import { useEffect } from 'react';
import { useColorScheme } from '@mui/material/styles';
import { persistThemePreference, resolveThemePreference } from '@/shared/lib/theme/preference';

export { persistThemePreference };

export type ThemePreferenceSyncProps = {
  /**
   * Follow-system preference resolved by the caller (app/page layer).
   * Injected to keep `shared` free of `features` imports.
   */
  followSystem?: boolean;
};

export function ThemePreferenceSync({ followSystem = true }: ThemePreferenceSyncProps) {
  const { setMode } = useColorScheme();

  useEffect(() => {
    setMode(resolveThemePreference(followSystem));
  }, [followSystem, setMode]);

  return null;
}
