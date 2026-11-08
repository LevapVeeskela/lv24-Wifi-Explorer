/**
 * `wifi_providers` — what this machine can actually report.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { platformProviderId, type ScanProviderId } from '@lv24/wifi-backend';
import { resolveMacScanCoreBinary } from '../scan/helper.js';
import { withErrorHandling } from './shared.js';

export type ProviderCapabilities = {
  ssid: boolean;
  bssid: boolean;
  channelWidth: boolean;
  noise: boolean;
  informationElements: boolean;
};

export type ProviderInfo = {
  id: Exclude<ScanProviderId, 'auto'>;
  available: boolean;
  capabilities: ProviderCapabilities;
};

export type ProvidersPayload = {
  platform: NodeJS.Platform;
  autoProvider: Exclude<ScanProviderId, 'auto'>;
  demo: boolean;
  macosHelper: {
    resolvable: boolean;
    path: string | null;
    env: { LV24_SCANCORE_PATH: boolean; LV24_RESOURCES_PATH: boolean };
  };
  providers: ProviderInfo[];
};

const MACOS_CAPABILITIES: ProviderCapabilities = {
  ssid: true,
  bssid: true,
  channelWidth: true,
  noise: true,
  informationElements: true,
};

const NMCLI_CAPABILITIES: ProviderCapabilities = {
  ssid: true,
  bssid: true,
  channelWidth: false,
  noise: false,
  informationElements: false,
};

const NETSH_CAPABILITIES: ProviderCapabilities = {
  ssid: true,
  bssid: true,
  channelWidth: false,
  noise: false,
  informationElements: false,
};

const DEMO_CAPABILITIES: ProviderCapabilities = {
  ssid: true,
  bssid: true,
  channelWidth: true,
  noise: true,
  informationElements: false,
};

export function providersPayload(
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env
): ProvidersPayload {
  const helperPath = resolveMacScanCoreBinary(env);
  const autoProvider = platformProviderId(platform) as ProviderInfo['id'];

  const providers: ProviderInfo[] = [
    {
      id: 'macos-scancore',
      available: platform === 'darwin' && helperPath != null,
      capabilities: MACOS_CAPABILITIES,
    },
    {
      id: 'linux-nmcli',
      available: platform === 'linux',
      capabilities: NMCLI_CAPABILITIES,
    },
    {
      id: 'windows-netsh',
      available: platform === 'win32',
      capabilities: NETSH_CAPABILITIES,
    },
    {
      id: 'demo',
      available: true,
      capabilities: DEMO_CAPABILITIES,
    },
  ];

  return {
    platform,
    autoProvider,
    demo: autoProvider === 'demo',
    macosHelper: {
      resolvable: helperPath != null,
      path: helperPath,
      env: {
        LV24_SCANCORE_PATH: Boolean(env.LV24_SCANCORE_PATH),
        LV24_RESOURCES_PATH: Boolean(env.LV24_RESOURCES_PATH),
      },
    },
    providers,
  };
}

export function registerWifiProvidersTool(server: McpServer): void {
  server.registerTool(
    'wifi_providers',
    {
      title: 'Wi-Fi scan providers',
      description:
        'List scan providers available on this machine (demo, macOS ScanCore, Linux nmcli, Windows netsh) with the fields each can report. Reports whether the macOS ScanCore helper or its env vars are resolvable.',
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    withErrorHandling(async () => providersPayload())
  );
}
