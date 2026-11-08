/**
 * Слой скана: мапперы CoreWLAN → ObservedBss / ESS / ViewModel + demo fixtures.
 * Типы домена не дублируем — только функции.
 */

export { applyScanFilter, matchesScanFilter } from './applyScanFilter';
export { computeChannelView, primaryCenterMhz, standardLayoutOccupyingMhz } from './channelMath';
export {
  DEMO_CAPTURED_AT,
  DEMO_CAMPUS_24,
  DEMO_CAMPUS_5_20,
  DEMO_CAMPUS_5_80,
  DEMO_HIDDEN_A,
  DEMO_HIDDEN_B,
  DEMO_IBSS,
  DEMO_MISSING_NOISE,
  DEMO_OPEN,
  DEMO_OWE,
  DEMO_RANDOMIZED,
  DEMO_RAW_NETWORKS,
  DEMO_WEP,
  DEMO_WPA3_6GHZ,
  DEMO_CONNECTED_BSSID,
  buildDemoSnapshot,
  buildDemoView,
} from './fixtures/demo';
export { groupEss } from './groupEss';
export { parseShallowIe } from './ieShallow';
export { bssMatchKey, matchKeyFromRaw } from './identity';
export {
  computePhyView,
  computeSecurityView,
  computeSignalView,
  estimateMaxRate,
  isNoiseValid,
  mapCoreWlanRecordToObservedBss,
  mapCoreWlanRecordsToObservedBss,
  pruneRssiHistory,
  type MapObservedBssOptions,
} from './mapObservedBss';
export { mergeSnapshots } from './mergeSnapshots';
export { STUB_OUI_LOOKUP, resolveVendorView, type OuiLookup } from './vendorStub';
