/// Scan interval options (parity with Electron `scan-settings/constants.ts`).
const int scanIntervalSecMin = 3;

const List<int> scanIntervalSecOptions = [3, 5, 10, 15];

/// Min-RSSI filter range (Electron General slider; −95 means off / `null`).
const int minRssiFilterMinDbm = -95;
const int minRssiFilterMaxDbm = -40;

/// Shared with Electron `localStorage` key when both clients persist preferences.
const String scanSettingsStorageKey = 'lv24.wifi-explorer.settings';

const String scanSettingsFileName = 'lv24-wifi-explorer-settings.json';
