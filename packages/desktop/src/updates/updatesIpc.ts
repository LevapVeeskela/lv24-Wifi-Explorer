import type { IpcMainInvokeEvent } from 'electron';
import { ipcMain } from 'electron';
import type { UpdateService } from './UpdateService';

export const UPDATES_IPC_CHANNELS = {
  status: 'updates:getStatus',
  setEnabled: 'updates:setEnabled',
  check: 'updates:check',
  install: 'updates:install',
} as const;

export const UPDATES_IPC_EVENTS = {
  status: 'updates:status',
} as const;

export interface RegisterUpdatesIpcOptions {
  service: UpdateService;
  isTrustedSender: (url: string) => boolean;
}

function senderIsTrusted(event: IpcMainInvokeEvent, isTrusted: (url: string) => boolean): boolean {
  const url = event.senderFrame?.url ?? '';
  return url.length > 0 && isTrusted(url);
}

export function registerUpdatesIpc(options: RegisterUpdatesIpcOptions): void {
  const guard = (event: IpcMainInvokeEvent): boolean =>
    senderIsTrusted(event, options.isTrustedSender);

  ipcMain.handle(UPDATES_IPC_CHANNELS.status, (event) => {
    if (!guard(event)) return { ok: false, code: 'DENIED' };
    return { ok: true, status: options.service.getStatus() };
  });

  ipcMain.handle(UPDATES_IPC_CHANNELS.setEnabled, (event, payload: unknown) => {
    if (!guard(event)) return { ok: false, code: 'DENIED' };
    const enabled =
      typeof payload === 'object' &&
      payload !== null &&
      typeof (payload as { enabled?: unknown }).enabled === 'boolean'
        ? (payload as { enabled: boolean }).enabled
        : true;
    return { ok: true, status: options.service.setEnabled(enabled) };
  });

  ipcMain.handle(UPDATES_IPC_CHANNELS.check, async (event) => {
    if (!guard(event)) return { ok: false, code: 'DENIED' };
    return { ok: true, status: await options.service.checkNow() };
  });

  ipcMain.handle(UPDATES_IPC_CHANNELS.install, (event) => {
    if (!guard(event)) return { ok: false, code: 'DENIED' };
    return { ok: options.service.install() };
  });
}
