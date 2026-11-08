import { dialog, ipcMain, type BrowserWindow } from 'electron';
import { readFile, stat, writeFile } from 'node:fs/promises';
import * as path from 'node:path';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

type SaveRequest = {
  defaultPath?: string;
  contents?: string;
  text?: string;
  data?: string;
  mimeType?: string;
};

type OpenRequest = {
  extensions?: string[];
  filters?: Array<{ name: string; extensions: string[] }>;
};

function isTrusted(
  event: Electron.IpcMainInvokeEvent,
  isTrustedUrl: (url: string) => boolean
): boolean {
  const url = event.senderFrame?.url ?? '';
  return url.length > 0 && isTrustedUrl(url);
}

export function registerFileIpc(options: {
  getMainWindow: () => BrowserWindow | null;
  isTrustedSender: (url: string) => boolean;
}): void {
  ipcMain.handle('file:save', async (event, payload: unknown) => {
    if (!isTrusted(event, options.isTrustedSender)) return { ok: false, error: 'untrusted-sender' };
    const request = (payload ?? {}) as SaveRequest;
    const contents = request.contents ?? request.text ?? request.data;
    if (typeof contents !== 'string') return { ok: false, error: 'invalid-contents' };
    if (contents.length > MAX_FILE_BYTES) return { ok: false, error: 'file-too-large' };

    const win = options.getMainWindow();
    const defaultPath = typeof request.defaultPath === 'string' ? request.defaultPath : undefined;
    const result = win
      ? await dialog.showSaveDialog(win, {
          defaultPath,
          filters: [{ name: 'Files', extensions: ['*'] }],
        })
      : await dialog.showSaveDialog({ defaultPath });
    if (result.canceled || !result.filePath) return { canceled: true };
    try {
      await writeFile(result.filePath, contents, 'utf8');
      return { ok: true, path: result.filePath, name: path.basename(result.filePath) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'write-failed' };
    }
  });

  ipcMain.handle('file:open', async (event, payload: unknown) => {
    if (!isTrusted(event, options.isTrustedSender)) return { ok: false, error: 'untrusted-sender' };
    const request = (payload ?? {}) as OpenRequest;
    const win = options.getMainWindow();
    const filters = request.filters?.length
      ? request.filters
      : request.extensions?.length
        ? [{ name: 'Files', extensions: [...request.extensions] }]
        : undefined;
    const result = win
      ? await dialog.showOpenDialog(win, {
          properties: ['openFile'],
          filters,
        })
      : await dialog.showOpenDialog({ properties: ['openFile'], filters });
    if (result.canceled || result.filePaths.length === 0) return { canceled: true };
    const filePath = result.filePaths[0]!;
    try {
      const info = await stat(filePath);
      if (info.size > MAX_FILE_BYTES) return { ok: false, error: 'file-too-large' };
      const text = await readFile(filePath, 'utf8');
      return { ok: true, text, name: path.basename(filePath), path: filePath };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'read-failed' };
    }
  });
}
