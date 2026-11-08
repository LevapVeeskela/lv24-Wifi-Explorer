/**
 * Aggregate view over compact scan rows — cheap orientation for an agent
 * before it asks for individual networks.
 */

import type { CompactNetwork } from './compact.js';

export type BandCounts = {
  '2.4': number;
  '5': number;
  '6': number;
  unknown: number;
};

export type ChannelCount = {
  channel: number;
  band: CompactNetwork['band'];
  count: number;
};

export type WifiSummary = {
  total: number;
  hidden: number;
  open: number;
  ibss: number;
  byBand: BandCounts;
  bySecurity: Record<string, number>;
  byVendor: Record<string, number>;
  topChannels: ChannelCount[];
  strongest: CompactNetwork | null;
  weakest: CompactNetwork | null;
};

function bump(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}

function strongestOf(networks: readonly CompactNetwork[]): CompactNetwork | null {
  return networks.reduce<CompactNetwork | null>((best, row) => {
    if (row.rssiDbm == null) return best;
    if (!best || best.rssiDbm == null || row.rssiDbm > best.rssiDbm) return row;
    return best;
  }, null);
}

function weakestOf(networks: readonly CompactNetwork[]): CompactNetwork | null {
  return networks.reduce<CompactNetwork | null>((worst, row) => {
    if (row.rssiDbm == null) return worst;
    if (!worst || worst.rssiDbm == null || row.rssiDbm < worst.rssiDbm) return row;
    return worst;
  }, null);
}

export function buildSummary(
  networks: readonly CompactNetwork[],
  top = 5,
  ibssCount = 0
): WifiSummary {
  const byBand: BandCounts = { '2.4': 0, '5': 0, '6': 0, unknown: 0 };
  const bySecurity: Record<string, number> = {};
  const byVendor: Record<string, number> = {};
  const channelCounts = new Map<string, ChannelCount>();

  for (const row of networks) {
    if (row.band != null) byBand[String(row.band) as keyof BandCounts] += 1;
    else byBand.unknown += 1;

    bump(bySecurity, row.security ?? 'unknown');
    bump(byVendor, row.vendor ?? 'unknown');

    if (row.channel != null) {
      const key = `${row.channel}`;
      const current = channelCounts.get(key);
      if (current) current.count += 1;
      else channelCounts.set(key, { channel: row.channel, band: row.band, count: 1 });
    }
  }

  const limit = Math.max(1, Math.floor(top));
  const topChannels = [...channelCounts.values()]
    .sort((a, b) => b.count - a.count || a.channel - b.channel)
    .slice(0, limit);

  return {
    total: networks.length,
    hidden: networks.filter((row) => row.hidden === true).length,
    open: networks.filter((row) => row.security === 'open').length,
    ibss: ibssCount,
    byBand,
    bySecurity,
    byVendor,
    topChannels,
    strongest: strongestOf(networks),
    weakest: weakestOf(networks),
  };
}
