/** Native app menu → renderer (main `ipcMain` send). Keep in sync with `electron/menu.ts`. */

export const MENU_IPC_EVENTS = {
  openSnapshot: 'menu:openSnapshot',
  importPcap: 'menu:importPcap',
  saveSnapshot: 'menu:saveSnapshot',
  exportCsv: 'menu:exportCsv',
  printVisible: 'menu:printVisible',
  openSettings: 'menu:openSettings',
  about: 'menu:about',
} as const;

export type MenuCsvExportScope = 'visible' | 'selected' | 'all';

export type MenuIpcAction =
  | { type: 'openSnapshot' }
  | { type: 'importPcap' }
  | { type: 'saveSnapshot' }
  | { type: 'exportCsv'; scope: MenuCsvExportScope }
  | { type: 'printVisible' }
  | { type: 'openSettings' }
  | { type: 'about' };
