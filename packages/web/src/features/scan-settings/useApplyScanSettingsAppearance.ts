import { useEffect } from 'react';
import { useColorScheme } from '@mui/material/styles';
import { resolveThemePreference } from './applyAppearanceFollowSystem';

/** Keeps MUI color scheme in sync with Settings → Advanced → follow system. */
export function useApplyScanSettingsAppearance(appearanceFollowSystem: boolean): void {
  const { setMode } = useColorScheme();

  useEffect(() => {
    setMode(resolveThemePreference(appearanceFollowSystem));
  }, [appearanceFollowSystem, setMode]);
}
