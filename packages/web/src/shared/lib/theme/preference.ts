import { STORAGE_THEME, type ThemePreference } from '@/shared/lib/persistence/keys';

export function readManualThemePreference(): 'light' | 'dark' {
  try {
    const raw = localStorage.getItem(STORAGE_THEME);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {
    // ignore
  }
  return 'dark';
}

export function persistThemePreference(mode: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_THEME, mode);
  } catch {
    // ignore
  }
}

export function resolveThemePreference(appearanceFollowSystem: boolean): ThemePreference {
  if (appearanceFollowSystem) return 'system';
  return readManualThemePreference();
}
