// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createWifiNetworkHandler, runWifiNetwork } from './network.js';
import { runWifiSummary } from './summary.js';
import { runWifiScan } from './scan.js';
import { providersPayload } from './providers.js';
import { ScanService } from '../scan/service.js';

function createDemoService(): ScanService {
  return new ScanService({ ouiLookup: null });
}

function parse<T>(result: {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}): T {
  const first = result.content[0];
  if (!first || first.type !== 'text' || typeof first.text !== 'string') {
    throw new Error('expected a text tool result');
  }
  return JSON.parse(first.text) as T;
}

describe('runWifiScan', () => {
  it('returns every demo network by default', async () => {
    const payload = await runWifiScan(createDemoService(), { provider: 'demo' });

    expect(payload).toMatchObject({
      provider: 'demo',
      demo: true,
      total: 3,
      returned: 3,
    });
    expect(payload.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(payload.networks[0]).toHaveProperty('bssid');
  });

  it('honours limit (strongest first) and fields', async () => {
    const payload = await runWifiScan(createDemoService(), {
      provider: 'demo',
      limit: 2,
      fields: ['bssid', 'rssiDbm'],
    });

    expect(payload.total).toBe(3);
    expect(payload.returned).toBe(2);
    expect(payload.networks.map((row) => row.bssid)).toEqual([
      '02:11:22:33:44:55',
      '02:11:22:33:44:66',
    ]);
    expect(Object.keys(payload.networks[0]!)).toEqual(['bssid', 'rssiDbm']);
  });

  it('matches a case/separator-insensitive BSSID lookup and reports not_found', async () => {
    const service = createDemoService();
    await service.scan({ provider: 'demo' });
    const found = await runWifiNetwork(service, { bssid: '02-11-22-33-44-77' });
    expect(found).toMatchObject({ bssid: '02:11:22:33:44:77', hidden: true, security: 'open' });

    const missing = await runWifiNetwork(service, { bssid: 'aa:bb:cc:dd:ee:ff' });
    expect(missing).toEqual({ error: 'not_found' });

    const malformed = await runWifiNetwork(service, { bssid: 'not-a-bssid' });
    expect(malformed).toEqual({ error: 'not_found' });
  });

  it('summarizes bands, security, channels, hidden/open and extremes', async () => {
    const service = createDemoService();
    await service.scan({ provider: 'demo' });
    const summary = await runWifiSummary(service, { top: 2 });

    expect(summary.total).toBe(3);
    expect(summary.hidden).toBe(1);
    expect(summary.open).toBe(1);
    expect(summary.byBand).toEqual({ '2.4': 1, '5': 2, '6': 0, unknown: 0 });
    expect(summary.bySecurity).toEqual({ 'wpa3-personal': 1, 'wpa2-personal': 1, open: 1 });
    expect(summary.topChannels).toEqual([
      { channel: 6, band: 2.4, count: 1 },
      { channel: 36, band: 5, count: 1 },
    ]);
    expect(summary.strongest?.bssid).toBe('02:11:22:33:44:55');
    expect(summary.weakest?.bssid).toBe('02:11:22:33:44:77');
  });

  it('returns a readable isError result instead of throwing', async () => {
    const service = new ScanService({
      createProvider: () => ({
        id: 'demo',
        platform: 'darwin',
        start: async () => {
          throw new Error('ScanCore helper not found.');
        },
        stop: async () => undefined,
        onEvent: () => () => undefined,
      }),
    });

    const result = await createWifiNetworkHandler(service)({ bssid: '02:11:22:33:44:55' });

    expect(result.isError).toBe(true);
    expect(parse<{ error: string }>(result).error).toContain('ScanCore helper not found.');
    expect(result.content[0]?.text).not.toContain('at ');
  });
});

describe('providersPayload', () => {
  it('reports platform availability and capabilities', () => {
    const payload = providersPayload('linux', {});

    expect(payload.autoProvider).toBe('linux-nmcli');
    expect(payload.demo).toBe(false);
    expect(payload.providers.find((item) => item.id === 'linux-nmcli')).toEqual({
      id: 'linux-nmcli',
      available: true,
      capabilities: {
        ssid: true,
        bssid: true,
        channelWidth: false,
        noise: false,
        informationElements: false,
      },
    });
    expect(payload.providers.find((item) => item.id === 'macos-scancore')?.available).toBe(false);
    expect(payload.providers.find((item) => item.id === 'demo')?.available).toBe(true);
  });

  it('falls back to demo on unsupported platforms', () => {
    const payload = providersPayload('aix', {});

    expect(payload.autoProvider).toBe('demo');
    expect(payload.demo).toBe(true);
    expect(payload.macosHelper.env).toEqual({
      LV24_SCANCORE_PATH: false,
      LV24_RESOURCES_PATH: false,
    });
  });
});
