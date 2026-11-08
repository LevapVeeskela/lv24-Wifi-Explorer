/**
 * `wifi_network` — look up a single BSS by BSSID.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { toCompactNetwork, type CompactNetwork } from '../format/compact.js';
import type { ScanService } from '../scan/service.js';
import { withErrorHandling, type ToolTextResult } from './shared.js';

export const wifiNetworkShape = {
  bssid: z
    .string()
    .min(1)
    .describe('BSSID to look up, e.g. `aa:bb:cc:dd:ee:ff` (case/separators insensitive).'),
  refresh: z.boolean().optional().describe('Force a fresh scan instead of the cached snapshot.'),
};

export type WifiNetworkArgs = {
  bssid: string;
  refresh?: boolean;
};

export type WifiNetworkPayload = CompactNetwork | { error: 'not_found' };

/** `aa:bb:cc:dd:ee:ff`, `AA-BB-CC-DD-EE-FF` and `aabbccddeeff` normalize alike. */
export function normalizeBssid(raw: string): string | null {
  const hex = raw.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  if (hex.length !== 12) return null;
  return (hex.match(/.{2}/g) ?? []).join(':');
}

export async function runWifiNetwork(
  service: ScanService,
  args: WifiNetworkArgs
): Promise<WifiNetworkPayload> {
  const target = normalizeBssid(args.bssid);
  if (!target) return { error: 'not_found' };

  const snapshot = await service.getSnapshot({ refresh: args.refresh ?? false });
  const match = snapshot.rows.find(
    (row) => row.identity.bssid.status === 'available' && row.identity.bssid.value === target
  );
  return match ? toCompactNetwork(match) : { error: 'not_found' };
}

export function createWifiNetworkHandler(
  service: ScanService
): (args: WifiNetworkArgs) => Promise<ToolTextResult> {
  return withErrorHandling((args: WifiNetworkArgs) => runWifiNetwork(service, args));
}

export function registerWifiNetworkTool(server: McpServer, service: ScanService): void {
  server.registerTool(
    'wifi_network',
    {
      title: 'Inspect one Wi-Fi network',
      description:
        'Look up a single BSS by BSSID in the cached scan (or trigger a fresh one with `refresh`). Returns the compact row or `{ "error": "not_found" }`.',
      inputSchema: wifiNetworkShape,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    createWifiNetworkHandler(service)
  );
}
