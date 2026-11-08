import { inferDfsChannel } from './dfs';
import { scanIssueMessageKey } from './i18n/messages';
import { primaryChannelsOverlap } from './overlap';
import { NON_OVERLAPPING_24_CHANNELS, SCAN_ISSUE_THRESHOLDS } from './thresholds';
import type {
  EvaluateIssuesOptions,
  EvaluateScanIssuesResult,
  IssueFlag,
  ScanIssueBss,
  ScanIssueContext,
  ScanIssueId,
  ScanIssueRow,
} from './types';

const LEGACY_PHY = new Set(['a', 'b', 'g']);

/** Lowercase hex-only BSSID key for self-exclusion / dedupe (format-agnostic). */
export function normalizeBssidKey(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const hex = raw.toLowerCase().replace(/[^0-9a-f]/g, '');
  return hex.length > 0 ? hex : null;
}

function ssidGroupKey(row: ScanIssueBss): string | null {
  if (row.hiddenSsid) return null;
  const ssid = row.ssid?.trim();
  return ssid && ssid.length > 0 ? ssid : null;
}

/**
 * Build whole-scan aggregates ONCE (SSID groups, total BSS). Rows sharing a
 * normalized BSSID are counted once, so a row that is also present in the
 * neighbor list does not skew totals.
 */
export function buildScanContext(rows: readonly ScanIssueBss[]): ScanIssueContext {
  const seen = new Set<string>();
  const bandsBySsid = new Map<string, Set<number>>();
  const countBySsid = new Map<string, number>();
  let totalBss = 0;

  rows.forEach((row, index) => {
    const key = normalizeBssidKey(row.bssid) ?? `#idx:${index}`;
    if (seen.has(key)) return;
    seen.add(key);
    totalBss += 1;

    const ssid = ssidGroupKey(row);
    if (ssid === null) return;
    countBySsid.set(ssid, (countBySsid.get(ssid) ?? 0) + 1);
    if (row.channel.band !== 'unknown') {
      const bands = bandsBySsid.get(ssid) ?? new Set<number>();
      bands.add(row.channel.band);
      bandsBySsid.set(ssid, bands);
    }
  });

  return { totalBss, bandsBySsid, countBySsid };
}

function channelWidthMhz(bss: ScanIssueBss): number | null {
  const w = bss.channel.widthMhz;
  return w === 'unknown' ? null : w;
}

function isWidth40On24(bss: ScanIssueBss): boolean {
  if (bss.channel.band !== 2.4) return false;
  const w = channelWidthMhz(bss);
  return w !== null && w >= SCAN_ISSUE_THRESHOLDS.band24MinWidthMhz;
}

/**
 * 2.4 GHz primary not on 1 / 6 / 11.
 * Japan: channel 14 is allowed (2484 MHz) — see product help, not a overlap24 issue.
 */
function isOverlap24(bss: ScanIssueBss): boolean {
  if (bss.channel.band !== 2.4) return false;
  const ch = bss.channel.number;
  if ((NON_OVERLAPPING_24_CHANNELS as readonly number[]).includes(ch)) return false;
  if (ch === 14 && bss.countryCode?.toUpperCase() === 'JP') return false;
  return true;
}

/**
 * Count overlapping neighbors, excluding self. Self is excluded by position
 * (batch API) and by normalized BSSID (single-row API receives fresh objects,
 * so identity comparison alone is not enough).
 */
function countOverlappingNeighbors(
  bss: ScanIssueBss,
  all: readonly ScanIssueBss[],
  selfIndex: number
): number {
  const selfKey = normalizeBssidKey(bss.bssid);
  let count = 0;
  for (let i = 0; i < all.length; i += 1) {
    if (i === selfIndex) continue;
    const other = all[i];
    if (other === bss) continue;
    if (selfKey !== null && normalizeBssidKey(other.bssid) === selfKey) continue;
    if (other.channel.band !== bss.channel.band || bss.channel.band === 'unknown') continue;
    if (primaryChannelsOverlap(bss.channel, other.channel)) count += 1;
  }
  return count;
}

function isCrowdedChannel(
  bss: ScanIssueBss,
  all: readonly ScanIssueBss[],
  selfIndex: number,
  minNeighbors: number
): boolean {
  return countOverlappingNeighbors(bss, all, selfIndex) >= minNeighbors;
}

function isLowSignal(bss: ScanIssueBss): boolean {
  return bss.signal.rssiDbm < SCAN_ISSUE_THRESHOLDS.lowSignalRssiDbm;
}

function isLowSnr(bss: ScanIssueBss): boolean {
  const snr = bss.signal.snrDb;
  if (snr === null) return false;
  return snr < SCAN_ISSUE_THRESHOLDS.lowSnrDb;
}

function isWeakSecurity(bss: ScanIssueBss): boolean {
  if (bss.security.isOpen || bss.security.primary === 'open') return true;
  if (bss.security.primary === 'wep') return true;
  if (bss.tkipOnly === true) return true;
  return false;
}

function isLegacyOnly(bss: ScanIssueBss): boolean {
  const highest = bss.phy.highest;
  if (highest === null) return false;
  return LEGACY_PHY.has(highest);
}

