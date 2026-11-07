import type { ScanSettings } from './types';

export const SCAN_SETTINGS_STORAGE_KEY = 'lv24.wifi-explorer.settings';

/** Minimum scan interval (seconds). */
export const SCAN_INTERVAL_SEC_MIN = 3;

export const SCAN_INTERVAL_SEC_OPTIONS = [3, 5, 10, 15] as const;

export type ScanIntervalSec = (typeof SCAN_INTERVAL_SEC_OPTIONS)[number];

export const SCAN_SETTINGS_DEFAULTS: ScanSettings = {
  signalUnit: 'percent',
  minRssiDbm: null,
  scanIntervalSec: 5,
  autoStartScanOnLaunch: false,
  includeHiddenSsid: true,
  hideEmptySpectrumBand: true,
  graphLabelMode: 'ssid',
  appearanceFollowSystem: true,
};
