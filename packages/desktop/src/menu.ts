/**
 * Native application menu (macOS / Electron).
 *
 * Renderer listens on these **one-way** IPC events (main → renderer):
 *
 * | Channel              | Payload                          |
 * |----------------------|----------------------------------|
 * | `menu:openSnapshot`  | —                                |
 * | `menu:saveSnapshot`  | —                                |
 * | `menu:exportCsv`     | `{ scope: 'visible' \| 'selected' \| 'all' }` |
 * | `menu:printVisible`  | —                                |
 * | `menu:openSettings`  | —                                |
 * | `menu:about`         | —                                |
 *
 * Scan start/stop run in the main process (same as `scan:start` / `scan:stop` handlers).
 */

import { Menu, app, type BrowserWindow, type MenuItemConstructorOptions } from 'electron';

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

export interface ApplicationMenuDeps {
  getMainWindow: () => BrowserWindow | null;
  productTitle: string;
  appVersion: string;
  onScanStart: () => void;
  onScanStop: () => void;
}

function sendToRenderer(
  getMainWindow: () => BrowserWindow | null,
  channel: string,
  payload?: unknown
): void {
  const win = getMainWindow();
  if (!win || win.isDestroyed()) return;
  if (payload !== undefined) {
    win.webContents.send(channel, payload);
  } else {
    win.webContents.send(channel);
  }
}

function buildTemplate(deps: ApplicationMenuDeps): MenuItemConstructorOptions[] {
  const isMac = process.platform === 'darwin';
  const { getMainWindow, productTitle, appVersion, onScanStart, onScanStop } = deps;

  const fileSubmenu: MenuItemConstructorOptions[] = [
    {
      label: 'Import Capture (pcap/pcapng)…',
      click: () => sendToRenderer(getMainWindow, MENU_IPC_EVENTS.importPcap),
    },
    {
      label: 'Open Snapshot…',
      accelerator: 'CmdOrCtrl+O',
      click: () => sendToRenderer(getMainWindow, MENU_IPC_EVENTS.openSnapshot),
    },
    {
      label: 'Save Snapshot…',
      accelerator: 'CmdOrCtrl+S',
      click: () => sendToRenderer(getMainWindow, MENU_IPC_EVENTS.saveSnapshot),
    },
    { type: 'separator' },
    {
      label: 'Export CSV',
      submenu: [
        {
          label: 'Visible Rows',
          click: () =>
            sendToRenderer(getMainWindow, MENU_IPC_EVENTS.exportCsv, {
              scope: 'visible' satisfies MenuCsvExportScope,
            }),
        },
        {
          label: 'Selected Row',
          click: () =>
            sendToRenderer(getMainWindow, MENU_IPC_EVENTS.exportCsv, {
              scope: 'selected' satisfies MenuCsvExportScope,
            }),
        },
        {
          label: 'All Rows',
          click: () =>
            sendToRenderer(getMainWindow, MENU_IPC_EVENTS.exportCsv, {
              scope: 'all' satisfies MenuCsvExportScope,
            }),
        },
      ],
    },
    { type: 'separator' },
    {
      label: 'Print Visible Table…',
      accelerator: 'CmdOrCtrl+P',
      click: () => sendToRenderer(getMainWindow, MENU_IPC_EVENTS.printVisible),
    },
  ];

  if (isMac) {
    fileSubmenu.push({ type: 'separator' }, { role: 'close' });
  } else {
    fileSubmenu.push({ type: 'separator' }, { role: 'quit' });
  }

  const scanSubmenu: MenuItemConstructorOptions[] = [
    {
      label: 'Start Scan',
      accelerator: 'CmdOrCtrl+Shift+S',
      click: () => onScanStart(),
    },
    {
      label: 'Stop Scan',
      accelerator: 'CmdOrCtrl+Shift+T',
      click: () => onScanStop(),
    },
    { type: 'separator' },
    {
      label: 'Settings…',
      accelerator: 'CmdOrCtrl+,',
      click: () => sendToRenderer(getMainWindow, MENU_IPC_EVENTS.openSettings),
    },
  ];

  const helpSubmenu: MenuItemConstructorOptions[] = [
    {
      label: `About ${productTitle}`,
      click: () => sendToRenderer(getMainWindow, MENU_IPC_EVENTS.about),
    },
  ];

  if (!isMac) {
    helpSubmenu.unshift({
      label: `Version ${appVersion}`,
      enabled: false,
    });
  }

  const template: MenuItemConstructorOptions[] = [];

  if (isMac) {
    template.push({
      label: app.name,
      submenu: [
        {
          label: `About ${productTitle}`,
          click: () => sendToRenderer(getMainWindow, MENU_IPC_EVENTS.about),
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  template.push(
    { label: 'File', submenu: fileSubmenu },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    { label: 'Scan', submenu: scanSubmenu },
    { role: 'windowMenu' },
    { label: 'Help', submenu: helpSubmenu }
  );

  return template;
}

export function installApplicationMenu(deps: ApplicationMenuDeps): void {
  const menu = Menu.buildFromTemplate(buildTemplate(deps));
  Menu.setApplicationMenu(menu);
}
