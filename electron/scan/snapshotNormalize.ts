/**
 * ScanCore v1 snapshots use `results`; renderer ingest expects CoreWlan `networks`.
 * Swift usually sends both — normalize when only `results` is present.
 */

type ScanResultRow = Record<string, unknown>;

function mapBand(value: unknown): 'unknown' | '2ghz' | '5ghz' | '6ghz' {
  if (value === '2.4GHz' || value === '2ghz') return '2ghz';
  if (value === '5GHz' || value === '5ghz') return '5ghz';
  if (value === '6GHz' || value === '6ghz') return '6ghz';
  return 'unknown';
}

function mapWidth(value: unknown): 'unknown' | '20mhz' | '40mhz' | '80mhz' | '160mhz' {
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

function mapPhyModes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      const lower = item.toLowerCase();
      if (PHY_LETTERS.has(lower)) out.push(lower);
      else if (lower === '802.11n') out.push('n');
      else if (lower === '802.11ac') out.push('ac');
      else if (lower === '802.11ax') out.push('ax');
    }
  }
  return out;
}

function mapSecurityKinds(securityRaw: unknown, label: unknown): string[] {
  const fromRaw: string[] = [];
  if (Array.isArray(securityRaw)) {
    for (const name of securityRaw) {
      if (typeof name !== 'string') continue;
      const mapped = mapSecurityName(name);
      if (mapped) fromRaw.push(mapped);
    }
  }
  if (fromRaw.length > 0) return fromRaw;
  if (typeof label === 'string') {
    const mapped = mapSecurityLabel(label);
    if (mapped) return [mapped];
  }
  return ['open'];
}

function mapSecurityName(name: string): string | null {
  switch (name.toLowerCase()) {
    case 'none':
    case 'open':
      return 'open';
    case 'wep':
      return 'wep';
    case 'wpapersonal':
    case 'wpa-personal':
      return 'wpa-personal';
    case 'wpapersonalmixed':
    case 'wpa-personal-mixed':
      return 'wpa-personal-mixed';
    case 'wpa2personal':
    case 'wpa2-personal':
      return 'wpa2-personal';
    case 'wpa3personal':
    case 'wpa3-personal':
      return 'wpa3-personal';
    case 'wpa3transition':
    case 'wpa3-transition':
      return 'wpa3-transition';
    case 'wpaenterprise':
    case 'wpa-enterprise':
      return 'wpa-enterprise';
    case 'wpaenterprisemixed':
    case 'wpa-enterprise-mixed':
      return 'wpa-enterprise-mixed';
    case 'wpa2enterprise':
    case 'wpa2-enterprise':
      return 'wpa2-enterprise';
    case 'wpa3enterprise':
    case 'wpa3-enterprise':
      return 'wpa3-enterprise';
    case 'owe':
      return 'owe';
    case 'owetransition':
    case 'owe-transition':
      return 'owe-transition';
    default:
      return null;
  }
}

function mapSecurityLabel(label: string): string | null {
  switch (label) {
    case 'open':
      return 'open';
    case 'wep':
      return 'wep';
    case 'wpa-personal':
      return 'wpa-personal';
    case 'wpa2-personal':
      return 'wpa2-personal';
    case 'wpa3-personal':
      return 'wpa3-personal';
    case 'wpa3-transition':
      return 'wpa3-transition';
    case 'wpa-enterprise':
      return 'wpa-enterprise';
    case 'wpa2-enterprise':
      return 'wpa2-enterprise';
    case 'wpa3-enterprise':
      return 'wpa3-enterprise';
    case 'owe':
      return 'owe';
    default:
      return null;
  }
}

function resultToCoreRecord(row: ScanResultRow): Record<string, unknown> {
  const ssid = typeof row.ssid === 'string' ? row.ssid : row.ssid === null ? null : null;
  const rssi = typeof row.rssiDbm === 'number' ? row.rssiDbm : 0;
  const noise = typeof row.noiseDbm === 'number' ? row.noiseDbm : 0;
  return {
    ssid,
    ssidData: typeof ssid === 'string' ? [...Buffer.from(ssid, 'utf8')] : null,
    bssid: typeof row.bssid === 'string' ? row.bssid : null,
    rssiDbm: rssi,
    noiseDbm: noise,
    channelNumber: typeof row.channel === 'number' ? row.channel : null,
    channelBand: mapBand(row.band),
    channelWidth: mapWidth(row.channelWidth),
    countryCode: null,
    beaconIntervalMs: 100,
    ibss: false,
    informationElementData: null,
    supportedSecurity: mapSecurityKinds(row.securityRaw, row.security),
    supportedPhyModes: mapPhyModes(row.phyModesSupported),
  };
}

function isCoreLikeNetworkRow(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.rssiDbm === 'number' &&
    typeof row.channelBand === 'string' &&
    Array.isArray(row.supportedSecurity)
  );
}

/** Ensures `networks` is populated for IPC when ScanCore sent v1 `results` only. */
export function ensureSnapshotNetworks(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const networks = payload.networks;
  if (Array.isArray(networks) && networks.length > 0 && networks.every(isCoreLikeNetworkRow)) {
    return payload;
  }

  const results = payload.results;
  if (!Array.isArray(results) || results.length === 0) {
    return payload;
  }

  const mapped = results
    .filter((row): row is ScanResultRow => !!row && typeof row === 'object')
    .map(resultToCoreRecord);

  return { ...payload, networks: mapped };
}
