#!/usr/bin/env node
/**
 * stdio entry point for the LV24 Wi-Fi MCP server.
 * Stdout is the MCP channel — all diagnostics go to stderr.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createWifiMcpServer } from './server.js';
import { errorMessage } from './tools/shared.js';

async function main(): Promise<void> {
  const server = createWifiMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[lv24-wifi-mcp] ready on stdio\n');
}

main().catch((error: unknown) => {
  process.stderr.write(`[lv24-wifi-mcp] fatal: ${errorMessage(error)}\n`);
  process.exitCode = 1;
});
