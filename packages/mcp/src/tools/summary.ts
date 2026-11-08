/**
 * `wifi_summary` — aggregate orientation over the current scan.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { toCompactNetwork } from '../format/compact.js';
import { buildSummary, type WifiSummary } from '../format/summary.js';
import type { ScanService } from '../scan/service.js';
import { withErrorHandling, type ToolTextResult } from './shared.js';

export const MAX_SUMMARY_TOP = 20;
export const DEFAULT_SUMMARY_TOP = 5;

export const wifiSummaryShape = {
  refresh: z.boolean().optional().describe('Force a fresh scan instead of the cached snapshot.'),
  top: z
    .number()
    .int()
    .min(1)
    .max(MAX_SUMMARY_TOP)
    .optional()
    .describe(`How many busiest channels to report (default ${DEFAULT_SUMMARY_TOP}).`),
};

export type WifiSummaryArgs = {
  refresh?: boolean;
  top?: number;
};

export type WifiSummaryPayload = WifiSummary & {
  capturedAt: string;
  provider: string;
  demo: boolean;
};

function clampTop(top: number | undefined): number {
  if (!Number.isFinite(top ?? Number.NaN)) return DEFAULT_SUMMARY_TOP;
  return Math.min(MAX_SUMMARY_TOP, Math.max(1, Math.floor(top as number)));
}

export async function runWifiSummary(
  service: ScanService,
  args: WifiSummaryArgs = {}
): Promise<WifiSummaryPayload> {
  const snapshot = await service.getSnapshot({ refresh: args.refresh ?? false });
  const rows = snapshot.rows.map(toCompactNetwork);
  const ibss = snapshot.rows.filter((row) => row.ibss).length;
  return {
    capturedAt: snapshot.capturedAt,
    provider: snapshot.provider,
    demo: snapshot.demo,
    ...buildSummary(rows, clampTop(args.top), ibss),
  };
}

export function createWifiSummaryHandler(
  service: ScanService
): (args: WifiSummaryArgs) => Promise<ToolTextResult> {
  return withErrorHandling((args: WifiSummaryArgs) => runWifiSummary(service, args));
}

export function registerWifiSummaryTool(server: McpServer, service: ScanService): void {
  server.registerTool(
    'wifi_summary',
    {
      title: 'Summarize the Wi-Fi environment',
      description:
        'Aggregate counts from the current scan: bands, security types, vendors, busiest channels, strongest/weakest network, hidden and open network counts.',
      inputSchema: wifiSummaryShape,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    createWifiSummaryHandler(service)
  );
}
