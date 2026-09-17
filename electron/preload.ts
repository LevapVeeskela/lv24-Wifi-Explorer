import { contextBridge, ipcRenderer } from 'electron';

export interface WifiExplorerBridge {
  scanStart: () => Promise<{ ok: boolean; error?: string }>;
  scanStop: () => Promise<{ ok: boolean }>;
  scanSetIntervalMs: (ms: number) => Promise<{ ok: boolean; intervalMs: number }>;
  permissionsQuery: () => Promise<{ location: string; demoMode: boolean }>;
  permissionsOpenSettings: () => Promise<{ ok: boolean }>;
  demoEnable: () => Promise<{ ok: boolean; demoMode: boolean }>;
  onScanSnapshot: (listener: (payload: Record<string, unknown>) => void) => () => void;
  onPermissionsStatus: (
    listener: (payload: { location: string; demoMode: boolean }) => void
  ) => () => void;
}

const wifiExplorer: WifiExplorerBridge = {
  scanStart: () => ipcRenderer.invoke('scan:start'),
  scanStop: () => ipcRenderer.invoke('scan:stop'),
  scanSetIntervalMs: (ms: number) => ipcRenderer.invoke('scan:setIntervalMs', { ms }),
  permissionsQuery: () => ipcRenderer.invoke('permissions:query'),
  permissionsOpenSettings: () => ipcRenderer.invoke('permissions:openSettings'),
  demoEnable: () => ipcRenderer.invoke('demo:enable'),
  onScanSnapshot: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: Record<string, unknown>) => {
      listener(payload);
    };
    ipcRenderer.on('scan:snapshot', handler);
    return () => ipcRenderer.removeListener('scan:snapshot', handler);
  },
  onPermissionsStatus: (listener) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { location: string; demoMode: boolean }
    ) => {
      listener(payload);
    };
    ipcRenderer.on('permissions:status', handler);
    return () => ipcRenderer.removeListener('permissions:status', handler);
  },
};

contextBridge.exposeInMainWorld('wifiExplorer', wifiExplorer);
