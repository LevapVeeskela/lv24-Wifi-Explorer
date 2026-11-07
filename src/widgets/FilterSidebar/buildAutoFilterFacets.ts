import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import type { BandFilterValue, SecurityFilterValue } from '@/features/scan-filters';

export type BandFacet = {
  id: Exclude<BandFilterValue, 'all'>;
  count: number;
};

export type SecurityFacet = {
  id: SecurityFilterValue;
  count: number;
};

export type VendorFacet = {
  /** Display label; empty string means unknown vendor. */
  label: string;
  count: number;
};

export type AutoFilterFacets = {
  bands: BandFacet[];
  security: SecurityFacet[];
  vendors: VendorFacet[];
};

export const AUTO_FILTER_MAX_VENDORS = 16;

function bandFilterFromRow(band: ScanGridRow['band']): Exclude<BandFilterValue, 'all'> | null {
  if (band === 2.4) return '24';
  if (band === 5) return '5';
  if (band === 6) return '6';
  return null;
}

const BAND_FACET_ORDER: Exclude<BandFilterValue, 'all'>[] = ['24', '5', '6'];

export function buildAutoFilterFacets(rows: readonly ScanGridRow[]): AutoFilterFacets {
  const bandCounts = new Map<Exclude<BandFilterValue, 'all'>, number>();
  let openCount = 0;
  let secureCount = 0;
  const vendorByKey = new Map<string, { label: string; count: number }>();

  for (const row of rows) {
    const bandId = bandFilterFromRow(row.band);
    if (bandId) {
      bandCounts.set(bandId, (bandCounts.get(bandId) ?? 0) + 1);
    }
    if (row.securityOpen) openCount += 1;
    else secureCount += 1;

    const label = (row.vendor ?? '').trim();
    const key = label.toLowerCase();
    const existing = vendorByKey.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      vendorByKey.set(key, { label, count: 1 });
    }
  }

  const bands = BAND_FACET_ORDER.filter((id) => (bandCounts.get(id) ?? 0) > 0).map((id) => ({
    id,
    count: bandCounts.get(id) ?? 0,
  }));

  const security: SecurityFacet[] = [];
  if (openCount > 0) security.push({ id: 'open', count: openCount });
  if (secureCount > 0) security.push({ id: 'secure', count: secureCount });

  const vendors = [...vendorByKey.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, AUTO_FILTER_MAX_VENDORS);

  return { bands, security, vendors };
}

export function vendorQueryMatchesLabel(vendorQuery: string, label: string): boolean {
  const q = vendorQuery.trim().toLowerCase();
  if (!q) return false;
  return q === label.trim().toLowerCase();
}
