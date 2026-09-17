/** Keep in sync with src/shared/ipc/scanIpc.ts (main tsconfig root is electron/ only). */

export const SCAN_IPC_CHANNELS = {
  scanStart: 'scan:start',
  scanStop: 'scan:stop',
  scanSetIntervalMs: 'scan:setIntervalMs',
  permissionsQuery: 'permissions:query',
  permissionsOpenSettings: 'permissions:openSettings',
  demoEnable: 'demo:enable',
} as const;

export const SCAN_IPC_EVENTS = {
  scanSnapshot: 'scan:snapshot',
  permissionsStatus: 'permissions:status',
  helperStatus: 'helper:status',
} as const;

export const MIN_SCAN_INTERVAL_MS = 3000 as const;

export const MACOS_LOCATION_SETTINGS_URL =
  'x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices' as const;
