/**
 * Занятость каналов — визуальный SCORE по перекрывающимся BSS (RSSI + ширина).
 *
 * Это НЕ CCA, НЕ airtime и НЕ спектр. CoreWLAN не даёт utilization.
 * Подпись для UI: visualization-not-cca.
 */

import type { ObservedBss } from './bss';
import type { BandGhz } from './channel';
import {
  channelsForBand,
  occupyingSpanOf,
  overlapMhz,
  primarySpanMhz,
} from './channel';
import { percentFromDbm } from './signal';

/** Явный маркер: оценка для графика, не измерение эфира. */
export const OCCUPANCY_KIND = 'visualization-not-cca' as const;

export type OccupancyKind = typeof OCCUPANCY_KIND;

/**
 * Столбец занятости канала.
 * `score` — эвристика 0–100, не процент CCA.
 */
export interface OccupancyBar {
  channel: number;
  score: number;
  selected: boolean;
  /** Всегда visualization — не путать с CCA / QBSS. */
  source: OccupancyKind;
}

const TARGET_WIDTH_MHZ = 20;

function liveForOccupancy(bss: ObservedBss): boolean {
  return bss.presence.presence !== 'disappeared';
}

/**
 * Вклад одной BSS в столбец канала: % по RSSI × доля перекрытия 20 МГц.
 */
export function occupancyContribution(
  bss: ObservedBss,
  band: BandGhz,
  channel: number,
): number {
  if (bss.channel.band !== band) return 0;
  const target = primarySpanMhz(band, channel);
  const span = occupyingSpanOf(bss.channel);
  if (target == null || span == null) return 0;
  const overlap = overlapMhz(span, target);
  if (overlap <= 0) return 0;
  const strength = percentFromDbm(bss.signal.rssiDbm);
  return strength * (overlap / TARGET_WIDTH_MHZ);
}

/**
 * SCORE канала: сумма вкладов перекрывающихся BSS, clamp 0–100.
 * Не CCA.
 */
export function occupancyScore(
  rows: readonly ObservedBss[],
  band: BandGhz,
  channel: number,
): number {
  let sum = 0;
  for (const bss of rows) {
    if (!liveForOccupancy(bss)) continue;
    sum += occupancyContribution(bss, band, channel);
  }
  if (!Number.isFinite(sum) || sum <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(sum)));
}

/**
 * Столбцы занятости одной полосы.
 * @param selectedChannel подсветка выбранного primary
 */
export function computeBandOccupancy(
  rows: readonly ObservedBss[],
  band: BandGhz,
  selectedChannel: number | null = null,
): OccupancyBar[] {
  return channelsForBand(band).map((channel) => ({
    channel,
    score: occupancyScore(rows, band, channel),
    selected: selectedChannel === channel,
    source: OCCUPANCY_KIND,
  }));
}

/** Столбцы 2.4 / 5 / 6 (или одной полосы). */
export function computeOccupancy(
  rows: readonly ObservedBss[],
  selectedChannel: number | null = null,
  band: BandGhz | 'all' = 'all',
): OccupancyBar[] {
  const bands: readonly BandGhz[] = band === 'all' ? [2.4, 5, 6] : [band];
  const bars: OccupancyBar[] = [];
  for (const item of bands) {
    bars.push(...computeBandOccupancy(rows, item, selectedChannel));
  }
  return bars;
}
