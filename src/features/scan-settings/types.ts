export type SignalDisplayUnit = 'dbm' | 'percent';

export type ScanSettings = {
  signalUnit: SignalDisplayUnit;
  minRssiDbm: number | null;
  scanIntervalSec: number;
};

export type ScanSettingsStoreV1 = {
  version: 1;
} & ScanSettings;
