"use strict";
/**
 * ScanCore JSON Lines protocol v1 + Electron renderer ↔ main IPC.
 * Field names align with native/ScanCore/README.md and src/domain.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MACOS_LOCATION_SETTINGS_URL = exports.MIN_SCAN_INTERVAL_MS = exports.SCAN_IPC_EVENTS = exports.SCAN_IPC_CHANNELS = exports.SCAN_CORE_PROTOCOL_VERSION = void 0;
exports.SCAN_CORE_PROTOCOL_VERSION = 1;
/** ipcMain.handle / ipcRenderer.invoke channel names. */
exports.SCAN_IPC_CHANNELS = {
    scanStart: 'scan:start',
    scanStop: 'scan:stop',
    scanSetIntervalMs: 'scan:setIntervalMs',
    permissionsQuery: 'permissions:query',
    permissionsOpenSettings: 'permissions:openSettings',
    demoEnable: 'demo:enable',
};
/** ipcMain.send / ipcRenderer.on event names. */
exports.SCAN_IPC_EVENTS = {
    scanSnapshot: 'scan:snapshot',
    permissionsStatus: 'permissions:status',
    helperStatus: 'helper:status',
};
exports.MIN_SCAN_INTERVAL_MS = 3000;
exports.MACOS_LOCATION_SETTINGS_URL = 'x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices';
