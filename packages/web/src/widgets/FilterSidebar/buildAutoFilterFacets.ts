import type { ScanGridRow } from '@/entities/bss';
import {
  SCAN_ISSUE_IDS,
  SCAN_ISSUE_SEVERITY,
  scanIssueIdFromMessageKey,
  type IssueSeverity,
  type ScanIssueId,
} from '@/domain';
import type {
  BandFilterValue,
  NetworkTypeFilterValue,
  SecurityFilterValue,
  WidthFilterValue,
} from '@/features/scan-filters';

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

export type IssueFacet = {
  id: ScanIssueId;
  severity: IssueSeverity;
  count: number;
};

export type ChannelFacet = {
  channel: number;
  count: number;
};

export type WidthFacet = {
  widthMhz: WidthFilterValue;
  count: number;
};

export type PhyFacet = {
  phy: string;
  count: number;
};

export type NetworkTypeFacet = {
  id: NetworkTypeFilterValue;
  count: number;
};

export type AnnotationBucket = 'annotated' | 'unannotated';

export type AnnotationFacet = {
  id: AnnotationBucket;
  count: number;
};

export type AutoFilterFacets = {
  bands: BandFacet[];
  security: SecurityFacet[];
  vendors: VendorFacet[];
  issues: IssueFacet[];
  channels: ChannelFacet[];
  widths: WidthFacet[];
  phys: PhyFacet[];
  networkTypes: NetworkTypeFacet[];
  annotations: AnnotationFacet[];
};

export const AUTO_FILTER_MAX_VENDORS = 16;

const ISSUE_ORDER = new Map<ScanIssueId, number>(SCAN_ISSUE_IDS.map((id, index) => [id, index]));

const BAND_FACET_ORDER: Exclude<BandFilterValue, 'all'>[] = ['24', '5', '6'];

const WIDTH_FACET_ORDER: WidthFilterValue[] = [20, 40, 80, 160];

const PHY_FACET_ORDER = ['b', 'a', 'g', 'n', 'ac', 'ax', 'be'];

function bandFilterFromRow(band: ScanGridRow['band']): Exclude<BandFilterValue, 'all'> | null {
  if (band === 2.4) return '24';
  if (band === 5) return '5';
  if (band === 6) return '6';
  return null;
}

function widthFromRow(width: ScanGridRow['channelWidth']): WidthFilterValue | null {
  if (typeof width !== 'number') return null;
  return WIDTH_FACET_ORDER.includes(width as WidthFilterValue) ? (width as WidthFilterValue) : null;
}

function phySortKey(phy: string): number {
  const index = PHY_FACET_ORDER.indexOf(phy.toLowerCase());
  return index === -1 ? PHY_FACET_ORDER.length : index;
}

export function buildAutoFilterFacets(rows: readonly ScanGridRow[]): AutoFilterFacets {
  const bandCounts = new Map<Exclude<BandFilterValue, 'all'>, number>();
  let openCount = 0;
  let secureCount = 0;
  const vendorByKey = new Map<string, { label: string; count: number }>();
  const issueCounts = new Map<ScanIssueId, number>();
  const channelCounts = new Map<number, number>();
  const widthCounts = new Map<WidthFilterValue, number>();
  const phyCounts = new Map<string, number>();
  const networkTypeCounts = new Map<NetworkTypeFilterValue, number>();
  let annotatedCount = 0;
  let unannotatedCount = 0;

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

    const seenIssues = new Set<ScanIssueId>();
    for (const issueKey of row.issueKeys) {
      const issueId = scanIssueIdFromMessageKey(issueKey);
      if (issueId === null || seenIssues.has(issueId)) continue;
      seenIssues.add(issueId);
      issueCounts.set(issueId, (issueCounts.get(issueId) ?? 0) + 1);
    }

    if (typeof row.channel === 'number' && Number.isFinite(row.channel)) {
      channelCounts.set(row.channel, (channelCounts.get(row.channel) ?? 0) + 1);
    }

    const widthMhz = widthFromRow(row.channelWidth);
    if (widthMhz != null) {
      widthCounts.set(widthMhz, (widthCounts.get(widthMhz) ?? 0) + 1);
    }

    const phy = row.phyMode.trim().toLowerCase();
    if (phy) {
      phyCounts.set(phy, (phyCounts.get(phy) ?? 0) + 1);
    }

    networkTypeCounts.set(row.networkType, (networkTypeCounts.get(row.networkType) ?? 0) + 1);

    if (row.annotation.trim()) annotatedCount += 1;
    else unannotatedCount += 1;
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

  const issues = [...issueCounts.entries()]
    .map(([id, count]) => ({ id, severity: SCAN_ISSUE_SEVERITY[id], count }))
    .sort(
      (a, b) => b.count - a.count || (ISSUE_ORDER.get(a.id) ?? 0) - (ISSUE_ORDER.get(b.id) ?? 0)
    );

  const channels = [...channelCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([channel, count]) => ({ channel, count }));

  const widths = WIDTH_FACET_ORDER.filter((widthMhz) => (widthCounts.get(widthMhz) ?? 0) > 0).map(
    (widthMhz) => ({ widthMhz, count: widthCounts.get(widthMhz) ?? 0 })
  );

  const phys = [...phyCounts.entries()]
    .sort((a, b) => phySortKey(a[0]) - phySortKey(b[0]) || a[0].localeCompare(b[0]))
    .map(([phy, count]) => ({ phy, count }));

  const networkTypes: NetworkTypeFacet[] = [];
  for (const id of ['infrastructure', 'ibss'] as const) {
    const count = networkTypeCounts.get(id) ?? 0;
    if (count > 0) networkTypes.push({ id, count });
  }

  const annotations: AnnotationFacet[] = [];
  if (annotatedCount > 0) annotations.push({ id: 'annotated', count: annotatedCount });
  if (unannotatedCount > 0) annotations.push({ id: 'unannotated', count: unannotatedCount });

  return {
    bands,
    security,
    vendors,
    issues,
    channels,
    widths,
    phys,
    networkTypes,
    annotations,
  };
}

export function vendorQueryMatchesLabel(vendorQuery: string, label: string): boolean {
  const q = vendorQuery.trim().toLowerCase();
  if (!q) return false;
  return q === label.trim().toLowerCase();
}
