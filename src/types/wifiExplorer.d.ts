import type { MenuIpcAction } from '@/shared/ipc/menuIpc';
import type {
  PermissionsStatusIpcPayload,
  ScanSnapshotIpcPayload,
} from '@/shared/ipc/scanIpc';

export interface WifiExplorerBridge {
  scanStart: () => Promise<{ ok: boolean; error?: string }>;
  scanStop: () => Promise<{ ok: boolean }>;
  scanSetIntervalMs: (ms: number) => Promise<{ ok: boolean; intervalMs: number }>;
  permissionsQuery: () => Promise<PermissionsStatusIpcPayload>;
  permissionsOpenSettings: () => Promise<{ ok: boolean }>;
  demoEnable: () => Promise<{ ok: boolean; demoMode: boolean }>;
  onScanSnapshot: (listener: (payload: ScanSnapshotIpcPayload) => void) => () => void;
  onPermissionsStatus: (listener: (payload: PermissionsStatusIpcPayload) => void) => () => void;
  onMenuAction: (listener: (action: MenuIpcAction) => void) => () => void;
}

declare global {
  interface Window {
    wifiExplorer: WifiExplorerBridge;
  }
}

export {};
