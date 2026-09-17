import * as path from 'node:path';
import { app, BrowserWindow, session, shell } from 'electron';
import { WIFI_RENDERER_CSP } from './csp';
import {
  bootDemoModeFromArgv,
  createInitialScanState,
  emitBootDemoPermissions,
  registerScanIpc,
  stopScanTimer,
  type ScanRuntimeState,
} from './scan/registerIpc';
import { createMainWindowConfig } from './window';

const RENDERER_DEV_URL =
  process.env.WIFI_RENDERER_DEV_URL ?? 'http://localhost:5173';
const PRODUCT_TITLE = 'LV24 WiFi Explorer';

let mainWindow: BrowserWindow | null = null;
let scanState: ScanRuntimeState = createInitialScanState(bootDemoModeFromArgv());

function rendererDistDir(): string {
  return path.join(__dirname, '../dist');
}

function preloadPath(): string {
  return path.join(__dirname, 'preload.js');
}

function wireSessionCsp(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    headers['Content-Security-Policy'] = [WIFI_RENDERER_CSP];
    callback({ responseHeaders: headers });
  });
}

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow(
    createMainWindowConfig({ preloadPath: preloadPath(), title: PRODUCT_TITLE }),
  );

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  win.once('ready-to-show', () => win.show());

  if (app.isPackaged) {
    void win.loadFile(path.join(rendererDistDir(), 'index.html'));
  } else {
    void win.loadURL(RENDERER_DEV_URL);
  }

  return win;
}

app.whenReady().then(() => {
  wireSessionCsp();
  registerScanIpc({
    getMainWindow: () => mainWindow,
    getState: () => scanState,
  });
  mainWindow = createMainWindow();

  if (scanState.demoMode) {
    emitBootDemoPermissions(() => mainWindow);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopScanTimer(scanState);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopScanTimer(scanState);
});
