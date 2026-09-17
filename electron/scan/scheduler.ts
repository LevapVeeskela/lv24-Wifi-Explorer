import type { BrowserWindow } from 'electron';
import { attachOuiByPrefix } from '../attachOui';
import { buildDemoSnapshotPayload } from './demoFallback';
import { MIN_SCAN_INTERVAL_MS, SCAN_IPC_EVENTS } from './ipcChannels';
import { startScanCoreProcess, type ScanCoreSession } from './scanCoreClient';
import { ensureSnapshotNetworks } from './snapshotNormalize';

export interface ScanRuntimeState {
  running: boolean;
  intervalMs: number;
  demoMode: boolean;
  helperMissing: boolean;
  timer: ReturnType<typeof setInterval> | null;
  helper: ScanCoreSession | null;
}

export function createInitialScanState(demoMode: boolean): ScanRuntimeState {
  return {
    running: false,
    intervalMs: 5000,
    demoMode,
    helperMissing: false,
    timer: null,
    helper: null,
  };
}

function emitSnapshot(win: BrowserWindow | null, payload: Record<string, unknown>): void {
  win?.webContents.send(SCAN_IPC_EVENTS.scanSnapshot, payload);
}

function emitPermissions(
  win: BrowserWindow | null,
  demoMode: boolean,
  location: string = demoMode ? 'restricted' : 'unknown',
): void {
  win?.webContents.send(SCAN_IPC_EVENTS.permissionsStatus, { location, demoMode });
}

function emitFixtureTick(win: BrowserWindow | null): void {
  emitSnapshot(win, buildDemoSnapshotPayload());
}

export function stopScanTimer(state: ScanRuntimeState): void {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  if (state.helper) {
    state.helper.stop();
    state.helper = null;
  }
  state.running = false;
}

function startFixtureLoop(
  state: ScanRuntimeState,
  getWindow: () => BrowserWindow | null,
): { ok: true } {
  state.running = true;
  state.demoMode = true;
  emitFixtureTick(getWindow());
  state.timer = setInterval(
    () => emitFixtureTick(getWindow()),
    Math.max(MIN_SCAN_INTERVAL_MS, state.intervalMs),
  );
  emitPermissions(getWindow(), true);
  return { ok: true };
}

export function startScanLoop(
  state: ScanRuntimeState,
  getWindow: () => BrowserWindow | null,
): { ok: true } | { ok: false; error: string } {
  if (state.running) {
    return { ok: true };
  }

  if (state.demoMode) {
    return startFixtureLoop(state, getWindow);
  }

  const helper = startScanCoreProcess({
    intervalMs: state.intervalMs,
    onLine: (line) => {
      const type = line.type;
      const payload =
        line.payload && typeof line.payload === 'object'
          ? (line.payload as Record<string, unknown>)
          : line;

      if (type === 'error' && payload.demoFallback === true) {
        stopScanTimer(state);
        void startFixtureLoop(state, getWindow);
        return;
      }

      if (type === 'permissions:status') {
        const location =
          typeof payload.location === 'string' ? payload.location : 'unknown';
        emitPermissions(getWindow(), false, location);
        return;
      }

      if (type === 'helper:status') {
        getWindow()?.webContents.send(SCAN_IPC_EVENTS.helperStatus, payload);
        return;
      }

      if (type === 'scan:snapshot') {
        const normalized = ensureSnapshotNetworks(payload);
        void attachOuiByPrefix(normalized.networks).then((ouiByPrefix) => {
          emitSnapshot(getWindow(), {
            ...normalized,
            demo: false,
            source: 'scancore',
            ouiByPrefix,
          });
        });
      }
    },
    onExit: () => {
      if (!state.running || state.demoMode) return;
      stopScanTimer(state);
      state.helperMissing = true;
      void startFixtureLoop(state, getWindow);
    },
    onError: () => {
      stopScanTimer(state);
      state.helperMissing = true;
      void startFixtureLoop(state, getWindow);
    },
  });

  if (!helper) {
    state.helperMissing = true;
    return startFixtureLoop(state, getWindow);
  }

  state.helper = helper;
  state.running = true;
  emitPermissions(getWindow(), false, 'not-determined');
  return { ok: true };
}

export function setDemoMode(state: ScanRuntimeState, enabled: boolean): void {
  state.demoMode = enabled;
}

export function setScanInterval(state: ScanRuntimeState, intervalMs: number): void {
  state.intervalMs = Math.max(MIN_SCAN_INTERVAL_MS, Math.floor(intervalMs));
  state.helper?.send({ type: 'scan:setIntervalMs', intervalMs: state.intervalMs });
}
