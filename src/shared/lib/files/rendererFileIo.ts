/** Renderer file helpers: optional `window.wifiExplorer` APIs, else Blob/`<input>`. */

type UnknownRecord = Record<string, unknown>;

const SAVE_METHODS = ['saveFile', 'saveTextFile', 'writeTextFile', 'writeFile'] as const;
const OPEN_METHODS = ['openFile', 'openTextFile', 'readTextFile', 'readFile'] as const;

export type RendererSaveRequest = {
  defaultPath: string;
  contents: string;
  mimeType: string;
};

export type RendererOpenRequest = {
  accept: string;
  extensions?: readonly string[];
};

export type RendererOpenResult =
  | { canceled: true }
  | { canceled: false; name: string; text: string };

function isRecord(value: unknown): value is UnknownRecord {
  return value != null && typeof value === 'object';
}

function explorerHost(): UnknownRecord | undefined {
  const bridge = window.wifiExplorer;
  return isRecord(bridge) ? bridge : undefined;
}

function isCanceled(result: unknown): boolean {
  return isRecord(result) && result.canceled === true;
}

function isRejected(result: unknown): boolean {
  return isRecord(result) && result.ok === false && result.canceled !== true;
}

function readOpenedFile(result: unknown): { name: string; text: string } | null {
  if (!isRecord(result) || result.canceled === true) return null;
  const text =
    typeof result.text === 'string'
      ? result.text
      : typeof result.contents === 'string'
        ? result.contents
        : typeof result.data === 'string'
          ? result.data
          : null;
  if (text == null) return null;
  const name =
    (typeof result.name === 'string' && result.name) ||
    (typeof result.fileName === 'string' && result.fileName) ||
    (typeof result.path === 'string' && result.path) ||
    'snapshot.lv24scan';
  return { name, text };
}

/** Trigger a download with a temporary `<a download>` (no Electron dialog). */
export function downloadTextViaAnchor(fileName: string, text: string, mimeType: string): void {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function pickLocalTextFile(accept: string): Promise<RendererOpenResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.hidden = true;
    const finish = (result: RendererOpenResult) => {
      input.remove();
      resolve(result);
    };
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        finish({ canceled: true });
        return;
      }
      void file.text().then((text) => {
        finish({ canceled: false, name: file.name, text });
      });
    });
    document.body.appendChild(input);
    input.click();
  });
}

type BridgeSaveOutcome = 'saved' | 'canceled' | 'miss';

async function tryBridgeSave(host: UnknownRecord, payload: UnknownRecord): Promise<BridgeSaveOutcome> {
  for (const name of SAVE_METHODS) {
    const fn = host[name];
    if (typeof fn !== 'function') continue;
    try {
      const result: unknown = await (fn as (arg: UnknownRecord) => Promise<unknown>).call(host, payload);
      if (isCanceled(result)) return 'canceled';
      if (isRejected(result)) continue;
      return 'saved';
    } catch {
      // Wrong signature or unimplemented — try the next name.
    }
  }
  return 'miss';
}

async function tryBridgeOpen(host: UnknownRecord, payload: UnknownRecord): Promise<RendererOpenResult | null> {
  for (const name of OPEN_METHODS) {
    const fn = host[name];
    if (typeof fn !== 'function') continue;
    try {
      const result: unknown = await (fn as (arg: UnknownRecord) => Promise<unknown>).call(host, payload);
      if (isCanceled(result)) return { canceled: true };
      const opened = readOpenedFile(result);
      if (opened) return { canceled: false, ...opened };
    } catch {
      // Wrong signature or unimplemented — try the next name.
    }
  }
  return null;
}

/** Save text via Electron file APIs when present; otherwise Blob + `<a>`. */
export async function saveWorkbenchFile(request: RendererSaveRequest): Promise<{ canceled: boolean }> {
  const host = explorerHost();
  if (host) {
    const outcome = await tryBridgeSave(host, {
      defaultPath: request.defaultPath,
      fileName: request.defaultPath,
      contents: request.contents,
      text: request.contents,
      data: request.contents,
      mimeType: request.mimeType,
    });
    if (outcome === 'canceled') return { canceled: true };
    if (outcome === 'saved') return { canceled: false };
  }
  downloadTextViaAnchor(request.defaultPath, request.contents, request.mimeType);
  return { canceled: false };
}

/** Open text via Electron file APIs when present; otherwise a hidden file input. */
export async function openWorkbenchFile(request: RendererOpenRequest): Promise<RendererOpenResult> {
  const host = explorerHost();
  if (host) {
    const opened = await tryBridgeOpen(host, {
      accept: request.accept,
      extensions: request.extensions ? [...request.extensions] : undefined,
      filters: request.extensions
        ? [{ name: 'LV24 scan', extensions: [...request.extensions] }]
        : undefined,
      multiple: false,
    });
    if (opened) return opened;
  }
  return pickLocalTextFile(request.accept);
}
