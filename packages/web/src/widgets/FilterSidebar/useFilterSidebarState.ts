import { useMemo } from 'react';
import type { ScanGridRow } from '@/entities/bss';
import type { ScanIssueId } from '@/features/scan-issues';
import {
  FILTER_DEFAULTS,
  type BandFilterValue,
  type NetworkTypeFilterValue,
  type ScanWorkbenchFilters,
  type SecurityFilterValue,
  type WidthFilterValue,
} from '@/features/scan-filters';
import { buildAutoFilterFacets, vendorQueryMatchesLabel } from './buildAutoFilterFacets';
import { useFilterSidebarCollapsed } from './useFilterSidebarCollapsed';

export type UseFilterSidebarStateArgs = {
  rows: readonly ScanGridRow[];
  filters: ScanWorkbenchFilters;
  onFiltersChange: (next: ScanWorkbenchFilters) => void;
};

function toggleSecurity(
  current: SecurityFilterValue[],
  id: SecurityFilterValue
): SecurityFilterValue[] {
  if (current.includes(id)) {
    return current.filter((value) => value !== id);
  }
  return [...current, id];
}

export function useFilterSidebarState({
  rows,
  filters,
  onFiltersChange,
}: UseFilterSidebarStateArgs) {
  const [collapsed, setCollapsed] = useFilterSidebarCollapsed();
  const facets = useMemo(() => buildAutoFilterFacets(rows), [rows]);

  const sidebarFiltersActive =
    filters.band !== 'all' ||
    filters.security.length > 0 ||
    filters.vendorQuery.trim().length > 0 ||
    (filters.issueIds?.length ?? 0) > 0 ||
    filters.channel != null ||
    filters.widthMhz != null ||
    (filters.phy ?? '').length > 0 ||
    filters.networkType != null ||
    filters.annotatedOnly === true ||
    filters.selectedOnly === true;

  const activeIssueIds = filters.issueIds ?? [];
  const annotatedFacet = facets.annotations.find((facet) => facet.id === 'annotated');

  const onBandChip = (band: Exclude<BandFilterValue, 'all'>) => {
    onFiltersChange({
      ...filters,
      band: filters.band === band ? 'all' : band,
    });
  };

  const onSecurityChip = (id: SecurityFilterValue) => {
    onFiltersChange({
      ...filters,
      security: toggleSecurity(filters.security, id),
    });
  };

  const onVendorChip = (label: string) => {
    const active = vendorQueryMatchesLabel(filters.vendorQuery, label);
    onFiltersChange({
      ...filters,
      vendorQuery: active ? '' : label,
    });
  };

  const onIssueChip = (id: ScanIssueId) => {
    onFiltersChange({
      ...filters,
      issueIds: activeIssueIds.includes(id)
        ? activeIssueIds.filter((value) => value !== id)
        : [...activeIssueIds, id],
    });
  };

  const toggleChannel = (channel: number) => {
    onFiltersChange({ ...filters, channel: filters.channel === channel ? null : channel });
  };

  const toggleWidth = (widthMhz: WidthFilterValue) => {
    onFiltersChange({ ...filters, widthMhz: filters.widthMhz === widthMhz ? null : widthMhz });
  };

  const togglePhy = (phy: string) => {
    onFiltersChange({ ...filters, phy: filters.phy === phy ? null : phy });
  };

  const toggleNetworkType = (networkType: NetworkTypeFilterValue) => {
    onFiltersChange({
      ...filters,
      networkType: filters.networkType === networkType ? null : networkType,
    });
  };

  const toggleAnnotatedOnly = () => {
    onFiltersChange({ ...filters, annotatedOnly: !filters.annotatedOnly });
  };

  const onSelectedOnlyChange = (checked: boolean) => {
    onFiltersChange({ ...filters, selectedOnly: checked });
  };

  const clearSidebarFilters = () => {
    onFiltersChange({
      ...filters,
      band: FILTER_DEFAULTS.band,
      security: [...FILTER_DEFAULTS.security],
      vendorQuery: FILTER_DEFAULTS.vendorQuery,
      issueIds: [],
      channel: null,
      widthMhz: null,
      phy: null,
      networkType: null,
      annotatedOnly: false,
      selectedOnly: false,
    });
  };

  return {
    collapsed,
    setCollapsed,
    facets,
    sidebarFiltersActive,
    activeIssueIds,
    annotatedFacet,
    onBandChip,
    onSecurityChip,
    onVendorChip,
    onIssueChip,
    toggleChannel,
    toggleWidth,
    togglePhy,
    toggleNetworkType,
    toggleAnnotatedOnly,
    onSelectedOnlyChange,
    clearSidebarFilters,
  };
}
