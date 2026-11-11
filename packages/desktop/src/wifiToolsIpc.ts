import type { IpcMainInvokeEvent } from 'electron';
import { ipcMain } from 'electron';
import {
  demoAdapterCapabilities,
  listSavedWifiProfiles,
  readAdapterCapabilities,
  readSavedWifiPassword,
} from '@lv24/wifi-backend';

export const WIFI_TOOLS_IPC_CHANNELS = {
  capabilities: 'wifi:capabilities',
  savedProfiles: 'wifi:savedProfiles',
  password: 'wifi:password',
} as const;

export interface RegisterWifiToolsIpcOptions {
  isTrustedSender: (url: string) => boolean;
  isDemo: () => boolean;
}

function senderIsTrusted(event: IpcMainInvokeEvent, isTrusted: (url: string) => boolean): boolean {
  const url = event.senderFrame?.url ?? '';
  return url.length > 0 && isTrusted(url);
}

function hasControlChars(value: string): boolean {
  for (const char of value) {
    if (char.charCodeAt(0) < 0x20) return true;
  }
  return false;
}

function validSsid(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const ssid = value.trim();
  if (!ssid || ssid.length > 128 || hasControlChars(ssid)) return null;
  return ssid;
}

export function registerWifiToolsIpc(options: RegisterWifiToolsIpcOptions): void {
  const guard = (event: IpcMainInvokeEvent): boolean =>
    senderIsTrusted(event, options.isTrustedSender);

  ipcMain.handle(WIFI_TOOLS_IPC_CHANNELS.capabilities, async (event) => {
    if (!guard(event)) return { ok: false, code: 'DENIED', message: 'untrusted-sender' };
    if (options.isDemo()) return { ok: true, capabilities: demoAdapterCapabilities() };
    return readAdapterCapabilities();
  });

  ipcMain.handle(WIFI_TOOLS_IPC_CHANNELS.savedProfiles, async (event) => {
    if (!guard(event)) return { ok: false, code: 'DENIED', message: 'untrusted-sender' };
    if (options.isDemo()) return { ok: true, profiles: [], listable: false };
    return listSavedWifiProfiles();
  });

  ipcMain.handle(WIFI_TOOLS_IPC_CHANNELS.password, async (event, payload: unknown) => {
    if (!guard(event)) return { ok: false, code: 'DENIED', message: 'untrusted-sender' };
    if (options.isDemo()) {
      return { ok: false, code: 'UNSUPPORTED', message: 'demo mode has no saved passwords' };
    }
    const ssid = validSsid(
      typeof payload === 'object' && payload !== null ? (payload as { ssid?: unknown }).ssid : null
    );
    if (!ssid) return { ok: false, code: 'ERROR', message: 'invalid SSID' };
    return readSavedWifiPassword(ssid);
  });
}
