import type { ObservedBss } from '@/domain/bss';
import type { BandGhz } from '@/domain/channel';
import { rssiToBarPercent } from '@/entities/bss';
import { primaryChannelsOverlap } from '@/features/scan-issues';
import { primaryCenterMhz } from '@/scan/channelMath';

export type OccupancyBar = {
  channel: number;
  score: number;
  others: number;
  selected: number;
  selectedHighlight: boolean;
};

const BAND_24_CHANNELS = Array.from({ length: 14 }, (_, i) => i + 1);

const BAND_5_CHANNELS = [
  36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 149,
  153, 157, 161, 165, 169, 173, 177,
];

const BAND_6_CHANNELS = Array.from({ length: 59 }, (_, i) => 1 + i * 4);

export function channelsForBand(band: BandGhz): number[] {
  if (band === 2.4) return BAND_24_CHANNELS;
  if (band === 6) return BAND_6_CHANNELS;
  return BAND_5_CHANNELS;
}

function occupyingSpanOf(bss: ObservedBss): { from: number; to: number } | null {
  const span = bss.channel.occupyingSpanMhz;
  if (span && span.from >= 2000 && span.to > span.from) return span;
  const center = bss.channel.occupyingCenterMhz ?? bss.channel.primaryCenterMhz;
  const width = bss.channel.widthMhz === 'unknown' ? 20 : bss.channel.widthMhz;
  if (center == null || !Number.isFinite(center)) return null;
  return { from: center - width / 2, to: center + width / 2 };
}

export function bssOccupiesChannel(bss: ObservedBss, band: BandGhz, channel: number): boolean {
  if (bss.channel.band !== band) return false;
  const span = occupyingSpanOf(bss);
  const center = primaryCenterMhz(band, channel);
  if (span && center != null) {
    return center >= span.from && center <= span.to;
  }
  return primaryChannelsOverlap(
    { number: bss.channel.number, widthMhz: bss.channel.widthMhz },
    { number: channel, widthMhz: 20 }
  );
}

function bssidOf(bss: ObservedBss): string | null {
  return bss.identity.bssid.status === 'available' ? bss.identity.bssid.value : null;
}

export function computeBandOccupancy(
  bssList: readonly ObservedBss[],
  band: BandGhz,
  selectedChannel: number | null,
  selectedBssid?: string | null
): OccupancyBar[] {
  const selectedId = selectedBssid?.toLowerCase() ?? null;

  return channelsForBand(band).map((channel) => {
    let others = 0;
    let selected = 0;
    for (const bss of bssList) {
      if (!bssOccupiesChannel(bss, band, channel)) continue;
      const contrib = rssiToBarPercent(bss.signal.rssiDbm);
      const id = bssidOf(bss)?.toLowerCase() ?? null;
      const isSelected =
        (selectedId != null && id === selectedId) ||
        (selectedId == null && selectedChannel != null && bss.channel.number === selectedChannel);
      if (isSelected) selected += contrib;
      else others += contrib;
    }
    others = Math.min(100, others);
    selected = Math.min(100 - others, selected);
    return {
      channel,
      score: Math.min(100, others + selected),
      others,
      selected,
      selectedHighlight: selectedChannel === channel,
    };
  });
}
