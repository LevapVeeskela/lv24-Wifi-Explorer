import type { ThemePreference } from '@/shared/lib/persistence/keys';
import { persistThemePreference, resolveThemePreference } from '@/shared/lib/theme/preference';
import { loadScanSettings, saveScanSettings } from './persist';

export { resolveThemePreference };

/** Persist manual light/dark and turn off follow-system when user picks a theme. */
export function markManualThemePreference(mode: 'light' | 'dark'): void {
  persistThemePreference(mode);
  const current = loadScanSettings();
  if (current.appearanceFollowSystem) {
    saveScanSettings({ ...current, appearanceFollowSystem: false });
  }
}

export function applyAppearanceFollowSystem(appearanceFollowSystem: boolean): ThemePreference {
  return resolveThemePreference(appearanceFollowSystem);
}
