/**
 * lv24-Wifi-Explorer — доменная модель сканера (типы + derived-метрики).
 *
 * Clean-room: только public CoreWLAN + IEEE таблицы + локальный MA-L.
 * Атом скана — BSS (`ObservedBss`). ESS — группировка одинакового SSID.
 *
 * Слои:
 * 1. CoreWlanNetworkRecord — сырой API
 * 2. ObservedBss — API + derived + approximation
 * 3. EssGroup — агрегация
 * 4. ScanViewModel — история + фильтры
 *
 * Поля с оговоркой смотри в FIELD_AVAILABILITY и UNSUPPORTED_WITHOUT_MONITOR.
 */

export type { FieldAvailabilityRow, FieldSource, FieldSubject } from './availability';
export { FIELD_AVAILABILITY } from './availability';

export type { AssociatedLink, CoreWlanNetworkRecord, ObservedBss } from './bss';

export type {
  BandGhz,
  ChannelCenterConfidence,
  ChannelView,
  ChannelWidthMhz,
  CoreWlanChannelBand,
  CoreWlanChannelWidth,
  FrequencySpanMhz,
  UniiSubband,
  UniiSubbandRange,
} from './channel';
export {
  BAND_24_CHANNELS,
  BAND_5_CHANNELS,
  BAND_6_CHANNELS,
  PRIMARY_CENTER_MHZ,
  UNII_SUBBAND_TABLE,
  WIDTH_HALF_MHZ,
  band,
  channelsForBand,
  computeChannelView,
  isDfsUnii,
  normalizeBand,
  normalizeWidth,
  occupyingSpanOf,
  overlapMhz,
  primaryCenterMhz,
  primarySpanMhz,
  spanAround,
  standardLayoutOccupyingMhz,
  uniiSubband,
  uniiSubbandFromMhz,
} from './channel';

export type { EssGroup, EssKind } from './ess';
export { ESS_GROUPING_RULES, essGroupKeyOf, groupEss } from './ess';

export type { ScanFilter, SecurityFilter } from './filters';
export {
  SCAN_FILTER_DEFAULTS,
  SECURITY_FILTER_NOTES,
  applyScanFilter,
  matchesScanFilter,
} from './filters';

export type {
  AkmName,
  AkmSuite,
  CipherName,
  CipherSuite,
  CountryTriplet,
  DecodedIe,
  IeDecodeResult,
  IeParseLevel,
  KnownIeId,
  ShallowIeView,
  SpatialStreamHint,
  UnsupportedDeepIe,
} from './ie';
export { IE_UNSUPPORTED_DEEP, decodeInformationElements, parseShallowIe } from './ie';

export type {
  BssIdentity,
  Bssid,
  EssGroupKey,
  IsoTime,
  LocationAuthorization,
  LocationGated,
  Oui24,
  SsidIdentity,
  SsidOctetHex,
} from './identity';
export {
  asBssid,
  asEssGroupKey,
  asIsoTime,
  asOui24,
  asSsidOctetHex,
  bssMatchKeyFromRaw,
  normalizeBssid,
  octetHexOf,
  octetsFromSsidFields,
} from './identity';

export type {
  EvaluateIssuesOptions,
  EvaluateScanIssuesResult,
  IssueFlag,
  IssueSeverity,
  ScanIssueBss,
  ScanIssueContext,
  ScanIssueId,
  ScanIssueMessageKey,
  ScanIssueRow,
} from './issues';
export {
  NON_OVERLAPPING_24_CHANNELS,
  SCAN_ISSUE_IDS,
  SCAN_ISSUE_SEVERITY,
  SCAN_ISSUE_THRESHOLDS,
  buildScanContext,
  evaluateIssues,
  evaluateScanIssues,
  inferDfsChannel,
  normalizeBssidKey,
  scanIssueBssFromObserved,
  scanIssueIdFromMessageKey,
  scanIssueIdsFromMessageKeys,
  scanIssueMessageKey,
} from './issues';

export { MERGE_POLICY, mergeObservedBssRows, mergeSnapshots, presenceFromMisses } from './merge';

export type { OccupancyBar, OccupancyKind } from './occupancy';
export {
  OCCUPANCY_KIND,
  computeBandOccupancy,
  computeOccupancy,
  occupancyContribution,
  occupancyScore,
} from './occupancy';

export type {
  EstimatePhyMaxRateInput,
  MaxRateEstimate,
  McsFamily,
  PhyDisplay,
  PhyLetter,
  PhyMaxRateResult,
  PhyView,
  RateBasis,
} from './phy';
export {
  MAX_RATE_1SS_LONG_GI_MBPS,
  PHY_DISPLAY_ORDER,
  estimateMaxRateFromMcs,
  estimatePhyMaxRate,
  lookupMcsMbps,
} from './phy';

export type { ScanSnapshot, ScanViewModel, UnsupportedCapability, UnsupportedReason } from './scan';
export { UNSUPPORTED_WITHOUT_MONITOR } from './scan';

export type { RsnHint, SecurityAuthClass, SecurityKind, SecurityView } from './security';
export { SECURITY_PRIMARY_RANK } from './security';

export type { QualityBasis, SignalQuality, SignalView } from './signal';
export {
  NOISE_VALID_DBM,
  PERCENT_FULL_DBM,
  PERCENT_ZERO_DBM,
  RSSI_QUALITY_MIN_DBM,
  SNR_QUALITY_MIN_DB,
  computeSignalView,
  isNoiseValid,
  percentFromDbm,
  quality,
  qualityBasisOf,
  qualityFromTable,
  snr,
} from './signal';

export type { Presence, PresenceView, RssiHistoryPoint } from './timeseries';
export {
  PRESENCE_POLICY,
  appendRssiHistory,
  pruneRssiHistory,
  stitchRssiHistory,
} from './timeseries';

export type {
  BeaconOverheadEstimate,
  ChannelUtilization,
  ComputeUtilizationOptions,
  UtilizationReport,
  UtilizationTotals,
} from './utilization';
export {
  DEFAULT_BEACON_BYTES,
  FALLBACK_BEACON_INTERVAL_SEC,
  FALLBACK_BEACON_RATE_MBPS,
  computeUtilization,
  primaryChannelsOverlap,
} from './utilization';

export type { OuiRegistry, OuiRegistryRecord, VendorMatch, VendorView } from './vendor';
export {
  firstOctet,
  isLocallyAdministered,
  isMulticastMac,
  isRandomizedMac,
  ouiFromBssid,
  vendorFlagsFromBssid,
} from './vendor';
