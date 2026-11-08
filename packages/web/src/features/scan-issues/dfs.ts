import type { BandGhz } from '@/domain/channel';

/** Common 5 GHz DFS primary channels (weather radar bands). */
const DFS_5GHZ_CHANNELS = new Set([
  52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144,
]);

export function inferDfsChannel(band: BandGhz | 'unknown', channel: number): boolean {
  if (band !== 5) return false;
  return DFS_5GHZ_CHANNELS.has(channel);
}
