/**
 * Слияние предыдущей таблицы с новым циклом: presence + RSSI history + ESS + фильтр.
 */

import type { ObservedBss } from '../domain/bss';
import type { ScanFilter } from '../domain/filters';
import { SCAN_FILTER_DEFAULTS } from '../domain/filters';
import type { IsoTime } from '../domain/identity';
import type { ScanSnapshot, ScanViewModel } from '../domain/scan';
import type { Presence } from '../domain/timeseries';
import { PRESENCE_POLICY } from '../domain/timeseries';
import { applyScanFilter } from './applyScanFilter';
import { groupEss } from './groupEss';
import { bssMatchKey } from './identity';
import { pruneRssiHistory, stitchRssiHistory } from './mapObservedBss';

function presenceAfterMisses(misses: number): Presence {
  if (misses >= PRESENCE_POLICY.disappearedAfterMisses) return 'disappeared';
  if (misses >= PRESENCE_POLICY.staleAfterMisses) return 'stale';
  return 'current';
}

function mergeSeen(prev: ObservedBss | undefined, next: ObservedBss, capturedAt: IsoTime): ObservedBss {
  if (!prev) {
    return {
      ...next,
      rssiHistory: pruneRssiHistory(next.rssiHistory, capturedAt),
    };
  }
  return {
    ...next,
    presence: {
      firstSeenAt: prev.presence.firstSeenAt,
      lastSeenAt: next.presence.lastSeenAt,
      lastMissingAt: prev.presence.lastMissingAt,
      consecutiveMisses: 0,
      presence: 'current',
    },
    rssiHistory: stitchRssiHistory(prev.rssiHistory, next.rssiHistory, capturedAt),
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
      presence: presenceAfterMisses(consecutiveMisses),
    },
    rssiHistory: pruneRssiHistory(prev.rssiHistory, capturedAt),
  };
}

export function mergeSnapshots(
  prevView: ScanViewModel | null | undefined,
  nextSnapshot: ScanSnapshot,
  filter: ScanFilter = SCAN_FILTER_DEFAULTS,
): ScanViewModel {
  const capturedAt = nextSnapshot.capturedAt;
  const prevRows = prevView?.bssRows ?? [];
  const prevByKey = new Map<string, ObservedBss>();
  for (const row of prevRows) prevByKey.set(bssMatchKey(row), row);

  const seenKeys = new Set<string>();
  const bssRows: ObservedBss[] = [];

  for (const next of nextSnapshot.networks) {
    const key = bssMatchKey(next);
    seenKeys.add(key);
    bssRows.push(mergeSeen(prevByKey.get(key), next, capturedAt));
  }

  for (const prev of prevRows) {
    const key = bssMatchKey(prev);
    if (seenKeys.has(key)) continue;
    bssRows.push(mergeMissed(prev, capturedAt));
  }

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
