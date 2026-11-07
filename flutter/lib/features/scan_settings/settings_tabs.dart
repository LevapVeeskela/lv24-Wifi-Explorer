/// Settings window tabs (Electron `settingsTabs.ts`).
const settingsTabs = <SettingsTabId>[
  SettingsTabId.general,
  SettingsTabId.columns,
  SettingsTabId.annotations,
  SettingsTabId.vendor,
  SettingsTabId.advanced,
];

enum SettingsTabId {
  general,
  columns,
  annotations,
  vendor,
  advanced;

  static SettingsTabId parse(String? raw) {
    for (final id in SettingsTabId.values) {
      if (id.name == raw) return id;
    }
    return SettingsTabId.general;
  }
}
