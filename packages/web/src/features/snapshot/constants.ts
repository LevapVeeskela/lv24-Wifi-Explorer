/** LV24 snapshot document — our JSON format, never a competitor scan file. */
export const LV24_SCAN_KIND = 'lv24.wifi-explorer.scan' as const;

export const LV24_SCAN_FORMAT_VERSION = 1 as const;

export const LV24_SCAN_EXTENSION = '.lv24scan' as const;

export const LV24_SCAN_APP_NAME = 'LV24 WiFi Explorer' as const;

/** Extensions we refuse to treat as {@link LV24_SCAN_EXTENSION}. */
export const FOREIGN_SCAN_EXTENSIONS = ['.wifiexplorer'] as const;
