import type { CoreWlanNetworkRecord } from '@/domain/bss';
import type { LocationAuthorization } from '@/domain/identity';
import type { ScanSnapshot, ScanViewModel } from '@/domain/scan';
import { asIsoTime } from '@/scan/identity';
import { mapCoreWlanRecordsToObservedBss } from '@/scan/mapObservedBss';
import { mergeSnapshots } from '@/scan/mergeSnapshots';
import { SHARED_OUI_LOOKUP } from '@/scan/sharedOuiLookup';
import { buildDemoView } from '@/scan';

const LOCATION: readonly LocationAuthorization[] = [
  'granted',
  'denied',
  'not-determined',
  'restricted',
];

function asLocation(value: unknown): LocationAuthorization {
  return LOCATION.includes(value as LocationAuthorization)
    ? (value as LocationAuthorization)
    : 'not-determined';
}

function isCoreRecord(value: unknown): value is CoreWlanNetworkRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.rssiDbm === 'number' &&
    typeof row.channelBand === 'string' &&
    Array.isArray(row.supportedSecurity)
  );
}

export function connectedBssidFromPayload(payload: Record<string, unknown>): string | null {
  const associated = payload.associated;
  if (!associated || typeof associated !== 'object') return null;
  const bssid = (associated as { bssid?: unknown }).bssid;
  if (!bssid || typeof bssid !== 'object') return null;
  const gated = bssid as { status?: string; value?: unknown };
  if (gated.status === 'available' && typeof gated.value === 'string') {
    return gated.value.toLowerCase();
  }
  return null;
}

/** IPC payload → ScanViewModel. Fixtures when ScanCore asks for demo fallback. */
export function ingestScanPayload(
  prev: ScanViewModel | null,
  payload: Record<string, unknown>,
): ScanViewModel {
  if (payload.demo === true || payload.source === 'fixtures') {
    return buildDemoView();
  }

  const networksRaw = payload.networks;
  if (!Array.isArray(networksRaw) || !networksRaw.every(isCoreRecord)) {
    return prev ?? buildDemoView();
  }

  const capturedAt = asIsoTime(
    typeof payload.capturedAt === 'string' ? payload.capturedAt : new Date().toISOString(),
  );
  const location = asLocation(payload.location);

  const mapped = mapCoreWlanRecordsToObservedBss(
    networksRaw,
    prev?.bssRows,
    capturedAt,
    { location, ouiLookup: SHARED_OUI_LOOKUP },
  );

  const snapshot: ScanSnapshot = {
    capturedAt,
    interfaceName: typeof payload.interfaceName === 'string' ? payload.interfaceName : null,
    location,
    networks: mapped,
    associated: null,
    includeHiddenRequested: payload.includeHiddenRequested === true,
  };

  return mergeSnapshots(prev, snapshot);
}
