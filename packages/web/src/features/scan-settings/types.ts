export type SignalDisplayUnit = 'dbm' | 'percent';

/** Chart / spectrum label source (SPEC Settings → Advanced). */
export type GraphLabelMode = 'ssid' | 'apName' | 'annotation';

export type ScanSettings = {
  signalUnit: SignalDisplayUnit;
  minRssiDbm: number | null;
  scanIntervalSec: number;
  autoStartScanOnLaunch: boolean;
  includeHiddenSsid: boolean;
  hideEmptySpectrumBand: boolean;
  graphLabelMode: GraphLabelMode;
  appearanceFollowSystem: boolean;
  autoUpdateEnabled: boolean;
  directedSsid: string;
};

export type ScanSettingsStoreV1 = {
  version: 1;
} & ScanSettings;

/** Annotation row for the settings window (same shape as `AnnotationRule`). */
export type ScanSettingsAnnotationRule = {
  id: string;
  bssidPattern: string;
  text: string;
};
