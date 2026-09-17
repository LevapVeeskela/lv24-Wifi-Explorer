import registryFile from '../../../../resources/oui/registry.json';

export type OuiSource = 'ieee-mal' | 'curated-fallback' | 'unknown';

export type OuiLookupResult = {
  oui: string | null;
  vendor: string | null;
  source: OuiSource;
  randomized: boolean;
};

type RegistryPayload = {
  meta: {
    format: 'ieee-mal-24';
    source: 'ieee-mal' | 'curated-fallback';
    sourceUrl: string | null;
    generatedAt: string;
    entryCount: number;
  };
  byPrefix: Record<string, string>;
};

const registry = registryFile as RegistryPayload;
const datasetSource = registry.meta.source;

function parseBssid(raw: string): { oui: string; locallyAdministered: boolean } | null {
  const hex = raw.trim().toLowerCase().replace(/[:\-.]/g, '');
  if (!/^[0-9a-f]{12}$/.test(hex)) {
    return null;
  }
  const first = Number.parseInt(hex.slice(0, 2), 16);
  const locallyAdministered = (first & 0x02) !== 0;
  const oui = `${hex.slice(0, 2)}:${hex.slice(2, 4)}:${hex.slice(4, 6)}`;
  return { oui, locallyAdministered };
}

const unknown: OuiLookupResult = {
  oui: null,
  vendor: null,
  source: 'unknown',
  randomized: false,
};

/**
 * Resolve vendor for a BSSID using the bundled IEEE MA-L registry.
 * Locally administered (randomized) MACs return `randomized: true` and no vendor.
 */
export function lookup(bssid: string): OuiLookupResult {
  if (!bssid || typeof bssid !== 'string') {
    return unknown;
  }

  const parsed = parseBssid(bssid);
  if (!parsed) {
    return unknown;
  }

  const { oui, locallyAdministered } = parsed;

  if (locallyAdministered) {
    return {
      oui,
      vendor: null,
      source: 'unknown',
      randomized: true,
    };
  }

  const vendor = registry.byPrefix[oui] ?? null;
  if (vendor === null || vendor === '') {
    return {
      oui,
      vendor: null,
      source: 'unknown',
      randomized: false,
    };
  }

  return {
    oui,
    vendor,
    source: datasetSource,
    randomized: false,
  };
}

export function getOuiRegistryMeta(): RegistryPayload['meta'] {
  return registry.meta;
}
