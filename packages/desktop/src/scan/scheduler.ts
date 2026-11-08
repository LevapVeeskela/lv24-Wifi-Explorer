import * as path from 'node:path';
import type { BrowserWindow } from 'electron';
import { createScanProvider, type ScanProvider } from '@lv24/wifi-backend';
import { buildDemoSnapshotPayload } from './demoFallback';
import { MIN_SCAN_INTERVAL_MS, SCAN_IPC_EVENTS } from './ipcChannels';
import { ensureSnapshotNetworks } from './snapshotNormalize';

export interface ScanRuntimeState {
  running: boolean;
  intervalMs: number;
  demoMode: boolean;
  helperMissing: boolean;
  /** Non-null when the UI is showing fixture data because live scan failed. */
  fallbackReason: string | null;
  restartAttempts: number;
  directedSsid: string | null;
  timer: ReturnType<typeof setInterval> | null;
  provider: ScanProvider | null;
}

export function createInitialScanState(demoMode: boolean): ScanRuntimeState {
  return {
    running: false,
    intervalMs: 5000,
    demoMode,
    helperMissing: false,
    fallbackReason: null,
    restartAttempts: 0,
    directedSsid: null,
    timer: null,
    provider: null,
  };
}

function emitSnapshot(win: BrowserWindow | null, payload: Record<string, unknown>): void {
  win?.webContents.send(SCAN_IPC_EVENTS.scanSnapshot, payload);
}

function emitPermissions(
  win: BrowserWindow | null,
  demoMode: boolean,
  location: string = demoMode ? 'restricted' : 'not-determined'
): void {
  win?.webContents.send(SCAN_IPC_EVENTS.permissionsStatus, { location, demoMode });
}

function emitHelperStatus(win: BrowserWindow | null, payload: Record<string, unknown>): void {
  win?.webContents.send(SCAN_IPC_EVENTS.helperStatus, payload);
}

function emitFixtureTick(win: BrowserWindow | null): void {
  emitSnapshot(win, buildDemoSnapshotPayload());
}

function packagedScanCorePath(): string | undefined {
  if (process.platform !== 'darwin' || !process.resourcesPath) return undefined;
  return path.join(process.resourcesPath, 'ScanCore.app', 'Contents', 'MacOS', 'ScanCore');
}

export function stopScanTimer(state: ScanRuntimeState): void {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  const provider = state.provider;
  state.provider = null;
  if (provider) void provider.stop();
  state.running = false;
  state.restartAttempts = 0;
}

function startFixtureLoop(
  state: ScanRuntimeState,
  getWindow: () => BrowserWindow | null,
  reason: 'demo' | 'fallback' | null
): { ok: true } {
  state.running = true;
  state.demoMode = true;
  state.fallbackReason = reason === 'fallback' ? state.fallbackReason : null;
  emitFixtureTick(getWindow());
  state.timer = setInterval(
    () => emitFixtureTick(getWindow()),
    Math.max(MIN_SCAN_INTERVAL_MS, state.intervalMs)
  );
  emitPermissions(getWindow(), true);
  emitHelperStatus(getWindow(), {
    state: reason === 'fallback' ? 'fallback' : 'demo',
    reason: state.fallbackReason,
  });
  return { ok: true };
}

function startFallback(
  state: ScanRuntimeState,
  getWindow: () => BrowserWindow | null,
  reason: string
): { ok: true } {
  state.helperMissing = true;
  state.fallbackReason = reason;
  return startFixtureLoop(state, getWindow, 'fallback');
}

function scheduleRetry(state: ScanRuntimeState, getWindow: () => BrowserWindow | null): boolean {
  if (state.restartAttempts >= 2) return false;
  state.restartAttempts += 1;
  state.running = false;
  const timer = setTimeout(() => {
    if (!state.running) {
      startScanLoop(state, getWindow);
    }
  }, 800);
  timer.unref?.();
  return true;
}

function handleLiveFailure(
  state: ScanRuntimeState,
  getWindow: () => BrowserWindow | null,
  reason: string
): void {
  stopScanTimer(state);
  if (scheduleRetry(state, getWindow)) return;
  startFallback(state, getWindow, reason);
}

export function startScanLoop(
  state: ScanRuntimeState,
  getWindow: () => BrowserWindow | null
): { ok: true } | { ok: false; error: string } {
  if (state.running) {
    return { ok: true };
  }

  // Explicit demo mode is user-requested; fallback is retried on next manual start.
  if (state.demoMode && state.fallbackReason === null) {
    return startFixtureLoop(state, getWindow, 'demo');
  }

  state.demoMode = false;
  state.fallbackReason = null;
  state.helperMissing = false;

  const provider = createScanProvider({
    provider: 'auto',
    binaryPath: packagedScanCorePath(),
  });

  provider.onEvent((event) => {
    if (state.provider !== provider) return;
    if (event.type === 'snapshot') {
      const normalized = ensureSnapshotNetworks(
        event.payload as unknown as Record<string, unknown>
      );
      const demo = event.payload.demo || normalized.demo === true;
      emitSnapshot(getWindow(), {
        ...normalized,
        capturedAt: event.payload.capturedAt,
        location: event.payload.location,
        interfaceName: event.payload.interfaceName,
        networks: event.payload.networks,
        demo,
        source: demo ? 'fixtures' : event.payload.source,
      });
      return;
    }
    if (event.type === 'permissions') {
      emitPermissions(getWindow(), event.demo, event.location);
      return;
    }
    if (event.type === 'status') {
      emitHelperStatus(getWindow(), {
        state: event.running ? 'running' : 'stopped',
        scanning: event.scanning,
        helper: event.helper,
      });
      return;
    }
    if (event.type === 'error') {
      emitHelperStatus(getWindow(), {
        state: 'error',
        code: event.error.code,
        message: event.error.message,
      });
      if (event.error.demoFallback === true || !event.error.recoverable) {
        stopScanTimer(state);
        startFallback(state, getWindow, event.error.code);
      }
    }
  });

  state.provider = provider;
  state.running = true;
  emitPermissions(getWindow(), false, 'not-determined');

  void provider
    .start({
      intervalMs: state.intervalMs,
      includeHidden: true,
      binaryPath: packagedScanCorePath(),
      directedSsid: state.directedSsid ?? undefined,
    })
    .catch((error: unknown) => {
      handleLiveFailure(
        state,
        getWindow,
        error instanceof Error ? error.message : 'provider-start-failed'
      );
    });

  return { ok: true };
}

export function setDemoMode(state: ScanRuntimeState, enabled: boolean): void {
  state.demoMode = enabled;
  if (enabled) state.fallbackReason = null;
}

export function setScanInterval(state: ScanRuntimeState, intervalMs: number): void {
  const finite = Number.isFinite(intervalMs) ? intervalMs : state.intervalMs;
  state.intervalMs = Math.min(60_000, Math.max(MIN_SCAN_INTERVAL_MS, Math.floor(finite)));
  state.provider?.setIntervalMs?.(state.intervalMs);
}
