/**
 * `wifi_channels` — per-channel utilization from the current scan.
 *
 * Beacon airtime is a modelled estimate derived from beacon size/interval and
 * `maxRate`; it is never a measurement. `estimate: true` is part of the payload
 * so no client can present it as measured airtime.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  channelsForBand,
  computeUtilization,
  type BandGhz,
  type ObservedBss,
  type UtilizationTotals,
} from '@lv24/wifi-core';
import { z } from 'zod';
import type { ScanService } from '../scan/service.js';
import { withErrorHandling, type ToolTextResult } from './shared.js';

export const CHANNEL_BAND_ARGS = ['2.4', '5', '6'] as const;

export type ChannelBandArg = (typeof CHANNEL_BAND_ARGS)[number];

export const BEACON_ESTIMATE_NOTE = 'beacon overhead is an estimate, not a measurement';

const BAND_BY_ARG: Record<ChannelBandArg, BandGhz> = { '2.4': 2.4, '5': 5, '6': 6 };

const BAND_ORDER: Record<BandGhz, number> = { '2.4': 0, 5: 1, 6: 2 };

export const wifiChannelsShape = {
  refresh: z.boolean().optional().describe('Force a fresh scan instead of the cached snapshot.'),
  band: z
    .enum(CHANNEL_BAND_ARGS)
    .optional()
    .describe('Restrict the report to one band (`2.4`, `5` or `6`).'),
  includeEmpty: z
    .boolean()
    .optional()
    .describe('Also emit zero-count rows for the standard channel plan of the reported bands.'),
};

export type WifiChannelsArgs = {
  refresh?: boolean;
  band?: ChannelBandArg;
  includeEmpty?: boolean;
};

export type CompactChannel = {
  band: BandGhz;
  channel: number;
  networks: number;
  overlappingBss: number;
  strongestRssiDbm: number | null;
  averageRssiDbm: number | null;
  beaconAirtimePct: number;
  estimate: true;
};

export type WifiChannelsPayload = {
  capturedAt: string;
  source: string;
  demo: boolean;
  estimate: true;
  note: string;
  channels: CompactChannel[];
  byBand: UtilizationTotals[];
  overall: UtilizationTotals;
};

function emptyChannel(band: BandGhz, channel: number): CompactChannel {
  return {
    band,
    channel,
    networks: 0,
    overlappingBss: 0,
    strongestRssiDbm: null,
    averageRssiDbm: null,
    beaconAirtimePct: 0,
    estimate: true,
  };
}

function compareChannels(a: CompactChannel, b: CompactChannel): number {
  return BAND_ORDER[a.band] - BAND_ORDER[b.band] || a.channel - b.channel;
}

/** Add zero-count rows for plan channels that no BSS uses (opt-in, noisy). */
function withEmptyChannels(
  channels: CompactChannel[],
  bands: readonly BandGhz[]
): CompactChannel[] {
  const seen = new Set(channels.map((row) => `${row.band}:${row.channel}`));
  const fillers: CompactChannel[] = [];
  for (const band of bands) {
    for (const channel of channelsForBand(band)) {
      if (!seen.has(`${band}:${channel}`)) fillers.push(emptyChannel(band, channel));
    }
  }
  return [...channels, ...fillers].sort(compareChannels);
}

function selectRows(rows: readonly ObservedBss[], band: ChannelBandArg | undefined): ObservedBss[] {
  if (!band) return [...rows];
  const target = BAND_BY_ARG[band];
  return rows.filter((row) => row.channel.band === target);
}

export async function runWifiChannels(
  service: ScanService,
  args: WifiChannelsArgs = {}
): Promise<WifiChannelsPayload> {
  const snapshot = await service.getSnapshot({ refresh: args.refresh ?? false });
  const report = computeUtilization(selectRows(snapshot.rows, args.band));

  const channels: CompactChannel[] = report.channels.map((row) => ({
    band: row.band,
    channel: row.channel,
    networks: row.networkCount,
    overlappingBss: row.overlappingBssCount,
    strongestRssiDbm: row.strongestRssiDbm,
    averageRssiDbm: row.averageRssiDbm,
    beaconAirtimePct: row.beacon.beaconAirtimePct,
    estimate: true,
  }));

  const bands = args.band
    ? [BAND_BY_ARG[args.band]]
    : [...new Set(report.byBand.map((totals) => totals.band))].filter(
        (band): band is BandGhz => band !== 'all'
      );

  return {
    capturedAt: snapshot.capturedAt,
    source: snapshot.source,
    demo: snapshot.demo,
    estimate: true,
    note: BEACON_ESTIMATE_NOTE,
    channels: args.includeEmpty ? withEmptyChannels(channels, bands) : channels,
    byBand: report.byBand,
    overall: report.overall,
  };
}

export function createWifiChannelsHandler(
  service: ScanService
): (args: WifiChannelsArgs) => Promise<ToolTextResult> {
  return withErrorHandling((args: WifiChannelsArgs) => runWifiChannels(service, args));
}

export function registerWifiChannelsTool(server: McpServer, service: ScanService): void {
  server.registerTool(
    'wifi_channels',
    {
      title: 'Channel utilization and overlap',
      description:
        'Per-channel view of the cached scan: BSS count, overlapping BSS, strongest/average RSSI and estimated beacon airtime, plus per-band and overall totals. `beaconAirtimePct` is an estimate (beacon size/interval at max rate), not a measurement. Optional `band` filter and `includeEmpty` channel-plan rows.',
      inputSchema: wifiChannelsShape,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    createWifiChannelsHandler(service)
  );
}
