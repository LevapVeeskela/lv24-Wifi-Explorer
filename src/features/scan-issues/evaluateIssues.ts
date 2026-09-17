import { inferDfsChannel } from './dfs';
import { scanIssueMessageKey } from './i18n/messages';
import { primaryChannelsOverlap } from './overlap';
import { NON_OVERLAPPING_24_CHANNELS, SCAN_ISSUE_THRESHOLDS } from './thresholds';
import type { EvaluateIssuesOptions, IssueFlag, ScanIssueBss, ScanIssueId } from './types';

const LEGACY_PHY = new Set(['a', 'b', 'g']);

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

function countOverlappingNeighbors(bss: ScanIssueBss, neighbors: readonly ScanIssueBss[]): number {
  let count = 0;
  for (const other of neighbors) {
    if (other === bss) continue;
    if (other.channel.band !== bss.channel.band || bss.channel.band === 'unknown') continue;
    if (primaryChannelsOverlap(bss.channel, other.channel)) count += 1;
  }
  return count;
}

function isCrowdedChannel(
  bss: ScanIssueBss,
  neighbors: readonly ScanIssueBss[],
  minNeighbors: number
): boolean {
  return countOverlappingNeighbors(bss, neighbors) >= minNeighbors;
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

function flag(id: ScanIssueId, severity: IssueFlag['severity']): IssueFlag {
  return { id, severity, i18nKey: scanIssueMessageKey(id) };
}

/**
 * Evaluate v1 issue heuristics for one BSS against neighbor rows from the same scan.
 */
export function evaluateIssues(
  bss: ScanIssueBss,
  neighbors: readonly ScanIssueBss[],
  options?: EvaluateIssuesOptions
): IssueFlag[] {
  const crowdedMin =
    options?.crowdedChannelMinNeighbors ?? SCAN_ISSUE_THRESHOLDS.crowdedChannelMinNeighbors;

  const issues: IssueFlag[] = [];

  if (isWidth40On24(bss)) issues.push(flag('width40on24', 'warning'));
  if (isOverlap24(bss)) issues.push(flag('overlap24', 'warning'));
  if (isCrowdedChannel(bss, neighbors, crowdedMin)) issues.push(flag('crowdedChannel', 'warning'));
  if (isLowSignal(bss)) issues.push(flag('lowSignal', 'warning'));
  if (isLowSnr(bss)) issues.push(flag('lowSnr', 'warning'));
  if (isWeakSecurity(bss)) issues.push(flag('weakSecurity', 'warning'));
  if (bss.hiddenSsid) issues.push(flag('hiddenSsid', 'warning'));
  if (isLegacyOnly(bss)) issues.push(flag('legacyOnly', 'warning'));
  if (isHighUtil(bss)) issues.push(flag('highUtil', 'warning'));
  if (isDfs(bss)) issues.push(flag('dfs', 'info'));

  return issues;
}
