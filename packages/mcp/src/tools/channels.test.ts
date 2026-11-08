// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ScanService } from '../scan/service.js';
import { BEACON_ESTIMATE_NOTE, createWifiChannelsHandler, runWifiChannels } from './channels.js';

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

describe('runWifiChannels', () => {
  it('reports a channel row for every demo network', async () => {
    const service = createDemoService();
    await service.scan({ provider: 'demo' });
    const payload = await runWifiChannels(service);

    expect(payload).toMatchObject({
      source: 'fixtures',
      demo: true,
      estimate: true,
      note: BEACON_ESTIMATE_NOTE,
    });
    expect(payload.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    expect(payload.channels.map((row) => [row.band, row.channel])).toEqual([
      [2.4, 6],
      [5, 36],
      [5, 149],
    ]);
    expect(payload.channels.every((row) => row.estimate === true)).toBe(true);
    expect(payload.channels[1]).toMatchObject({
      band: 5,
      channel: 36,
      networks: 1,
      overlappingBss: 1,
      strongestRssiDbm: -48,
      averageRssiDbm: -48,
    });
    expect(payload.channels[1]?.beaconAirtimePct).toBeGreaterThanOrEqual(0);
    expect(payload.byBand.map((totals) => totals.band)).toEqual([2.4, 5]);
    expect(payload.overall).toMatchObject({ band: 'all', networkCount: 3 });
  });

  it('filters to one band and keeps estimate flags', async () => {
    const service = createDemoService();
    await service.scan({ provider: 'demo' });

    const five = await runWifiChannels(service, { band: '5' });
    expect(five.channels.map((row) => row.channel)).toEqual([36, 149]);
    expect(five.channels.every((row) => row.band === 5 && row.estimate === true)).toBe(true);
    expect(five.byBand.map((totals) => totals.band)).toEqual([5]);
    expect(five.overall.networkCount).toBe(2);

    const twoFour = await runWifiChannels(service, { band: '2.4' });
    expect(twoFour.channels.map((row) => row.channel)).toEqual([6]);

    const six = await runWifiChannels(service, { band: '6' });
    expect(six.channels).toEqual([]);
    expect(six.byBand).toEqual([]);
    expect(six.overall.networkCount).toBe(0);
  });

  it('can add zero-count channel-plan rows', async () => {
    const service = createDemoService();
    await service.scan({ provider: 'demo' });
    const payload = await runWifiChannels(service, { band: '5', includeEmpty: true });

    expect(payload.channels.length).toBe(28);
    expect(payload.channels.filter((row) => row.networks === 0)).toHaveLength(26);
    expect(payload.channels.every((row) => row.estimate === true)).toBe(true);
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

    const result = await createWifiChannelsHandler(service)({});

    expect(result.isError).toBe(true);
    expect(parse<{ error: string }>(result).error).toContain('ScanCore helper not found.');
  });
});
