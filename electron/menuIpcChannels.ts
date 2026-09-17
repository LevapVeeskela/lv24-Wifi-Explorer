/** Keep in sync with src/shared/ipc/menuIpc.ts (main tsconfig root is electron/ only). */

export const MENU_IPC_EVENTS = {
  openSnapshot: 'menu:openSnapshot',
  saveSnapshot: 'menu:saveSnapshot',
  exportCsv: 'menu:exportCsv',
  about: 'menu:about',
} as const;

export type MenuCsvExportScope = 'visible' | 'selected' | 'all';
