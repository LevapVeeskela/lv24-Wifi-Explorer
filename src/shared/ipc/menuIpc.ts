/** Native app menu → renderer (main `ipcMain` send). Keep in sync with `electron/menu.ts`. */

export const MENU_IPC_EVENTS = {
  openSnapshot: 'menu:openSnapshot',
  saveSnapshot: 'menu:saveSnapshot',
  exportCsv: 'menu:exportCsv',
  about: 'menu:about',
} as const;

export type MenuCsvExportScope = 'visible' | 'selected' | 'all';

export type MenuIpcAction =
  | { type: 'openSnapshot' }
  | { type: 'saveSnapshot' }
  | { type: 'exportCsv'; scope: MenuCsvExportScope }
  | { type: 'about' };
