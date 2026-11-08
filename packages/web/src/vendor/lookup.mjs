/**
 * Поиск производителя по BSSID: локальный IEEE MA-L (24 бита).
 * Clean-room. MA-M/MA-S на 24 битах неоднозначны.
 */
import { normalizeOui24 } from './parse-ieee-mal.mjs';

const REDACTED = {
  oui: null,
  locallyAdministered: false,
  multicast: false,
  organization: null,
  match: 'bssid-redacted',
  registryFile: null,
};

/** @type {import('./lookup.ts').LoadedOuiRegistry | null} */
let defaultRegistry = null;

/** @param {import('./lookup.ts').LoadedOuiRegistry | null} registry */
export function setDefaultOuiRegistry(registry) {
  defaultRegistry = registry;
}

export function getDefaultOuiRegistry() {
  return defaultRegistry;
}

/**
 * @param {ReadonlyMap<string, string> | Iterable<readonly [string, string]>} records
 * @param {{ fileName: string, generatedAt: string }} meta
 */
export function createOuiRegistry(records, meta) {
  const map = new Map();
  const iterable = isMapLike(records) ? records : records;
  for (const [key, organization] of iterable) {
    const oui = normalizeOui24(key);
    if (!oui) {
      continue;
    }
    map.set(oui, organization);
  }
  return {
    format: 'ieee-mal-24',
    fileName: meta.fileName,
    generatedAt: meta.generatedAt,
    records: map,
  };
}

/**
 * @param {import('./lookup.ts').BssidInput} [bssid]
 * @param {import('./lookup.ts').RegistryInput | null} [registry]
 */
export function lookupVendor(bssid, registry) {
  const raw = unwrapBssid(bssid);
  if (raw === null) {
    return { ...REDACTED };
  }

  const parsed = parseBssid(raw);
  if (!parsed) {
    return {
      oui: null,
      locallyAdministered: false,
      multicast: false,
      organization: null,
      match: 'unknown',
      registryFile: null,
    };
  }

  const first = parsed.octets[0];
  const multicast = (first & 0x01) !== 0;
  const locallyAdministered = (first & 0x02) !== 0;
  const oui = parsed.oui;
  const resolved = resolveRegistry(registry);

  if (locallyAdministered) {
    return {
      oui,
      locallyAdministered: true,
      multicast,
      organization: null,
      match: 'randomized',
      registryFile: null,
    };
  }

  const organization = resolved?.records.get(oui) ?? null;
  if (organization != null) {
    return {
      oui,
      locallyAdministered: false,
      multicast,
      organization: organization === '' ? null : organization,
      match: 'ieee-mal-24',
      registryFile: resolved?.fileName ?? null,
    };
  }

  return {
    oui,
    locallyAdministered: false,
    multicast,
    organization: null,
    match: 'unknown',
    registryFile: resolved?.fileName ?? null,
  };
}

/** @param {string} raw */
export function parseBssid(raw) {
  const hex = raw
    .trim()
    .toLowerCase()
    .replace(/[:\-.]/g, '');
  if (!/^[0-9a-f]{12}$/.test(hex)) {
    return null;
  }
  const octets = [];
  for (let i = 0; i < 12; i += 2) {
    octets.push(Number.parseInt(hex.slice(i, i + 2), 16));
  }
  const canonical = octets.map((octet) => octet.toString(16).padStart(2, '0')).join(':');
  return { octets, oui: canonical.slice(0, 8), canonical };
}

function unwrapBssid(input) {
  if (input == null) {
    return null;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed === '' || isRedactedToken(trimmed)) {
      return null;
    }
    return trimmed;
  }
  if (typeof input === 'object' && input !== null && 'status' in input) {
    if (input.status === 'redacted') {
      return null;
    }
    if (input.status === 'available') {
      return unwrapBssid(input.value);
    }
  }
  return null;
}

function isRedactedToken(value) {
  const lower = value.toLowerCase();
  return lower === '(null)' || lower === 'redacted' || lower === '<redacted>';
}

function resolveRegistry(registry) {
  const source = registry === undefined ? defaultRegistry : registry;
  if (source == null) {
    return null;
  }
  if (isLoadedRegistry(source)) {
    return { records: source.records, fileName: source.fileName };
  }
  return { records: source, fileName: null };
}

function isLoadedRegistry(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'records' in value &&
    'format' in value &&
    value.format === 'ieee-mal-24'
  );
}

function isMapLike(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.get === 'function' &&
    typeof value.keys === 'function'
  );
}
