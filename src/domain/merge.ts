/**
 * Слияние циклов скана: presence, lastSeen, кольцевая история RSSI.
 *
 * Политика merge (продукт):
 * - missCount 2 → stale;
 * - missCount 3 или 60 с с lastSeen → disappeared;
 * - при появлении обновляем lastSeen, missCount = 0.
 *
 * Не обнулять RSSI при пропуске. История — кольцо, не эфир AP.
 */

import type { ObservedBss } from './bss';
import { groupEss } from './ess';
import { applyScanFilter, SCAN_FILTER_DEFAULTS, type ScanFilter } from './filters';
import { asIsoTime, bssMatchKeyFromRaw, type IsoTime } from './identity';
import type { ScanSnapshot, ScanViewModel } from './scan';
import type { Presence, PresenceView, RssiHistoryPoint } from './timeseries';
import { stitchRssiHistory } from './timeseries';

/** Пороги presence для merge (не путать с PRESENCE_POLICY.staleAfterMisses = 1). */
export const MERGE_POLICY = {
  staleAfterMisses: 2,
  disappearedAfterMisses: 3,
  disappearedAfterSeconds: 60,
} as const;

function secondsSince(from: IsoTime, to: IsoTime): number {
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return (b - a) / 1000;
}

/**
 * Presence по числу пропусков и возрасту lastSeen.
 * missCount 0 при вызове значит «видели в этом снимке».
 */
export function presenceFromMisses(
  missCount: number,
  lastSeenAt: IsoTime,
  now: IsoTime,
): Presence {
  const age = secondsSince(lastSeenAt, now);
  if (
    missCount >= MERGE_POLICY.disappearedAfterMisses ||
    (missCount > 0 && age >= MERGE_POLICY.disappearedAfterSeconds)
  ) {
    return 'disappeared';
  }
  if (missCount >= MERGE_POLICY.staleAfterMisses) return 'stale';
  return 'current';
}

function rowKey(bss: ObservedBss): string {
  return bssMatchKeyFromRaw(bss.lastRaw);
}

function historySource(bss: ObservedBss, capturedAt: IsoTime): readonly RssiHistoryPoint[] {
  if (bss.rssiHistory.length > 0) return bss.rssiHistory;
  return [
    {
      at: capturedAt,
      rssiDbm: bss.signal.rssiDbm,
      noiseDbm: bss.signal.noiseDbm,
      snrDb: bss.signal.snrDb,
      channelNumber: bss.channel.number,
    },
  ];
}

function mergeSeen(prev: ObservedBss | undefined, next: ObservedBss, capturedAt: IsoTime): ObservedBss {
  const lastSeenAt = next.presence.lastSeenAt || capturedAt;
  const presence: PresenceView = {
    firstSeenAt: prev?.presence.firstSeenAt ?? next.presence.firstSeenAt ?? capturedAt,
    lastSeenAt,
    lastMissingAt: prev?.presence.lastMissingAt ?? next.presence.lastMissingAt ?? null,
    consecutiveMisses: 0,
    presence: 'current',
  };
  const prevHistory = prev?.rssiHistory ?? [];
  return {
    ...next,
    presence,
    rssiHistory: stitchRssiHistory(prevHistory, historySource(next, capturedAt), capturedAt),
  };
}

function mergeMissed(prev: ObservedBss, capturedAt: IsoTime): ObservedBss {
  const consecutiveMisses = prev.presence.consecutiveMisses + 1;
  return {
    ...prev,
    presence: {
      firstSeenAt: prev.presence.firstSeenAt,
      lastSeenAt: prev.presence.lastSeenAt,
      lastMissingAt: capturedAt,
      consecutiveMisses,
      presence: presenceFromMisses(consecutiveMisses, prev.presence.lastSeenAt, capturedAt),
    },
    rssiHistory: stitchRssiHistory(prev.rssiHistory, [], capturedAt),
  };
}

/**
 * Слить предыдущие строки с новым циклом.
 * Видимые: lastSeen обновляется, miss = 0.
 * Пропущенные: miss++, RSSI не обнуляем, история только prune.
 */
export function mergeObservedBssRows(
  prevRows: readonly ObservedBss[],
  nextRows: readonly ObservedBss[],
  capturedAt: IsoTime | string,
): ObservedBss[] {
  const at = asIsoTime(capturedAt);
  const prevByKey = new Map<string, ObservedBss>();
  for (const row of prevRows) prevByKey.set(rowKey(row), row);

  const seenKeys = new Set<string>();
  const merged: ObservedBss[] = [];

  for (const next of nextRows) {
    const key = rowKey(next);
    seenKeys.add(key);
    merged.push(mergeSeen(prevByKey.get(key), next, at));
  }

  for (const prev of prevRows) {
    const key = rowKey(prev);
    if (seenKeys.has(key)) continue;
    merged.push(mergeMissed(prev, at));
  }

  return merged;
}

/**
 * Снимок + история → ScanViewModel (ESS + фильтры).
 */
export function mergeSnapshots(
  prevView: ScanViewModel | null | undefined,
  nextSnapshot: ScanSnapshot,
  filter: ScanFilter = SCAN_FILTER_DEFAULTS,
): ScanViewModel {
  const bssRows = mergeObservedBssRows(
    prevView?.bssRows ?? [],
    nextSnapshot.networks,
    nextSnapshot.capturedAt,
  );
  const essGroups = groupEss(bssRows);
  const filteredBssRows = applyScanFilter(bssRows, filter);
  const filteredEssGroups = groupEss(filteredBssRows);
  return {
    snapshot: nextSnapshot,
    bssRows,
    essGroups,
    filteredBssRows,
    filteredEssGroups,
  };
}
