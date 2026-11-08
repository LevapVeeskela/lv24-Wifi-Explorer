/**
 * BSS entity — public API.
 *
 * Consumers must import from `@/entities/bss`; internal modules are private.
 * Presentation helpers here are pure; no React, no i18n side effects.
 */
export {
  formatBandLabel,
  formatChannelWidth,
  formatDbm,
  formatSnr,
  qualityMessageKey,
  rssiToBarPercent,
  securityDisplayLabel,
  truncateBssidMiddle,
  vendorInitials,
} from './formatters';
export {
  emptySelectionModel,
  firstSelectedRowId,
  isRowSelected,
  selectionCount,
  singleSelectionModel,
} from './gridSelection';
export { bssidRowId, normalizeBssid } from './normalizeBssid';
export {
  observedBssToGridRow,
  ssidGridLabel,
  ssidHiddenFromBss,
  type ScanGridRow,
} from './scanGridRow';
export {
  formatBandField,
  formatCountry,
  formatEncryption,
  formatFrequency,
  formatMaxRate,
  formatNoiseDbm,
  formatPhyMode,
  formatRelativeSeen,
  formatSecurity,
  formatSignalPct,
  formatSnrDetails,
  formatWidthField,
} from './formatFields';
export { seriesColorForBssid } from './seriesColor';
