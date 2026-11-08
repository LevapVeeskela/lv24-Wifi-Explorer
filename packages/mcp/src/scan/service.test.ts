// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  createScanProvider,
  type ScanProvider,
  type ScanProviderOptions,
} from '@lv24/wifi-backend';
import { ScanService, type ScanServiceDeps } from './service.js';

function createCountingService(): { service: ScanService; created: () => number } {
  let created = 0;
  const deps: ScanServiceDeps = {
    createProvider: (options) => {
      created += 1;
      return createScanProvider(options);
    },
  };
  return { service: new ScanService(deps), created: () => created };
}

/** Provider that only emits a snapshot after `delayMs`, tracking overlap. */
function createSlowProvider(state: { active: number; maxActive: number }, delayMs = 5) {
  let listeners: Array<(event: never) => void> = [];
  const provider: ScanProvider = {
    id: 'demo',
    platform: 'darwin',
    start: async (options: ScanProviderOptions) => {
      state.active += 1;
      state.maxActive = Math.max(state.maxActive, state.active);
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      for (const listener of listeners) {
        (listener as (event: unknown) => void)({
          type: 'snapshot',
          payload: {
            capturedAt: new Date().toISOString(),
            interfaceName: 'test0',
            location: 'granted',
            networks: [],
            associated: null,
            includeHiddenRequested: options.includeHidden,
            source: 'fixtures',
            demo: true,
          },
        });
      }
      state.active -= 1;
    },
    stop: async () => undefined,
    onEvent: (listener) => {
      listeners = [...listeners, listener as (event: never) => void];
      return () => {
        listeners = listeners.filter((item) => item !== (listener as (event: never) => void));
      };
    },
  };
  return provider;
}

describe('ScanService (demo provider)', () => {
  it('returns the three demo networks with mapped compact data', async () => {
    const { service } = createCountingService();
    const snapshot = await service.scan({ provider: 'demo' });

    expect(snapshot.provider).toBe('demo');
    expect(snapshot.source).toBe('fixtures');
    expect(snapshot.demo).toBe(true);
    expect(snapshot.location).toBe('granted');
    expect(snapshot.rows).toHaveLength(3);
    expect(snapshot.rows.map((row) => row.identity.ssid.status)).toEqual([
      'available',
      'available',
      'available',
    ]);
    expect(snapshot.rows[0]?.signal.rssiDbm).toBe(-48);
    expect(
      snapshot.rows[2]?.identity.ssid.status === 'available' &&
        snapshot.rows[2].identity.ssid.value.hidden
    ).toBe(true);
  });

  it('reuses the cached snapshot without starting another provider', async () => {
    const { service, created } = createCountingService();
    const first = await service.scan({ provider: 'demo' });

    const cached = await service.getSnapshot();

    expect(cached).toBe(first);
    expect(created()).toBe(1);
  });

  it('refresh triggers a new scan and reuses the previous provider', async () => {
    const { service, created } = createCountingService();
    const first = await service.scan({ provider: 'demo' });

    const refreshed = await service.getSnapshot({ refresh: true });

    expect(refreshed).not.toBe(first);
    expect(created()).toBe(2);
    expect(refreshed.provider).toBe('demo');
    expect(refreshed.rows).toHaveLength(3);
  });

  it('serializes concurrent scans (never two providers at once)', async () => {
    const state = { active: 0, maxActive: 0 };
    const service = new ScanService({
      createProvider: () => createSlowProvider(state),
    });

    await Promise.all([
      service.scan({ provider: 'demo' }),
      service.scan({ provider: 'demo' }),
      service.scan({ provider: 'demo' }),
    ]);

    expect(state.maxActive).toBe(1);
  });

  it('fails with a typed message when the provider reports an unrecoverable error', async () => {
    const service = new ScanService({
      createProvider: () => ({
        id: 'demo',
        platform: 'darwin',
        start: async () => undefined,
        stop: async () => undefined,
        onEvent: (listener) => {
          listener({
            type: 'error',
            error: {
              code: 'HELPER_MISSING',
              message: 'ScanCore helper not found.',
              recoverable: false,
            },
          });
          return () => undefined;
        },
      }),
    });

    await expect(service.scan({ provider: 'demo' })).rejects.toThrow(/ScanCore helper not found/);
  });
});
