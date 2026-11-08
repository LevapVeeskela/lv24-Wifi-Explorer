// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createWifiMcpServer } from './server.js';
import { ScanService } from './scan/service.js';

type TextContent = { type: string; text?: string };

describe('createWifiMcpServer (in-memory transport)', () => {
  let client: Client;
  let server: McpServer;

  beforeAll(async () => {
    server = createWifiMcpServer(new ScanService({ ouiLookup: null }));
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: 'lv24-wifi-test', version: '1.0.0' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  });

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  it('lists all six Wi-Fi tools', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name).sort();

    expect(names).toEqual([
      'wifi_channels',
      'wifi_issues',
      'wifi_network',
      'wifi_providers',
      'wifi_scan',
      'wifi_summary',
    ]);
    for (const tool of tools) {
      expect(tool.title?.length ?? 0).toBeGreaterThan(0);
      expect(tool.description?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('runs wifi_scan with the demo provider', async () => {
    const result = await client.callTool({
      name: 'wifi_scan',
      arguments: { provider: 'demo', limit: 2 },
    });
    const [content] = result.content as TextContent[];
    expect(result.isError).toBeFalsy();
    expect(content?.type).toBe('text');

    const payload = JSON.parse(content?.text ?? '{}') as {
      provider: string;
      total: number;
      returned: number;
      networks: Array<{ bssid: string }>;
    };
    expect(payload).toMatchObject({ provider: 'demo', total: 3, returned: 2 });
    expect(payload.networks).toHaveLength(2);
  });

  it('returns wifi_providers and wifi_summary payloads', async () => {
    const providers = await client.callTool({ name: 'wifi_providers', arguments: {} });
    const providersPayload = JSON.parse((providers.content as TextContent[])[0]?.text ?? '{}') as {
      providers: Array<{ id: string }>;
    };
    expect(providersPayload.providers.map((item) => item.id)).toContain('demo');

    // Seed the cache with deterministic demo data, then summarize it.
    await client.callTool({ name: 'wifi_scan', arguments: { provider: 'demo' } });
    const summary = await client.callTool({ name: 'wifi_summary', arguments: { refresh: true } });
    const summaryPayload = JSON.parse((summary.content as TextContent[])[0]?.text ?? '{}') as {
      total?: number;
      error?: string;
    };
    expect(summaryPayload.total).toBe(3);
  });
});
