import type { LocationAuthorization } from '@/domain/identity';
import type { ScanSnapshotIpcPayload } from '@/shared/ipc/scanIpc';
import { normalizeLocationAuthorization } from '@/widgets/LocationBanner/normalizeLocationAuthorization';

export function locationStateFromSnapshot(value: unknown): LocationAuthorization | null {
  if (typeof value !== 'string') {
    return null;
  }
  return normalizeLocationAuthorization(value);
}

export function scanCoreStateFromSnapshot(
  payload: ScanSnapshotIpcPayload,
  demoModeProp: boolean
): 'ok' | 'error' | 'demo' {
  if (payload.demo === true || payload.source === 'fixtures') {
    return 'demo';
  }
  if (demoModeProp && payload.source !== 'scancore') {
    return 'demo';
  }
  return 'ok';
}
