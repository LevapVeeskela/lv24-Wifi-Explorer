/**
 * Open thresholds for scan issue heuristics (documented in product help).
 * Intentionally plain constants — not copied from third-party tools.
 */
export const SCAN_ISSUE_THRESHOLDS = {
  lowSignalRssiDbm: -70,
  lowSnrDb: 25,
  crowdedChannelMinNeighbors: 4,
  highUtilPct: 70,
  band24MinWidthMhz: 40,
} as const;

/** Non-overlapping 2.4 GHz primaries in most reg domains (1 / 6 / 11). */
export const NON_OVERLAPPING_24_CHANNELS = [1, 6, 11] as const;
