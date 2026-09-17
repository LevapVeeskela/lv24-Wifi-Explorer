/** Default-visible screenshot set. Extra scanner columns stay in the picker. */
export const DEFAULT_VISIBLE_FIELDS = [
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
] as const;

export const DEFAULT_HIDDEN_FIELDS = [
  'issueFlags',
  'security',
  'rssiDbm',
  'noiseDbm',
  'snrDb',
  'lastSeenAt',
  'networkType',
] as const;

export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  ...Object.fromEntries(DEFAULT_VISIBLE_FIELDS.map((field) => [field, true])),
  ...Object.fromEntries(DEFAULT_HIDDEN_FIELDS.map((field) => [field, false])),
};
