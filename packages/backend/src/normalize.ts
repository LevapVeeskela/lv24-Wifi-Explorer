import type { CoreWlanNetworkRecord } from '@lv24/wifi-core';
import type { ScanSnapshotPayload } from './types';

/** Map ScanCore v1 `results` rows into the `CoreWlanNetworkRecord` shape. */
function mapBand(value: unknown): CoreWlanNetworkRecord['channelBand'] {
  if (value === '2.4GHz' || value === '2ghz') return '2ghz';
  if (value === '5GHz' || value === '5ghz') return '5ghz';
  if (value === '6GHz' || value === '6ghz') return '6ghz';
  return 'unknown';
}

function mapWidth(value: unknown): CoreWlanNetworkRecord['channelWidth'] {
  switch (value) {
    case '20MHz':
    case '20mhz':
      return '20mhz';
    case '40MHz':
    case '40mhz':
      return '40mhz';
    case '80MHz':
    case '80+80MHz':
    case '80mhz':
      return '80mhz';
    case '160MHz':
    case '160mhz':
      return '160mhz';
    default:
      return 'unknown';
  }
}

const PHY_LETTERS = new Set(['a', 'b', 'g', 'n', 'ac', 'ax', 'be']);

function mapPhyModes(value: unknown): CoreWlanNetworkRecord['supportedPhyModes'] {
  if (!Array.isArray(value)) return [];
  const out: NonNullable<CoreWlanNetworkRecord['supportedPhyModes']>[number][] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const lower = item.toLowerCase().replace('802.11', '');
    if (PHY_LETTERS.has(lower)) out.push(lower as never);
  }
  return out as CoreWlanNetworkRecord['supportedPhyModes'];
}

function mapSecurityKinds(
  raw: unknown,
  label: unknown
): CoreWlanNetworkRecord['supportedSecurity'] {
  const out: string[] = [];
  const push = (value: string) => {
    if (value && !out.includes(value as never)) out.push(value as never);
  };
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item !== 'string') continue;
      push(item.toLowerCase().replace(/\s+/g, '-'));
    }
  }
  if (out.length === 0 && typeof label === 'string') {
    push(label.toLowerCase().replace(/\s+/g, '-'));
  }
  if (out.length === 0) push('open');
  return out as unknown as CoreWlanNetworkRecord['supportedSecurity'];
}

function rowToRecord(row: Record<string, unknown>): CoreWlanNetworkRecord {
  const ssid = typeof row.ssid === 'string' ? row.ssid : null;
  return {
    ssid,
    ssidData: ssid ? [...Buffer.from(ssid, 'utf8')] : null,
    bssid: typeof row.bssid === 'string' ? row.bssid : null,
    rssiDbm: typeof row.rssiDbm === 'number' ? row.rssiDbm : 0,
    noiseDbm: typeof row.noiseDbm === 'number' ? row.noiseDbm : 0,
    channelNumber: typeof row.channel === 'number' ? row.channel : null,
    channelBand: mapBand(row.band),
    channelWidth: mapWidth(row.channelWidth),
    countryCode: typeof row.countryCode === 'string' ? row.countryCode : null,
    beaconIntervalMs: 100,
    ibss: false,
    informationElementData: null,
    supportedSecurity: mapSecurityKinds(row.securityRaw, row.security),
    supportedPhyModes: mapPhyModes(row.phyModesSupported),
  };
}

/** Normalize a ScanCore `scan:snapshot` payload to the public backend shape. */
export function normalizeScanCoreSnapshot(
  payload: Record<string, unknown>
): ScanSnapshotPayload | null {
  const rawNetworks = Array.isArray(payload.networks) ? payload.networks : null;
  const rawResults = Array.isArray(payload.results) ? payload.results : null;
  const rows = rawNetworks ?? rawResults;
  if (!rows) return null;

  const networks: CoreWlanNetworkRecord[] = [];
  for (const row of rows) {
    if (row && typeof row === 'object') {
      const rec = row as Record<string, unknown>;
      if (typeof rec.rssiDbm === 'number' && typeof rec.channelBand === 'string') {
        networks.push(rec as unknown as CoreWlanNetworkRecord);
      } else {
        networks.push(rowToRecord(rec));
      }
    }
  }

  const location = payload.location;
  return {
    capturedAt:
      typeof payload.capturedAt === 'string' ? payload.capturedAt : new Date().toISOString(),
    interfaceName: typeof payload.interfaceName === 'string' ? payload.interfaceName : null,
    location:
      location === 'granted' ||
      location === 'denied' ||
      location === 'not-determined' ||
      location === 'restricted'
        ? location
        : 'not-determined',
    networks,
    associated: null,
    includeHiddenRequested: payload.includeHiddenRequested === true,
    source: 'scancore',
    demo: payload.source === 'demo' || payload.demo === true,
  };
}