function isHighUtil(bss: ScanIssueBss): boolean {
  const util = bss.channelUtilPct;
  if (util === undefined || util === null) return false;
  return util >= SCAN_ISSUE_THRESHOLDS.highUtilPct;
}

function isDfs(bss: ScanIssueBss): boolean {
  if (typeof bss.isDfs === 'boolean') return bss.isDfs;
  return inferDfsChannel(bss.channel.band, bss.channel.number);
}

/** Same SSID seen exclusively on 2.4 GHz (no 5/6 GHz BSS in this scan). */
function isBand24Only(bss: ScanIssueBss, context: ScanIssueContext): boolean {
  const ssid = ssidGroupKey(bss);
  if (ssid === null) return false;
  const bands = context.bandsBySsid.get(ssid);
  if (!bands || bands.size === 0) return false;
  for (const band of bands) {
    if (band !== 2.4) return false;
  }
  return true;
}

/** Scan-wide congestion: total BSS count at or above threshold. */
function isTooManyNetworks(context: ScanIssueContext, minTotal: number): boolean {
  return context.totalBss >= minTotal;
}

/** Same SSID broadcast by many BSS (large mesh / enterprise group). */
function isLargeGroup(bss: ScanIssueBss, context: ScanIssueContext, minBss: number): boolean {
  const ssid = ssidGroupKey(bss);
  if (ssid === null) return false;
  return (context.countBySsid.get(ssid) ?? 0) >= minBss;
}

function flag(id: ScanIssueId, severity: IssueFlag['severity']): IssueFlag {
  return { id, severity, i18nKey: scanIssueMessageKey(id) };
}

function evaluateRow(
  bss: ScanIssueBss,
  all: readonly ScanIssueBss[],
  selfIndex: number,
  context: ScanIssueContext,
  options?: EvaluateIssuesOptions
): IssueFlag[] {
  const crowdedMin =
    options?.crowdedChannelMinNeighbors ?? SCAN_ISSUE_THRESHOLDS.crowdedChannelMinNeighbors;
  const tooManyMin =
    options?.tooManyNetworksMinTotal ?? SCAN_ISSUE_THRESHOLDS.tooManyNetworksMinTotal;
  const largeGroupMin = options?.largeGroupMinBss ?? SCAN_ISSUE_THRESHOLDS.largeGroupMinBss;

  const issues: IssueFlag[] = [];

  if (isWidth40On24(bss)) issues.push(flag('width40on24', 'warning'));
  if (isOverlap24(bss)) issues.push(flag('overlap24', 'warning'));
  if (isCrowdedChannel(bss, all, selfIndex, crowdedMin))
    issues.push(flag('crowdedChannel', 'warning'));
  if (isLowSignal(bss)) issues.push(flag('lowSignal', 'warning'));
  if (isLowSnr(bss)) issues.push(flag('lowSnr', 'warning'));
  if (isWeakSecurity(bss)) issues.push(flag('weakSecurity', 'warning'));
  if (bss.hiddenSsid) issues.push(flag('hiddenSsid', 'warning'));
  if (isLegacyOnly(bss)) issues.push(flag('legacyOnly', 'warning'));
  if (isHighUtil(bss)) issues.push(flag('highUtil', 'warning'));
  if (isDfs(bss)) issues.push(flag('dfs', 'info'));
  if (isBand24Only(bss, context)) issues.push(flag('band24only', 'info'));
  if (isTooManyNetworks(context, tooManyMin)) issues.push(flag('tooManyNetworks', 'warning'));
  if (isLargeGroup(bss, context, largeGroupMin)) issues.push(flag('largeGroup', 'info'));

  return issues;
}

/**
 * Evaluate v1 issue heuristics for one BSS against neighbor rows from the same scan.
 * Prefer {@link evaluateScanIssues} for whole scans (maps/aggregates once).
 */
export function evaluateIssues(
  bss: ScanIssueBss,
  neighbors: readonly ScanIssueBss[],
  options?: EvaluateIssuesOptions
): IssueFlag[] {
  const all: ScanIssueBss[] = [bss, ...neighbors];
  const context = buildScanContext(all);
  return evaluateRow(bss, all, 0, context, options);
}

/**
 * Batch API: evaluate all rows of one scan. The scan context (SSID groups,
 * totals) is built once, so the whole pass is O(n²) only in the neighbor
 * overlap check and does no per-row re-mapping of the input.
 */
export function evaluateScanIssues(
  rows: readonly ScanIssueRow[],
  options?: EvaluateIssuesOptions
): EvaluateScanIssuesResult {
  const context = buildScanContext(rows);
  const byRowId = new Map<string, IssueFlag[]>();
  const counts: Partial<Record<ScanIssueId, number>> = {};
  let rowsWithIssues = 0;

  rows.forEach((row, index) => {
    const flags = evaluateRow(row, rows, index, context, options);
    byRowId.set(row.id, flags);
    if (flags.length > 0) rowsWithIssues += 1;
    for (const f of flags) counts[f.id] = (counts[f.id] ?? 0) + 1;
  });

  return { byRowId, counts, rowsWithIssues };
}
