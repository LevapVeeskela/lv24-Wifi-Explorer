export const STORAGE_THEME = 'lv24.wifi-explorer.theme';
export const STORAGE_COLUMNS = 'lv24.wifi-explorer.columns';
export const STORAGE_COLUMN_PROFILES = 'lv24.wifi-explorer.column-profiles';
export const STORAGE_PANES = 'lv24.wifi-explorer.panes';
export const STORAGE_ANNOTATIONS = 'lv24.wifi-explorer.annotations';
export const STORAGE_LOCATION_ONBOARDING_DISMISSED =
  'lv24.wifi-explorer.location-onboarding-dismissed';
export const STORAGE_SETTINGS = 'lv24.wifi-explorer.settings';
export const STORAGE_FILTER_PRESETS = 'lv24.wifi-explorer.filter-presets';
export const STORAGE_ORGANIZE_BY = 'lv24.wifi-explorer.organize-by';

export type ThemePreference = 'light' | 'dark' | 'system';

export type StoredPaneLayout = {
  mainGridFraction: number;
  dockDetailsFraction: number;
};

export const PANE_LAYOUT_DEFAULT: StoredPaneLayout = {
  mainGridFraction: 0.58,
  dockDetailsFraction: 0.45,
};
