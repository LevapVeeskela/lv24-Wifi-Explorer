import { appendFileSync, mkdirSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, session, shell } from 'electron';
import { buildRendererCsp } from './csp';
import {
  bootDemoModeFromArgv,
  createInitialScanState,
  emitBootDemoPermissions,
  registerScanIpc,
  startScanLoop,
  stopScanTimer,
  type ScanRuntimeState,
} from './scan/registerIpc';
import { installApplicationMenu } from './menu';
import { registerFileIpc } from './fileIpc';
import { registerWifiToolsIpc } from './wifiToolsIpc';
import { UpdateService } from './updates/UpdateService';
import { registerUpdatesIpc } from './updates/updatesIpc';
import { createMainWindowConfig } from './window';

const RENDERER_DEV_URL = process.env.WIFI_RENDERER_DEV_URL ?? 'http://localhost:5173';
const PRODUCT_TITLE = 'LV24 WiFi Explorer';
const DEV_RENDERER_ORIGIN = new URL(RENDERER_DEV_URL).origin;

const EXTERNAL_PROTOCOLS = new Set(['https:', 'mailto:']);

function logCrash(kind: string, detail: unknown): void {
  const message = detail instanceof Error ? (detail.stack ?? detail.message) : String(detail);
  console.error(`[LV24] ${kind}`, message);
  try {
    const dir = app.getPath('userData');
    mkdirSync(dir, { recursive: true });
    appendFileSync(
      path.join(dir, 'crash.log'),
      `${new Date().toISOString()} ${kind} ${message}\n`,
      'utf8'
    );
  } catch {
    // never let logging crash the process
  }
}

process.on('uncaughtException', (error) => logCrash('uncaughtException', error));
process.on('unhandledRejection', (reason) => logCrash('unhandledRejection', reason));

let mainWindow: BrowserWindow | null = null;
let scanState: ScanRuntimeState = createInitialScanState(bootDemoModeFromArgv());
const updateService = new UpdateService(() => mainWindow);

function rendererDistDir(): string {
  return path.join(__dirname, '../dist');
}

function preloadPath(): string {
  return path.join(__dirname, 'preload.js');
}

function isTrustedRendererUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'file:') {
      if (!app.isPackaged) return true;
      const distDir = path.resolve(rendererDistDir());
      // `new URL(file:///C:/...).pathname` is `/C:/...`; on Windows
      // `path.resolve('/C:/...')` produces `C:\C:\...`, which never matches
      // the packaged asar path. `fileURLToPath` performs the platform-correct
      // conversion, so IPC from the packaged renderer is trusted.
      const filePath = path.resolve(fileURLToPath(parsed));
      return filePath === distDir || filePath.startsWith(`${distDir}${path.sep}`);
    }
    if (!app.isPackaged && parsed.origin === DEV_RENDERER_ORIGIN) return true;
  } catch {
    return false;
  }
  return false;
}

function isAllowedExternalUrl(url: string): boolean {
  try {
    return EXTERNAL_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

function wireSessionCsp(): void {
  const csp = buildRendererCsp(!app.isPackaged);
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    headers['Content-Security-Policy'] = [csp];
    callback({ responseHeaders: headers });
  });
}

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow(
    createMainWindowConfig({ preloadPath: preloadPath(), title: PRODUCT_TITLE })
  );

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedRendererUrl(url)) {
      event.preventDefault();
    }
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
    isTrustedSender: isTrustedRendererUrl,
  });
  registerFileIpc({
    getMainWindow: () => mainWindow,
    isTrustedSender: isTrustedRendererUrl,
  });
  registerWifiToolsIpc({
    isTrustedSender: isTrustedRendererUrl,
    isDemo: () => scanState.demoMode,
  });
  registerUpdatesIpc({
    service: updateService,
    isTrustedSender: isTrustedRendererUrl,
  });
  updateService.init();
  installApplicationMenu({
    getMainWindow: () => mainWindow,
    productTitle: PRODUCT_TITLE,
    appVersion: app.getVersion(),
    onScanStart: () => startScanLoop(scanState, () => mainWindow),
    onScanStop: () => stopScanTimer(scanState),
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
  return true;
});

app.on('render-process-gone', (_event, _contents, details) => {
  logCrash('render-process-gone', details);
});
app.on('child-process-gone', (_event, details) => {
  logCrash('child-process-gone', details);
});

app.on('window-all-closed', () => {
  stopScanTimer(scanState);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  updateService.dispose();
  stopScanTimer(scanState);
});
