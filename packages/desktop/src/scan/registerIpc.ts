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

import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';
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

/** Demo is opt-in: `--demo` or `WIFI_EXPLORER_DEMO=1`. Live scan is the default. */
export function bootDemoModeFromArgv(): boolean {
  if (process.argv.includes('--demo')) return true;
  if (process.env.WIFI_EXPLORER_DEMO === '1') return true;
  return false;
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
  /** Only renderer frames from this URL scheme/origin may call privileged IPC. */
  isTrustedSender?: (url: string) => boolean;
}

function defaultTrustedSender(url: string): boolean {
  return url.startsWith('file://');
}

function senderIsTrusted(event: IpcMainInvokeEvent, isTrusted: (url: string) => boolean): boolean {
  const url = event.senderFrame?.url ?? '';
  return url.length > 0 && isTrusted(url);
}

export function registerScanIpc(options: RegisterScanIpcOptions): void {
  const isTrusted = options.isTrustedSender ?? defaultTrustedSender;
  const guard = (event: IpcMainInvokeEvent): boolean => senderIsTrusted(event, isTrusted);

  ipcMain.handle(SCAN_IPC_CHANNELS.scanStart, (event, payload: unknown) => {
    if (!guard(event)) return { ok: false, error: 'untrusted-sender' };
    const state = options.getState();
    if (typeof payload === 'object' && payload !== null) {
      const raw = (payload as { directedSsid?: unknown }).directedSsid;
      state.directedSsid = typeof raw === 'string' && raw.trim() ? raw.trim() : null;
    }
    return startScanLoop(state, options.getMainWindow);
  });

  ipcMain.handle(SCAN_IPC_CHANNELS.scanStop, (event) => {
    if (!guard(event)) return { ok: false, error: 'untrusted-sender' };
    stopScanTimer(options.getState());
    return { ok: true };
  });

  ipcMain.handle(SCAN_IPC_CHANNELS.scanSetIntervalMs, (event, payload: unknown) => {
    if (!guard(event)) return { ok: false, error: 'untrusted-sender' };
    const state = options.getState();
    const rawMs =
      typeof payload === 'object' &&
      payload !== null &&
      typeof (payload as { ms?: unknown }).ms === 'number'
        ? (payload as { ms: number }).ms
        : state.intervalMs;
    const finiteMs = Number.isFinite(rawMs) ? rawMs : state.intervalMs;
    const ms = Math.min(60_000, Math.max(MIN_SCAN_INTERVAL_MS, Math.floor(finiteMs)));
    setScanInterval(state, ms);
    if (state.running && !state.provider) {
      stopScanTimer(state);
      startScanLoop(state, options.getMainWindow);
    }
    return { ok: true, intervalMs: state.intervalMs };
  });

  ipcMain.handle(SCAN_IPC_CHANNELS.permissionsQuery, (event) => {
    if (!guard(event)) return { ok: false, error: 'untrusted-sender' };
    const state = options.getState();
    if (state.provider && !state.demoMode) {
      state.provider.requestPermissions?.();
    }
    return {
      location: state.demoMode ? 'restricted' : 'not-determined',
      demoMode: state.demoMode,
    };
  });

  ipcMain.handle(SCAN_IPC_CHANNELS.permissionsOpenSettings, (event) => {
    if (!guard(event)) return { ok: false, error: 'untrusted-sender' };
    if (process.platform === 'darwin') {
      void shell.openExternal(MACOS_LOCATION_SETTINGS_URL);
    }
    return { ok: true };
  });

  ipcMain.handle(SCAN_IPC_CHANNELS.demoEnable, (event) => {
    if (!guard(event)) return { ok: false, error: 'untrusted-sender' };
    const state = options.getState();
    stopScanTimer(state);
    setDemoMode(state, true);
    startScanLoop(state, options.getMainWindow);
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
