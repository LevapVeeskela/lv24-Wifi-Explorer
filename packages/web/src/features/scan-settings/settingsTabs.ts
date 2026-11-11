export const SETTINGS_TABS = [
  'general',
  'updates',
  'columns',
  'annotations',
  'vendor',
  'advanced',
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number];

export function isSettingsTabId(value: string): value is SettingsTabId {
  return (SETTINGS_TABS as readonly string[]).includes(value);
}
