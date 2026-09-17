# Electron scan IPC

Main-process scan orchestration: spawn **ScanCore** when the helper binary exists, otherwise replay **`resources/fixtures/scan-snapshot.json`** on a timer (minimum **3 s**).

## Layout

| Module | Role |
|--------|------|
| `scanCoreClient.ts` | Resolve ScanCore binary, spawn `--stdio-only --idle`, parse JSON Lines |
| `snapshotNormalize.ts` | Map v1 `results` → `networks` when Swift omits compatibility array |
| `scheduler.ts` | Start/stop loop, forward snapshots + permissions, OUI attach |
| `demoFallback.ts` | Load fixture JSON (packaged `resources/fixtures/` or dev paths) |
| `registerIpc.ts` | `ipcMain.handle` for renderer; import from `electron/main.ts` |
| `ipcChannels.ts` | Channel strings (mirror `src/shared/ipc/scanIpc.ts`) |
| `redactLog.ts` | Debug logs only; BSSID keys redacted unless `WIFI_EXPLORER_SCAN_DEBUG=1` |

Shared types: **`src/shared/ipc/scanIpc.ts`**. Preload bridge types: **`src/types/wifiExplorer.d.ts`**.

## Wire ScanCore

1. Build helper: `yarn run build:scancore` (or SwiftPM directly):

   ```bash
   cd native/ScanCore && DEVELOPER_DIR=/Library/Developer/CommandLineTools swift build -c release
   ```

   Xcode license may block `/usr/bin/swift` without `DEVELOPER_DIR`.

2. Run app with live scan: `yarn run dev:electron -- --live` or `WIFI_EXPLORER_DEMO=0`
3. Default boot stays **demo** until `--live` / env opt-out

### Binary resolve order (`scanCoreClient.resolveScanCoreBinary`)

1. `{resourcesPath}/ScanCore.app/Contents/MacOS/ScanCore` (electron-builder `extraResources`)
2. `{repo}/native/ScanCore/.build/ScanCore.app/Contents/MacOS/ScanCore`
3. `{repo}/native/ScanCore/.build/release/ScanCore`
4. `{repo}/native/ScanCore/.build/out/Products/Release/ScanCore`

`{repo}` is tried via `app.getAppPath()`, `process.cwd()`, and `electron/scan/../../native/ScanCore`. If none exist, main falls back to fixture replay (`demoFallback.ts`).

Spawn uses `--stdio-only --idle`, then stdin JSON Lines: `permissions:query`, `scan:start`; stop sends `scan:stop` + `shutdown`. Snapshots accept v1 `results` and legacy `networks` (`snapshotNormalize.ts`).

## Main integration

`electron/main.ts` is wired via `registerScanIpc` / `emitBootDemoPermissions`. Reference pattern:

```ts
import {
  bootDemoModeFromArgv,
  createInitialScanState,
  emitBootDemoPermissions,
  registerScanIpc,
  stopScanTimer,
  type ScanRuntimeState,
} from './scan/registerIpc';

let scanState = createInitialScanState(bootDemoModeFromArgv());

app.whenReady().then(() => {
  registerScanIpc({ getMainWindow: () => mainWindow, getState: () => scanState });
  // ...
  if (scanState.demoMode) emitBootDemoPermissions(() => mainWindow);
});
```

Do **not** move window creation or CSP wiring here.

## Permissions IPC

- `permissions:query` — `{ location, demoMode }`
- `permissions:openSettings` — macOS Location pane via `x-apple.systempreferences:…Privacy_LocationServices`

## Packaging fixtures

Add to `electron-builder.yml` `extraResources` when ready:

```yaml
- from: resources/fixtures
  to: fixtures
```

Dev fallback: `electron/scan/fixtures/scan-snapshot.json`.

## Privacy

Production paths must not `console.log` raw BSSIDs. Use `logScanDebug` from `redactLog.ts` for optional diagnostics.
