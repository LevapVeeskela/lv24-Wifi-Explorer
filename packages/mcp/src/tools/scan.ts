/**
 * `wifi_scan` — one scan, projected to compact rows.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { selectFields, type PartialCompactNetwork } from '../format/compact.js';
import { DEFAULT_INTERVAL_MS, DEFAULT_TIMEOUT_MS, type ScanService } from '../scan/service.js';
import { withErrorHandling, type ToolTextResult } from './shared.js';

export const SCAN_PROVIDERS = [
  'auto',
  'demo',
  'macos-scancore',
  'linux-nmcli',
  'windows-netsh',
] as const;

export const MAX_SCAN_LIMIT = 500;
export const DEFAULT_SCAN_LIMIT = 50;

export const wifiScanShape = {
  provider: z
    .enum(SCAN_PROVIDERS)
    .optional()
    .describe('Scan backend; `auto` picks the native one.'),
  ssid: z
    .string()
    .min(1)
    .max(32)
    .optional()
    .describe('Directed scan for one SSID (macOS only; other providers ignore it).'),
  includeHidden: z.boolean().optional().describe('Include hidden SSIDs (default true).'),
  intervalMs: z
    .number()
    .int()
    .min(500)
    .max(600_000)
    .optional()
    .describe(`Poll interval in ms (default ${DEFAULT_INTERVAL_MS}).`),
  timeoutMs: z
    .number()
    .int()
    .min(500)
    .max(120_000)
    .optional()
    .describe(`Wait for the first snapshot (default ${DEFAULT_TIMEOUT_MS}).`),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_SCAN_LIMIT)
    .optional()
    .describe(`Maximum networks returned, strongest first (default ${DEFAULT_SCAN_LIMIT}).`),
  fields: z
    .array(z.string())
    .optional()
    .describe(
      'Subset of compact fields: bssid, ssid, hidden, rssiDbm, snrDb, noiseDbm, channel, band, widthMhz, security, phy, vendor, lastSeenAt.'
    ),
};

export type WifiScanArgs = {
  provider?: (typeof SCAN_PROVIDERS)[number];
  ssid?: string;
  includeHidden?: boolean;
  intervalMs?: number;
  timeoutMs?: number;
  limit?: number;
  fields?: string[];
};

export type WifiScanPayload = {
  provider: string;
  source: string;
  demo: boolean;
  capturedAt: string;
  location: string;
  total: number;
  returned: number;
  networks: PartialCompactNetwork[];
};

function clampLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit ?? Number.NaN)) return DEFAULT_SCAN_LIMIT;
  return Math.min(MAX_SCAN_LIMIT, Math.max(1, Math.floor(limit as number)));
}

export async function runWifiScan(
  service: ScanService,
  args: WifiScanArgs = {}
): Promise<WifiScanPayload> {
  const snapshot = await service.scan({
    provider: args.provider,
    directedSsid: args.ssid,
    includeHidden: args.includeHidden,
    intervalMs: args.intervalMs,
    timeoutMs: args.timeoutMs,
  });

  const limit = clampLimit(args.limit);
  const sorted = [...snapshot.rows].sort((a, b) => b.signal.rssiDbm - a.signal.rssiDbm);
  const networks = selectFields(sorted.slice(0, limit), args.fields);

  return {
    provider: snapshot.provider,
    source: snapshot.source,
    demo: snapshot.demo,
    capturedAt: snapshot.capturedAt,
    location: snapshot.location,
    total: snapshot.rows.length,
    returned: networks.length,
    networks,
  };
}

export function createWifiScanHandler(
  service: ScanService
): (args: WifiScanArgs) => Promise<ToolTextResult> {
  return withErrorHandling((args: WifiScanArgs) => runWifiScan(service, args));
}

export function registerWifiScanTool(server: McpServer, service: ScanService): void {
  server.registerTool(
    'wifi_scan',
    {
      title: 'Scan Wi-Fi networks',
      description:
        'Run (or refresh) a Wi-Fi scan and return compact BSS rows: BSSID, SSID, hidden flag, RSSI/SNR/noise, channel/band/width, security, PHY, vendor. Strongest networks first.',
      inputSchema: wifiScanShape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    createWifiScanHandler(service)
  );
}
