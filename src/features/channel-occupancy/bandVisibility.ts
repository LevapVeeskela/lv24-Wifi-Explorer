import type { ObservedBss } from '@/domain/bss';
import type { BandGhz } from '@/domain/channel';

export const OCCUPANCY_BANDS: readonly BandGhz[] = [2.4, 5, 6];

function liveForOccupancy(bss: ObservedBss): boolean {
  return bss.presence.presence !== 'disappeared';
}

export function bandHasBss(bssList: readonly ObservedBss[], band: BandGhz): boolean {
  return bssList.some((bss) => liveForOccupancy(bss) && bss.channel.band === band);
}

export function visibleOccupancyBands(
  bssList: readonly ObservedBss[],
  hideEmptyBands: boolean,
): BandGhz[] {
  if (!hideEmptyBands) return [...OCCUPANCY_BANDS];
  return OCCUPANCY_BANDS.filter((band) => bandHasBss(bssList, band));
}

export function pickOccupancyBand(
  preferred: BandGhz | null | undefined,
  visible: readonly BandGhz[],
  fallback: BandGhz = 5,
): BandGhz {
  if (preferred != null && visible.includes(preferred)) return preferred;
  if (visible.length > 0) return visible[0]!;
  return fallback;
}
