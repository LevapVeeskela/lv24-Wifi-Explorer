import type { MenuIpcAction } from '@/shared/ipc/menuIpc';

export interface WifiExplorerBridge {
  scanStart: (directedSsid?: string) => Promise<{ ok: boolean; error?: string }>;
  scanStop: () => Promise<{ ok: boolean }>;
  scanSetIntervalMs: (ms: number) => Promise<{ ok: boolean; intervalMs: number }>;
  permissionsQuery: () => Promise<{ location: string; demoMode: boolean }>;
  permissionsOpenSettings: () => Promise<{ ok: boolean }>;
  demoEnable: () => Promise<{ ok: boolean; demoMode: boolean }>;
  saveFile?: (request: Record<string, unknown>) => Promise<Record<string, unknown>>;
  openFile?: (request: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onScanSnapshot: (listener: (payload: Record<string, unknown>) => void) => () => void;
  onPermissionsStatus: (
    listener: (payload: { location: string; demoMode: boolean }) => void
  ) => () => void;
  onMenuAction: (listener: (action: MenuIpcAction) => void) => () => void;
  onHelperStatus?: (listener: (payload: Record<string, unknown>) => void) => () => void;
}

declare global {
  interface Window {
    wifiExplorer?: WifiExplorerBridge;
  }
}
