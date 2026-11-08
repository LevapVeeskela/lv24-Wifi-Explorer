/**
 * MCP server factory — registers every Wi-Fi tool on one `McpServer`.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ScanService } from './scan/service.js';
import { registerWifiChannelsTool } from './tools/channels.js';
import { registerWifiIssuesTool } from './tools/issues.js';
import { registerWifiNetworkTool } from './tools/network.js';
import { registerWifiProvidersTool } from './tools/providers.js';
import { registerWifiScanTool } from './tools/scan.js';
import { registerWifiSummaryTool } from './tools/summary.js';

export const WIFI_MCP_SERVER_NAME = 'lv24-wifi';
export const WIFI_MCP_SERVER_VERSION = '1.0.0';

export function createWifiMcpServer(service: ScanService = new ScanService()): McpServer {
  const server = new McpServer({
    name: WIFI_MCP_SERVER_NAME,
    version: WIFI_MCP_SERVER_VERSION,
  });

  registerWifiProvidersTool(server);
  registerWifiScanTool(server, service);
  registerWifiNetworkTool(server, service);
  registerWifiSummaryTool(server, service);
  registerWifiChannelsTool(server, service);
  registerWifiIssuesTool(server, service);

  return server;
}
