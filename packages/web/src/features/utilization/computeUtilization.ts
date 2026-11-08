/**
 * Per-channel utilization + beacon overhead `ESTIMATE`.
 *
 * Everything in this module is derived from the current scan snapshot.
 * `beaconAirtimePct` is a modelled upper-ish estimate (beacon bytes at
 * `maxRate`), never a measured airtime — the `estimate: true` discriminator is
 * part of the public contract so callers cannot present it as measured.
 */

import type { ObservedBss } from '@/domain/bss';
import type { BandGhz } from '@/domain/channel';
import { primaryChannelsOverlap } from '@/features/scan-issues/overlap';

/** Typical beacon frame size (MAC header + fixed + SSID/RSN/HT/VHT/HE IEs). */
export const DEFAULT_BEACON_BYTES = 250;

/** Beacon interval assumed when the BSS reports none (802.11 default). */
export const FALLBACK_BEACON_INTERVAL_SEC = 0.1;

/**
 * Beacon transmit rate assumed when `maxRate` is unavailable.
 * 6 Mbps is the lowest 802.11a/g basic rate — a pessimistic (over-estimating) floor.
 */
export const FALLBACK_BEACON_RATE_MBPS = 6;

export type BeaconOverheadEstimate = {
  /** Always true: the value is modelled, not measured. */
  estimate: true;
  /** Estimated beacon airtime on this channel, percent, clamped to 0…100. */
  beaconAirtimePct: number;
  /** BSS that contributed to the sum. */
  contributingBss: number;
  /** At least one BSS had no usable `maxRate` and used the fallback rate. */
  usedFallbackRate: boolean;
  /** At least one BSS had no usable beacon interval and used the fallback. */
  usedFallbackInterval: boolean;
};

export type ChannelUtilization = {
  band: BandGhz;
  channel: number;
  /** BSS whose primary channel is exactly this channel. */
  networkCount: number;
  /** BSS in the same band whose primary channel overlaps this 20 MHz channel. */
  overlappingBssCount: number;
  strongestRssiDbm: number | null;
  averageRssiDbm: number | null;
  beacon: BeaconOverheadEstimate;
};

export type UtilizationTotals = {
  band: BandGhz | 'all';
  channelCount: number;
  networkCount: number;
  /** Distinct BSS in the selection (not a sum of per-channel overlap counts). */
  overlappingBssCount: number;
  strongestRssiDbm: number | null;
  averageRssiDbm: number | null;
  beaconAirtimePct: number;
};

export type UtilizationReport = {
  /** Channels that have at least one BSS, ascending by band then channel. */
  channels: ChannelUtilization[];
  byBand: UtilizationTotals[];
  overall: UtilizationTotals;
  /** Always true for the whole report (beacon fields are modelled). */
  estimate: true;
};

export type ComputeUtilizationOptions = {
  beaconBytes?: number;
};

type BeaconContribution = {
  pct: number;
  fallbackRate: boolean;
  fallbackInterval: boolean;
};

function supportedBand(bss: ObservedBss): BandGhz | null {
  const band = bss.channel.band;
  return band === 2.4 || band === 5 || band === 6 ? band : null;
}

function usableBss(bss: ObservedBss): boolean {
  return supportedBand(bss) != null && bss.channel.number > 0;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clampPct(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, round(value, 3));
}

function beaconContribution(bss: ObservedBss, beaconBytes: number): BeaconContribution {
  const intervalMs = bss.beaconIntervalMs;
  const hasInterval = Number.isFinite(intervalMs) && intervalMs > 0;
  const intervalSec = hasInterval ? intervalMs / 1000 : FALLBACK_BEACON_INTERVAL_SEC;

  const maxRate = bss.maxRate?.mbpsLow;
  const hasRate = typeof maxRate === 'number' && Number.isFinite(maxRate) && maxRate > 0;
  const rateMbps = hasRate ? maxRate : FALLBACK_BEACON_RATE_MBPS;

  // bits → seconds: bits / (Mbps × 10^6), then airtime fraction of the interval.
  const airtimeSec = (beaconBytes * 8) / (rateMbps * 1_000_000);

  return {
    pct: (airtimeSec / intervalSec) * 100,
    fallbackRate: !hasRate,
    fallbackInterval: !hasInterval,
  };
}

