import { contextBridge, ipcRenderer } from 'electron';
import { MENU_IPC_EVENTS, type MenuCsvExportScope } from './menuIpcChannels';

export type MenuIpcAction =
  | { type: 'openSnapshot' }
  | { type: 'saveSnapshot' }
  | { type: 'exportCsv'; scope: MenuCsvExportScope }
  | { type: 'printVisible' }
  | { type: 'openSettings' }
  | { type: 'about' };

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
  onMenuAction: (listener: (action: MenuIpcAction) => void) => () => void;
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
  onMenuAction: (listener) => {
    const onOpenSnapshot = () => listener({ type: 'openSnapshot' });
    const onSaveSnapshot = () => listener({ type: 'saveSnapshot' });
    const onOpenSettings = () => listener({ type: 'openSettings' });
    const onAbout = () => listener({ type: 'about' });
    const onPrintVisible = () => listener({ type: 'printVisible' });
    const onExportCsv = (
      _event: Electron.IpcRendererEvent,
      payload: { scope: MenuCsvExportScope }
    ) => {
      listener({ type: 'exportCsv', scope: payload.scope });
    };

    ipcRenderer.on(MENU_IPC_EVENTS.openSnapshot, onOpenSnapshot);
    ipcRenderer.on(MENU_IPC_EVENTS.saveSnapshot, onSaveSnapshot);
    ipcRenderer.on(MENU_IPC_EVENTS.exportCsv, onExportCsv);
    ipcRenderer.on(MENU_IPC_EVENTS.printVisible, onPrintVisible);
    ipcRenderer.on(MENU_IPC_EVENTS.openSettings, onOpenSettings);
    ipcRenderer.on(MENU_IPC_EVENTS.about, onAbout);

    return () => {
      ipcRenderer.removeListener(MENU_IPC_EVENTS.openSnapshot, onOpenSnapshot);
      ipcRenderer.removeListener(MENU_IPC_EVENTS.saveSnapshot, onSaveSnapshot);
      ipcRenderer.removeListener(MENU_IPC_EVENTS.exportCsv, onExportCsv);
      ipcRenderer.removeListener(MENU_IPC_EVENTS.printVisible, onPrintVisible);
      ipcRenderer.removeListener(MENU_IPC_EVENTS.openSettings, onOpenSettings);
      ipcRenderer.removeListener(MENU_IPC_EVENTS.about, onAbout);
    };
  },
};

contextBridge.exposeInMainWorld('wifiExplorer', wifiExplorer);
