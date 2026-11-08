import type { ScanSettings } from './types';
import { applyScanIntervalMs } from './applyScanInterval';

/** Side effects when scan settings are loaded or committed (not React-only). */
export function applyScanSettingsEffects(settings: ScanSettings): void {
  applyScanIntervalMs(settings.scanIntervalSec);
}
