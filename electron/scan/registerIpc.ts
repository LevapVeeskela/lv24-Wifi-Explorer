/**
 * Scan IPC registration for Electron main.
 *
 * Wire in electron/main.ts (keep window/CSP elsewhere):
 *
 * ```ts
 * import { app, BrowserWindow } from 'electron';
 * import {
 *   bootDemoModeFromArgv,
 *   createInitialScanState,
 *   registerScanIpc,
 *   stopScanTimer,
 *   type ScanRuntimeState,
 * } from './scan/registerIpc';
 *
 * let mainWindow: BrowserWindow | null = null;
 * let scanState: ScanRuntimeState = createInitialScanState(bootDemoModeFromArgv());
 *
 * app.whenReady().then(() => {
 *   registerScanIpc({
 *     getMainWindow: () => mainWindow,
 *     getState: () => scanState,
 *   });
 * });
 *
 * app.on('before-quit', () => stopScanTimer(scanState));
 * ```
 */

import type { BrowserWindow } from 'electron';
import { ipcMain, shell } from 'electron';
import {
  MACOS_LOCATION_SETTINGS_URL,
  MIN_SCAN_INTERVAL_MS,
  SCAN_IPC_CHANNELS,
  SCAN_IPC_EVENTS,
} from './ipcChannels';
import {
  createInitialScanState,
  setDemoMode,
  setScanInterval,
  startScanLoop,
  stopScanTimer,
  type ScanRuntimeState,
} from './scheduler';

/** Scaffold defaults to demo until ScanCore + Location are wired. Pass `--live` to opt out. */
export function bootDemoModeFromArgv(): boolean {
  if (process.argv.includes('--live')) return false;
  if (process.env.WIFI_EXPLORER_DEMO === '0') return false;
  return true;
}

export {
  createInitialScanState,
  setDemoMode,
  setScanInterval,
  startScanLoop,
  stopScanTimer,
  type ScanRuntimeState,
};

export interface RegisterScanIpcOptions {
  getMainWindow: () => BrowserWindow | null;
  getState: () => ScanRuntimeState;
}

export function registerScanIpc(options: RegisterScanIpcOptions): void {
  ipcMain.handle(SCAN_IPC_CHANNELS.scanStart, () =>
    startScanLoop(options.getState(), options.getMainWindow),
  );

  ipcMain.handle(SCAN_IPC_CHANNELS.scanStop, () => {
    stopScanTimer(options.getState());
    return { ok: true };
  });

  ipcMain.handle(SCAN_IPC_CHANNELS.scanSetIntervalMs, (_event, payload: unknown) => {
    const state = options.getState();
    const ms =
      typeof payload === 'object' &&
      payload !== null &&
      typeof (payload as { ms?: unknown }).ms === 'number'
        ? Math.max(MIN_SCAN_INTERVAL_MS, Math.floor((payload as { ms: number }).ms))
        : state.intervalMs;
    setScanInterval(state, ms);
    if (state.running && !state.helper) {
      stopScanTimer(state);
      startScanLoop(state, options.getMainWindow);
    }
    return { ok: true, intervalMs: state.intervalMs };
  });

  ipcMain.handle(SCAN_IPC_CHANNELS.permissionsQuery, () => {
    const state = options.getState();
    if (state.helper && !state.demoMode) {
      state.helper.send({ type: 'permissions:query' });
    }
    return {
      location: state.demoMode ? 'restricted' : 'unknown',
      demoMode: state.demoMode,
    };
  });

  ipcMain.handle(SCAN_IPC_CHANNELS.permissionsOpenSettings, () => {
    if (process.platform === 'darwin') {
      void shell.openExternal(MACOS_LOCATION_SETTINGS_URL);
    }
    return { ok: true };
  });

  ipcMain.handle(SCAN_IPC_CHANNELS.demoEnable, () => {
    const state = options.getState();
    setDemoMode(state, true);
    if (state.helper) {
      state.helper.send({ type: 'demo:enable', enabled: true });
    }
    options.getMainWindow()?.webContents.send(SCAN_IPC_EVENTS.permissionsStatus, {
      location: 'restricted',
      demoMode: true,
    });
    return { ok: true, demoMode: true };
  });
}

export function emitBootDemoPermissions(getMainWindow: () => BrowserWindow | null): void {
  const win = getMainWindow();
  if (!win) return;
  win.webContents.once('did-finish-load', () => {
    getMainWindow()?.webContents.send(SCAN_IPC_EVENTS.permissionsStatus, {
      location: 'restricted',
      demoMode: true,
    });
  });
}
