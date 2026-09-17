import { useEffect } from 'react';
import { useColorScheme } from '@mui/material/styles';
import { STORAGE_THEME, type ThemePreference } from '@/shared/lib/persistence/keys';

function readStoredTheme(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_THEME);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    // ignore
  }
  return 'dark';
}

export function ThemePreferenceSync() {
  const { setMode } = useColorScheme();

  useEffect(() => {
    setMode(readStoredTheme());
  }, [setMode]);

  return null;
}

export function persistThemePreference(mode: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_THEME, mode);
  } catch {
    // ignore
  }
}
