import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => process.cwd() },
}));

vi.mock('@lv24/wifi-backend', () => {
  let emit: ((event: unknown) => void) | null = null;
  return {
    createScanProvider: () => ({
      id: 'demo',
      platform: process.platform,
      onEvent: (listener: (event: unknown) => void) => {
        emit = listener;
        return () => {
          emit = null;
        };
      },
      start: async () => {
        emit?.({
          type: 'error',
          error: {
            code: 'HELPER_MISSING',
            message: 'missing',
            recoverable: true,
            demoFallback: true,
          },
        });
      },
      stop: async () => {},
    }),
  };
});

import { createInitialScanState, setScanInterval, startScanLoop, stopScanTimer } from './scheduler';

describe('scan scheduler', () => {
  it('starts live by default', () => {
    const state = createInitialScanState(false);
    expect(state.demoMode).toBe(false);
    expect(state.fallbackReason).toBeNull();
  });

  it('starts demo only when explicitly requested', () => {
    const state = createInitialScanState(true);
    const result = startScanLoop(state, () => null);
    expect(result.ok).toBe(true);
    stopScanTimer(state);
  });

  it('clamps interval to the 3s floor and 60s ceiling', () => {
    const state = createInitialScanState(false);
    setScanInterval(state, 1);
    expect(state.intervalMs).toBe(3000);
    setScanInterval(state, 120_000);
    expect(state.intervalMs).toBe(60_000);
  });

  it('falls back to fixtures with an explicit reason when the helper is missing', () => {
    const state = createInitialScanState(false);
    const result = startScanLoop(state, () => null);
    expect(result.ok).toBe(true);
    expect(state.demoMode).toBe(true);
    expect(state.helperMissing).toBe(true);
    expect(state.fallbackReason).toBe('HELPER_MISSING');
    stopScanTimer(state);
  });
});
