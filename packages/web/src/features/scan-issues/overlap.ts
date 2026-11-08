import type { ChannelWidthMhz } from '@/domain/channel';

function widthMhz(value: ChannelWidthMhz | 'unknown'): number {
  return value === 'unknown' ? 20 : value;
}

/** Primary-channel overlap using 5 MHz spacing (2.4 / 5 / 6 GHz). */
export function primaryChannelsOverlap(
  a: { number: number; widthMhz: ChannelWidthMhz | 'unknown' },
  b: { number: number; widthMhz: ChannelWidthMhz | 'unknown' }
): boolean {
  const halfA = widthMhz(a.widthMhz) / 2;
  const halfB = widthMhz(b.widthMhz) / 2;
  return Math.abs(a.number - b.number) * 5 < halfA + halfB;
}
