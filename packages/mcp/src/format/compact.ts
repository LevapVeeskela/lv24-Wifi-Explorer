/**
 * Compact, agent-friendly projection of `ObservedBss`.
 *
 * The full domain row is ~100 fields; MCP clients only need the essentials and
 * a stable field vocabulary so an LLM can reason about the scan.
 */

import type { BandGhz, ChannelWidthMhz } from '@lv24/wifi-core';
import type { ObservedBss } from '@lv24/wifi-core';

export const COMPACT_FIELDS = [
  'bssid',
  'ssid',
  'hidden',
  'rssiDbm',
  'snrDb',
  'noiseDbm',
  'channel',
  'band',
  'widthMhz',
  'security',
  'phy',
  'vendor',
  'lastSeenAt',
] as const;

export type CompactField = (typeof COMPACT_FIELDS)[number];

const COMPACT_FIELD_SET: ReadonlySet<string> = new Set(COMPACT_FIELDS);

export type CompactNetwork = {
  bssid: string | null;
  ssid: string | null;
  hidden: boolean | null;
  rssiDbm: number | null;
  snrDb: number | null;
  noiseDbm: number | null;
  channel: number | null;
  band: BandGhz | null;
  widthMhz: ChannelWidthMhz | null;
  security: string | null;
  phy: string | null;
  vendor: string | null;
  lastSeenAt: string | null;
};

export type PartialCompactNetwork = Partial<CompactNetwork>;

export const DEFAULT_COMPACT_FIELDS: readonly CompactField[] = COMPACT_FIELDS;

export function isCompactField(value: string): value is CompactField {
  return COMPACT_FIELD_SET.has(value);
}

/** True when the caller asked for a field we do not expose. */
export function unknownFields(fields: readonly string[] | undefined): string[] {
  if (!fields) return [];
  return fields.filter((field) => !COMPACT_FIELD_SET.has(field));
}

/** Safe projection: location-gated and `unknown` values become `null`. */
export function toCompactNetwork(bss: ObservedBss): CompactNetwork {
  const bssid = bss.identity.bssid;
  const ssid = bss.identity.ssid;
  const width = bss.channel.widthMhz;
  const band = bss.channel.band;
  const channel = bss.channel.number > 0 ? bss.channel.number : null;
  const phy = bss.phy.display;

  return {
    bssid: bssid.status === 'available' ? bssid.value : null,
    ssid: ssid.status === 'available' && !ssid.value.hidden ? ssid.value.utf8 : null,
    hidden: ssid.status === 'available' ? ssid.value.hidden : null,
    rssiDbm: bss.signal.rssiDbm,
    snrDb: bss.signal.snrDb,
    noiseDbm: bss.signal.noiseDbm,
    channel,
    band: band === 'unknown' ? null : band,
    widthMhz: width === 'unknown' ? null : width,
    security: bss.security.primary,
    phy: phy === '' ? null : phy,
    vendor: bss.vendor.organization,
    lastSeenAt: bss.presence.lastSeenAt,
  };
}

/**
 * Project rows to the requested field set.
 *
 * Unknown field names are ignored with a warning (LLMs hallucinate field names
 * more often than they need a hard failure); an empty result falls back to the
 * default compact set so a tool call never returns an empty object per row.
 */
export function selectFields(
  networks: readonly ObservedBss[],
  fields?: readonly string[],
  warn: (message: string) => void = console.warn
): PartialCompactNetwork[] {
  const projected = networks.map(toCompactNetwork);
  const requested = (fields ?? DEFAULT_COMPACT_FIELDS).filter((field) => {
    if (isCompactField(field)) return true;
    warn(`[wifi-mcp] unknown field "${field}" ignored; allowed: ${COMPACT_FIELDS.join(', ')}`);
    return false;
  });
  const selected = requested.length > 0 ? requested : [...DEFAULT_COMPACT_FIELDS];
  return projected.map((network) => {
    const row: PartialCompactNetwork = {};
    for (const field of selected) {
      (row as Record<string, unknown>)[field] = network[field as CompactField];
    }
    return row;
  });
}
