/** Grid column fields aligned with `useScanGridColumns` and SPEC §3 table ids. */
export type ScanGridColumnField =
  | 'seriesColor'
  | 'bssid'
  | 'ssid'
  | 'securityLock'
  | 'vendor'
  | 'apName'
  | 'annotation'
  | 'issueFlags'
  | 'signal'
  | 'signalTrend'
  | 'channel'
  | 'channelWidth'
  | 'band'
  | 'phyMode'
  | 'security'
  | 'rssiDbm'
  | 'noiseDbm'
  | 'snrDb'
  | 'lastSeenAt'
  | 'networkType'
  | 'unii'
  | 'firstSeenAt'
  | 'uptimeSec'
  | 'centerFreqMhz'
  | 'maxRateMbps'
  | 'streams'
  | 'amendments'
  | 'generation'
  | 'countryCode'
  | 'beaconIntervalMs'
  | 'dtimPeriod'
  | 'bssLoadStations'
  | 'bssLoadUtilPct'
  | 'channelUtilPct'
  | 'ieCount'
  | 'ieBytes'
  | 'wps'
  | 'mfp'
  | 'ft';

export type ScanGridColumnDef = {
  field: ScanGridColumnField;
  /** i18n key shared with grid headers (`scan.col.*`). */
  labelKey: string;
  hideable: boolean;
};

export const SCAN_GRID_COLUMNS: readonly ScanGridColumnDef[] = [
  { field: 'seriesColor', labelKey: 'scan.settings.columns.seriesColor', hideable: false },
  { field: 'bssid', labelKey: 'scan.col.bssid', hideable: true },
  { field: 'ssid', labelKey: 'scan.col.ssid', hideable: true },
  { field: 'securityLock', labelKey: 'scan.settings.columns.securityLock', hideable: false },
  { field: 'vendor', labelKey: 'scan.col.vendor', hideable: true },
  { field: 'apName', labelKey: 'scan.col.apName', hideable: true },
  { field: 'annotation', labelKey: 'scan.col.annotation', hideable: true },
  { field: 'issueFlags', labelKey: 'scan.col.issues', hideable: true },
  { field: 'signal', labelKey: 'scan.col.signal', hideable: true },
  { field: 'signalTrend', labelKey: 'scan.col.signalTrend', hideable: true },
  { field: 'channel', labelKey: 'scan.col.channel', hideable: true },
  { field: 'channelWidth', labelKey: 'scan.col.channelWidth', hideable: true },
  { field: 'band', labelKey: 'scan.col.band', hideable: true },
  { field: 'phyMode', labelKey: 'scan.col.phyMode', hideable: true },
  { field: 'security', labelKey: 'scan.col.security', hideable: true },
  { field: 'rssiDbm', labelKey: 'scan.col.rssi', hideable: true },
  { field: 'noiseDbm', labelKey: 'scan.col.noise', hideable: true },
  { field: 'snrDb', labelKey: 'scan.col.snr', hideable: true },
  { field: 'lastSeenAt', labelKey: 'scan.col.seen', hideable: true },
  { field: 'networkType', labelKey: 'scan.col.type', hideable: true },
  { field: 'unii', labelKey: 'scan.col.unii', hideable: true },
  { field: 'firstSeenAt', labelKey: 'scan.col.firstSeen', hideable: true },
  { field: 'uptimeSec', labelKey: 'scan.col.uptime', hideable: true },
  { field: 'centerFreqMhz', labelKey: 'scan.col.centerFreq', hideable: true },
  { field: 'maxRateMbps', labelKey: 'scan.col.maxRate', hideable: true },
  { field: 'streams', labelKey: 'scan.col.streams', hideable: true },
  { field: 'amendments', labelKey: 'scan.col.amendments', hideable: true },
  { field: 'generation', labelKey: 'scan.col.generation', hideable: true },
  { field: 'countryCode', labelKey: 'scan.col.country', hideable: true },
  { field: 'beaconIntervalMs', labelKey: 'scan.col.beaconInterval', hideable: true },
  { field: 'dtimPeriod', labelKey: 'scan.col.dtim', hideable: true },
  { field: 'bssLoadStations', labelKey: 'scan.col.bssLoad', hideable: true },
  { field: 'bssLoadUtilPct', labelKey: 'scan.col.bssLoad', hideable: true },
  { field: 'channelUtilPct', labelKey: 'scan.col.channelUtil', hideable: true },
  { field: 'ieCount', labelKey: 'scan.col.ieCount', hideable: true },
  { field: 'ieBytes', labelKey: 'scan.col.ieBytes', hideable: true },
  { field: 'wps', labelKey: 'scan.col.wps', hideable: true },
  { field: 'mfp', labelKey: 'scan.col.mfp', hideable: true },
  { field: 'ft', labelKey: 'scan.col.ft', hideable: true },
] as const;

/** Default-visible screenshot set (SPEC §3). */
export const DEFAULT_VISIBLE_FIELDS: readonly ScanGridColumnField[] = [
  'seriesColor',
  'bssid',
  'ssid',
  'securityLock',
  'vendor',
  'annotation',
  'signal',
  'channel',
  'channelWidth',
  'band',
  'phyMode',
];

export const DEFAULT_HIDDEN_FIELDS: readonly ScanGridColumnField[] = [
  'signalTrend',
  'issueFlags',
  'security',
  'rssiDbm',
  'noiseDbm',
  'snrDb',
  'lastSeenAt',
  'networkType',
  'unii',
  'firstSeenAt',
  'uptimeSec',
  'centerFreqMhz',
  'maxRateMbps',
  'streams',
  'amendments',
  'generation',
  'countryCode',
  'beaconIntervalMs',
  'dtimPeriod',
  'apName',
  'bssLoadStations',
  'bssLoadUtilPct',
  'channelUtilPct',
  'ieCount',
  'ieBytes',
  'wps',
  'mfp',
  'ft',
];

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  ...Object.fromEntries(DEFAULT_VISIBLE_FIELDS.map((field) => [field, true])),
  ...Object.fromEntries(DEFAULT_HIDDEN_FIELDS.map((field) => [field, false])),
};

export function resetColumnVisibility(): Record<string, boolean> {
  return { ...DEFAULT_COLUMN_VISIBILITY };
}
