import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn<(...args: unknown[]) => unknown>() },
  shell: { openExternal: vi.fn<(...args: unknown[]) => Promise<void>>() },
}));

import { bootDemoModeFromArgv } from './registerIpc';

describe('bootDemoModeFromArgv', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env.WIFI_EXPLORER_DEMO;

  beforeEach(() => {
    process.argv = ['electron', '.'];
    delete process.env.WIFI_EXPLORER_DEMO;
  });

  afterEach(() => {
    process.argv = originalArgv;
    if (originalEnv === undefined) delete process.env.WIFI_EXPLORER_DEMO;
    else process.env.WIFI_EXPLORER_DEMO = originalEnv;
  });

  it('is live by default', () => {
    expect(bootDemoModeFromArgv()).toBe(false);
  });

  it('opts into demo with --demo', () => {
    process.argv = ['electron', '.', '--demo'];
    expect(bootDemoModeFromArgv()).toBe(true);
  });

  it('opts into demo with the environment flag', () => {
    process.env.WIFI_EXPLORER_DEMO = '1';
    expect(bootDemoModeFromArgv()).toBe(true);
  });

  it('ignores the legacy --live flag (live is already default)', () => {
    process.argv = ['electron', '.', '--live'];
    expect(bootDemoModeFromArgv()).toBe(false);
  });
});
