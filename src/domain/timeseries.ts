/**
 * История RSSI и присутствие BSS между циклами скана.
 *
 * CoreWLAN не даёт «время последнего beacon». firstSeen/lastSeen —
 * время наших успешных попаданий в snapshot. Stale/disappeared —
 * политика приложения по пропускам скана, не факт с эфира.
 */

import type { IsoTime } from './identity';

export interface RssiHistoryPoint {
  at: IsoTime;
  rssiDbm: number;
  noiseDbm: number | null;
  snrDb: number | null;
  channelNumber: number | null;
}

/** current — в последнем снимке; stale — льготный пропуск; disappeared — вне льготы. */
export type Presence = 'current' | 'stale' | 'disappeared';

export interface PresenceView {
  firstSeenAt: IsoTime;
  lastSeenAt: IsoTime;
  lastMissingAt: IsoTime | null;
  consecutiveMisses: number;
  presence: Presence;
}

/**
 * Пороги по числу пропущенных scan snapshot.
 * Не путать с beaconInterval: 3 пропуска при периоде 8–10 с ≈ 25–30 с.
 */
export const PRESENCE_POLICY = {
  staleAfterMisses: 1,
  disappearedAfterMisses: 3,
  historyMaxPoints: 120,
  /** Старше этого точка может вытесняться из кольцевого буфера. */
  historyMaxAgeSeconds: 600,
} as const;

/**
 * Кольцевой буфер RSSI: не старше historyMaxAgeSeconds и не больше historyMaxPoints.
 * Точки новее `now` отбрасываем.
 */
export function pruneRssiHistory(
  points: readonly RssiHistoryPoint[],
  now: IsoTime,
): RssiHistoryPoint[] {
  const end = Date.parse(now);
  if (!Number.isFinite(end)) {
    return points.slice(-PRESENCE_POLICY.historyMaxPoints);
  }
  const minAt = end - PRESENCE_POLICY.historyMaxAgeSeconds * 1000;
  const kept = points.filter((p) => {
    const t = Date.parse(p.at);
    return Number.isFinite(t) && t >= minAt && t <= end;
  });
  if (kept.length <= PRESENCE_POLICY.historyMaxPoints) return kept;
  return kept.slice(kept.length - PRESENCE_POLICY.historyMaxPoints);
}

/**
 * Слить две истории по метке `at` (поздняя побеждает) и обрезать кольцом.
 */
export function stitchRssiHistory(
  prev: readonly RssiHistoryPoint[],
  next: readonly RssiHistoryPoint[],
  now: IsoTime,
): RssiHistoryPoint[] {
  const byAt = new Map<string, RssiHistoryPoint>();
  for (const point of prev) byAt.set(point.at, point);
  for (const point of next) byAt.set(point.at, point);
  const merged = [...byAt.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return pruneRssiHistory(merged, now);
}

/** Добавить точку в кольцевой буфер. */
export function appendRssiHistory(
  points: readonly RssiHistoryPoint[],
  point: RssiHistoryPoint,
  now: IsoTime,
): RssiHistoryPoint[] {
  return stitchRssiHistory(points, [point], now);
}
