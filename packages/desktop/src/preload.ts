import { contextBridge, ipcRenderer } from 'electron';

/** Inlined IPC channel names: sandboxed preloads cannot require relative modules. */
const MENU_IPC_EVENTS = {
  openSnapshot: 'menu:openSnapshot',
  importPcap: 'menu:importPcap',
  saveSnapshot: 'menu:saveSnapshot',
  exportCsv: 'menu:exportCsv',
  printVisible: 'menu:printVisible',
  openSettings: 'menu:openSettings',
  about: 'menu:about',
} as const;

type MenuCsvExportScope = 'visible' | 'selected' | 'all';

export type MenuIpcAction =
  | { type: 'openSnapshot' }
  | { type: 'importPcap' }
  | { type: 'saveSnapshot' }
  | { type: 'exportCsv'; scope: MenuCsvExportScope }
  | { type: 'printVisible' }
  | { type: 'openSettings' }
  | { type: 'about' };

export interface WifiExplorerBridge {
  scanStart: (directedSsid?: string) => Promise<{ ok: boolean; error?: string }>;
  scanStop: () => Promise<{ ok: boolean }>;
  scanSetIntervalMs: (ms: number) => Promise<{ ok: boolean; intervalMs: number }>;
  permissionsQuery: () => Promise<{ location: string; demoMode: boolean }>;
  permissionsOpenSettings: () => Promise<{ ok: boolean }>;
  demoEnable: () => Promise<{ ok: boolean; demoMode: boolean }>;
  saveFile: (request: Record<string, unknown>) => Promise<Record<string, unknown>>;
  openFile: (request: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onScanSnapshot: (listener: (payload: Record<string, unknown>) => void) => () => void;
  onPermissionsStatus: (
    listener: (payload: { location: string; demoMode: boolean }) => void
  ) => () => void;
  onHelperStatus: (listener: (payload: Record<string, unknown>) => void) => () => void;
  onMenuAction: (listener: (action: MenuIpcAction) => void) => () => void;
}

const wifiExplorer: WifiExplorerBridge = {
  scanStart: (directedSsid?: string) => ipcRenderer.invoke('scan:start', { directedSsid }),
  scanStop: () => ipcRenderer.invoke('scan:stop'),
  scanSetIntervalMs: (ms: number) => ipcRenderer.invoke('scan:setIntervalMs', { ms }),
  permissionsQuery: () => ipcRenderer.invoke('permissions:query'),
  permissionsOpenSettings: () => ipcRenderer.invoke('permissions:openSettings'),
  demoEnable: () => ipcRenderer.invoke('demo:enable'),
  saveFile: (request) => ipcRenderer.invoke('file:save', request),
  openFile: (request) => ipcRenderer.invoke('file:open', request),
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
  onHelperStatus: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: Record<string, unknown>) => {
      listener(payload);
    };
    ipcRenderer.on('helper:status', handler);
    return () => ipcRenderer.removeListener('helper:status', handler);
  },
  onMenuAction: (listener) => {
    const onOpenSnapshot = () => listener({ type: 'openSnapshot' });
    const onImportPcap = () => listener({ type: 'importPcap' });
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
    ipcRenderer.on(MENU_IPC_EVENTS.importPcap, onImportPcap);
    ipcRenderer.on(MENU_IPC_EVENTS.saveSnapshot, onSaveSnapshot);
    ipcRenderer.on(MENU_IPC_EVENTS.exportCsv, onExportCsv);
    ipcRenderer.on(MENU_IPC_EVENTS.printVisible, onPrintVisible);
    ipcRenderer.on(MENU_IPC_EVENTS.openSettings, onOpenSettings);
    ipcRenderer.on(MENU_IPC_EVENTS.about, onAbout);

    return () => {
      ipcRenderer.removeListener(MENU_IPC_EVENTS.openSnapshot, onOpenSnapshot);
      ipcRenderer.removeListener(MENU_IPC_EVENTS.importPcap, onImportPcap);
      ipcRenderer.removeListener(MENU_IPC_EVENTS.saveSnapshot, onSaveSnapshot);
      ipcRenderer.removeListener(MENU_IPC_EVENTS.exportCsv, onExportCsv);
      ipcRenderer.removeListener(MENU_IPC_EVENTS.printVisible, onPrintVisible);
      ipcRenderer.removeListener(MENU_IPC_EVENTS.openSettings, onOpenSettings);
      ipcRenderer.removeListener(MENU_IPC_EVENTS.about, onAbout);
    };
  },
};

contextBridge.exposeInMainWorld('wifiExplorer', wifiExplorer);