function beaconEstimate(
  bssList: readonly ObservedBss[],
  beaconBytes: number
): BeaconOverheadEstimate {
  let sum = 0;
  let usedFallbackRate = false;
  let usedFallbackInterval = false;

  for (const bss of bssList) {
    const contribution = beaconContribution(bss, beaconBytes);
    sum += contribution.pct;
    usedFallbackRate ||= contribution.fallbackRate;
    usedFallbackInterval ||= contribution.fallbackInterval;
  }

  return {
    estimate: true,
    beaconAirtimePct: clampPct(sum),
    contributingBss: bssList.length,
    usedFallbackRate,
    usedFallbackInterval,
  };
}

function strongestRssiOf(bssList: readonly ObservedBss[]): number | null {
  let strongest: number | null = null;
  for (const bss of bssList) {
    const rssi = bss.signal.rssiDbm;
    if (!Number.isFinite(rssi)) continue;
    if (strongest == null || rssi > strongest) strongest = rssi;
  }
  return strongest;
}

function averageRssiOf(bssList: readonly ObservedBss[]): number | null {
  let sum = 0;
  let count = 0;
  for (const bss of bssList) {
    const rssi = bss.signal.rssiDbm;
    if (!Number.isFinite(rssi)) continue;
    sum += rssi;
    count += 1;
  }
  return count === 0 ? null : round(sum / count, 1);
}

function totalsOf(
  band: BandGhz | 'all',
  bssList: readonly ObservedBss[],
  channels: readonly ChannelUtilization[],
  beaconBytes: number
): UtilizationTotals {
  return {
    band,
    channelCount: channels.length,
    networkCount: bssList.length,
    overlappingBssCount: bssList.length,
    strongestRssiDbm: strongestRssiOf(bssList),
    averageRssiDbm: averageRssiOf(bssList),
    beaconAirtimePct: beaconEstimate(bssList, beaconBytes).beaconAirtimePct,
  };
}

/** Sorted band order for stable output. */
const BAND_ORDER: Record<BandGhz, number> = { 2.4: 0, 5: 1, 6: 2 };

export function computeUtilization(
  bssList: readonly ObservedBss[],
  options: ComputeUtilizationOptions = {}
): UtilizationReport {
  const beaconBytes =
    typeof options.beaconBytes === 'number' &&
    Number.isFinite(options.beaconBytes) &&
    options.beaconBytes > 0
      ? options.beaconBytes
      : DEFAULT_BEACON_BYTES;

  const groups = new Map<string, { band: BandGhz; channel: number; bss: ObservedBss[] }>();
  for (const bss of bssList) {
    const band = supportedBand(bss);
    if (band == null || bss.channel.number <= 0) continue;
    const key = `${band}:${bss.channel.number}`;
    const group = groups.get(key);
    if (group) group.bss.push(bss);
    else groups.set(key, { band, channel: bss.channel.number, bss: [bss] });
  }

  const usable = bssList.filter(usableBss);

  const channels: ChannelUtilization[] = [...groups.values()]
    .map((group) => {
      const overlapping = usable.filter(
        (other) =>
          other.channel.band === group.band &&
          primaryChannelsOverlap(other.channel, {
            number: group.channel,
            widthMhz: 20,
          })
      ).length;

      return {
        band: group.band,
        channel: group.channel,
        networkCount: group.bss.length,
        overlappingBssCount: overlapping,
        strongestRssiDbm: strongestRssiOf(group.bss),
        averageRssiDbm: averageRssiOf(group.bss),
        beacon: beaconEstimate(group.bss, beaconBytes),
      };
    })
    .sort((a, b) => BAND_ORDER[a.band] - BAND_ORDER[b.band] || a.channel - b.channel);

  const bands = [...new Set(channels.map((row) => row.band))].sort(
    (a, b) => BAND_ORDER[a] - BAND_ORDER[b]
  );

  const byBand = bands.map((band) =>
    totalsOf(
      band,
      usable.filter((bss) => bss.channel.band === band),
      channels.filter((row) => row.band === band),
      beaconBytes
    )
  );

  return {
    channels,
    byBand,
    overall: totalsOf('all', usable, channels, beaconBytes),
    estimate: true,
  };
}
