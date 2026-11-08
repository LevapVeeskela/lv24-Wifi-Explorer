/**
 * Channel entity — pure channel/band math: UNII labels, overlap, occupancy
 * and per-channel utilization. Presentation and i18n live in widgets/features.
 */
export {
  bandHasBss,
  OCCUPANCY_BANDS,
  pickOccupancyBand,
  visibleOccupancyBands,
} from './bandVisibility';
export {
  bssOccupiesChannel,
  channelsForBand,
  computeBandOccupancy,
  type OccupancyBar,
} from './computeOccupancy';
export {
  computeUtilization,
  DEFAULT_BEACON_BYTES,
  FALLBACK_BEACON_INTERVAL_SEC,
  FALLBACK_BEACON_RATE_MBPS,
  type BeaconOverheadEstimate,
  type ChannelUtilization,
  type ComputeUtilizationOptions,
  type UtilizationReport,
  type UtilizationTotals,
} from './computeUtilization';
export { primaryChannelsOverlap } from './overlap';
export { formatBandWithUnii, uniiSubband, type UniiLabel } from './unii';
