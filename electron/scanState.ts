/**
 * @deprecated Import from `./scan/registerIpc` or `./scan/scheduler` instead.
 * Thin re-export for legacy imports during main-process migration.
 */
export {
  createInitialScanState,
  setDemoMode,
  setScanInterval,
  startScanLoop,
  stopScanTimer,
  type ScanRuntimeState,
} from './scan/scheduler';
