/**
 * ScanCore JSON Lines protocol v1 + Electron renderer ↔ main IPC.
 * Field names align with native/ScanCore/README.md and src/domain.
 */

import type { AssociatedLink, CoreWlanNetworkRecord } from '@/domain/bss';
import type { IsoTime, LocationAuthorization } from '@/domain/identity';

export const SCAN_CORE_PROTOCOL_VERSION = 1 as const;

/** ipcMain.handle / ipcRenderer.invoke channel names. */
export const SCAN_IPC_CHANNELS = {
  scanStart: 'scan:start',
  scanStop: 'scan:stop',
  scanSetIntervalMs: 'scan:setIntervalMs',
  permissionsQuery: 'permissions:query',
  permissionsOpenSettings: 'permissions:openSettings',
  demoEnable: 'demo:enable',
} as const;

/** ipcMain.send / ipcRenderer.on event names. */
export const SCAN_IPC_EVENTS = {
  scanSnapshot: 'scan:snapshot',
  permissionsStatus: 'permissions:status',
  helperStatus: 'helper:status',
} as const;

export type ScanErrorCode =
  | 'HELPER_UNAVAILABLE'
  | 'BSSID_UNAVAILABLE'
  | 'NO_INTERFACE'
  | 'WIFI_OFF'
  | 'SCAN_FAILED'
  | 'TIMEOUT'
  | 'LOCATION_DENIED'
  | 'LOCATION_RESTRICTED';

export interface ScanCoreErrorPayload {
  code: ScanErrorCode;
  message: string;
  recoverable: boolean;
  demoFallback?: boolean;
}

/** Wire snapshot from ScanCore (`scan:snapshot.payload`). */
export interface ScanCoreSnapshotPayload {
  capturedAt: IsoTime;
  interfaceName: string | null;
  location: LocationAuthorization;
  networks: CoreWlanNetworkRecord[];
  associated: AssociatedLink | null;
  includeHiddenRequested: boolean;
  stale?: boolean;
  scanDurationMs?: number;
  source?: 'scanForNetworks' | 'cachedScanResults' | 'associated-only';
  error?: ScanCoreErrorPayload | null;
}

export type ScanCoreInboundMessage =
  | { type: 'auth'; token: string }
  | { type: 'scan:start'; options?: { includeHidden?: boolean } }
  | { type: 'scan:stop' }
  | { type: 'scan:setIntervalMs'; intervalMs: number }
  | { type: 'permissions:query' }
  | { type: 'permissions:openSettings' }
  | { type: 'demo:enable'; enabled: boolean }
  | { type: 'shutdown' };

export type ScanCoreOutboundMessage =
  | {
      type: 'hello';
      protocolVersion: typeof SCAN_CORE_PROTOCOL_VERSION;
      version: string;
      helper: string;
      transport: string;
      path: string | null;
      port: number | null;
      tokenRequired: boolean;
      authToken?: string;
    }
  | {
      type: 'permissions:status';
      protocolVersion: typeof SCAN_CORE_PROTOCOL_VERSION;
      payload: { location: LocationAuthorization };
    }
  | {
      type: 'helper:status';
      protocolVersion: typeof SCAN_CORE_PROTOCOL_VERSION;
      payload: { running: boolean; version: string; scanning: boolean };
    }
  | {
      type: 'scan:snapshot';
      protocolVersion: typeof SCAN_CORE_PROTOCOL_VERSION;
      payload: ScanCoreSnapshotPayload;
    }
  | {
      type: 'error';
      protocolVersion: typeof SCAN_CORE_PROTOCOL_VERSION;
      payload: ScanCoreErrorPayload;
    };

/** Renderer → main invoke payloads. */
export type ScanIpcRequest =
  | { channel: typeof SCAN_IPC_CHANNELS.scanStart; body?: undefined }
  | { channel: typeof SCAN_IPC_CHANNELS.scanStop; body?: undefined }
  | { channel: typeof SCAN_IPC_CHANNELS.scanSetIntervalMs; body: { ms: number } }
  | { channel: typeof SCAN_IPC_CHANNELS.permissionsQuery; body?: undefined }
  | { channel: typeof SCAN_IPC_CHANNELS.permissionsOpenSettings; body?: undefined }
  | { channel: typeof SCAN_IPC_CHANNELS.demoEnable; body?: undefined };

export interface ScanSnapshotIpcPayload
  extends Omit<Partial<ScanCoreSnapshotPayload>, 'source'> {
  demo?: boolean;
  /** Electron transport origin (not ScanCore `source` field). */
  source?: 'scancore' | 'fixtures';
}

export interface PermissionsStatusIpcPayload {
  location: LocationAuthorization | 'unknown';
  demoMode: boolean;
}

export type ScanIpcEvent =
  | { type: typeof SCAN_IPC_EVENTS.scanSnapshot; payload: ScanSnapshotIpcPayload }
  | { type: typeof SCAN_IPC_EVENTS.permissionsStatus; payload: PermissionsStatusIpcPayload }
  | {
      type: typeof SCAN_IPC_EVENTS.helperStatus;
      payload: { running: boolean; version: string; scanning?: boolean };
    };

export type ScanStartResult = { ok: true } | { ok: false; error: string };

export const MIN_SCAN_INTERVAL_MS = 3000 as const;

export const MACOS_LOCATION_SETTINGS_URL =
  'x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices' as const;
