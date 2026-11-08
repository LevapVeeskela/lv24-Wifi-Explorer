import { useMemo } from 'react';
import type { ObservedBss } from '@/domain/bss';
import type { GridRowSelectionModel } from '@mui/x-data-grid-pro';
import { observedBssToGridRow, type ScanGridRow } from '@/entities/bss';
import { pinnedColorFor } from '@/features/annotations';
import { resolveColoringColorFromStore, type ColoringRulesConfig } from '@/features/coloring-rules';
import { computeIssueKeysForScan } from '@/features/issues';
import { resolveCompareRows, selectedRowIdsFromModel } from '@/features/bss-compare';
import { scanIssueIdsFromMessageKeys } from '@/domain';
import {
  applyAllFilters,
  hasActiveFilters,
  type ScanWorkbenchFilters,
} from '@/features/scan-filters';
import type { ParseScanQueryResult } from '@/features/scan-search';
import { selectedBssidFromModel } from '@/features/scan-selection';
import { resolveScanGridOverlay } from '@/widgets/ScanDataGrid';
import type { ScanCoreState } from './useScanSession';
import { formatLastScanLabel } from '../lib/formatLastScanLabel';

export type UseWorkbenchRowsOptions = {
  bssList: readonly ObservedBss[];
  connectedBssid: string | null;
  annotations: { textFor: (bssid: string) => string | null };
  pinnedColors: Parameters<typeof pinnedColorFor>[0];
  coloringRules: ColoringRulesConfig;
  filters: ScanWorkbenchFilters;
  parsedSearch: ParseScanQueryResult;
  selectionModel: GridRowSelectionModel;
  locationState: string;
  scanCoreState: ScanCoreState;
  lastCapturedAt: string | null;
  statusTick: number;
};

/**
 * Derives grid rows, issue keys, coloring, selection and status summaries
 * from the raw scan session. Pure memoization; no side effects.
 */
export function useWorkbenchRows({
  bssList,
  connectedBssid,
  annotations,
  pinnedColors,
  coloringRules,
  filters,
  parsedSearch,
  selectionModel,
  locationState,
  scanCoreState,
  lastCapturedAt,
  statusTick,
}: UseWorkbenchRowsOptions) {
  const issueKeysByIndex = useMemo(() => computeIssueKeysForScan(bssList), [bssList]);

  const baseRows = useMemo<ScanGridRow[]>(() => {
    return bssList
      .map((bss, index) => {
        const row = observedBssToGridRow(bss, { connectedBssid });
        if (!row) return null;
        return {
          ...row,
          annotation: annotations.textFor(row.bssid) ?? '',
          issueKeys: issueKeysByIndex.get(String(index)) ?? [],
          seriesColor: pinnedColorFor(pinnedColors, row.bssid) ?? row.seriesColor,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
  }, [annotations, bssList, connectedBssid, issueKeysByIndex, pinnedColors]);

  const coloringCss = useMemo(() => {
    if (!coloringRules.enabled) return '';
    return coloringRules.rules
      .filter((rule) => rule.enabled)
      .map((rule) => {
        const hex = rule.color.replace('#', '');
        return `.lv24-row-${hex}{background-color:${rule.color}22 !important;box-shadow:inset 3px 0 0 ${rule.color} !important;}`;
      })
      .join('\n');
  }, [coloringRules]);

  const rowColorClass = useMemo(() => {
    if (!coloringRules.enabled) return () => null;
    return (row: ScanGridRow): string | null => {
      const color = resolveColoringColorFromStore(row, coloringRules);
      return color ? `lv24-row-${color.replace('#', '')}` : null;
    };
  }, [coloringRules]);

  const issueIdsByRowId = useMemo(
    () =>
      new Map(baseRows.map((row) => [row.id, scanIssueIdsFromMessageKeys(row.issueKeys)] as const)),
    [baseRows]
  );

  const filteredRows = useMemo(
    () => applyAllFilters(baseRows, filters, parsedSearch),
    [baseRows, filters, parsedSearch]
  );

  const selectedBssid = selectedBssidFromModel(selectionModel);

  const selectedRow = useMemo(() => {
    if (selectedBssid == null) return null;
    return filteredRows.find((row) => row.id === selectedBssid) ?? null;
  }, [filteredRows, selectedBssid]);

  const compareRows = useMemo(
    () => resolveCompareRows(filteredRows, selectionModel),
    [filteredRows, selectionModel]
  );

  const connectedRow = useMemo(() => baseRows.find((row) => row.connected) ?? null, [baseRows]);

  const linkSummary = connectedRow
    ? `${connectedRow.rssiDbm} dBm · ${connectedRow.band} GHz · ${connectedRow.channelWidth} MHz`
    : null;

  const overlayKind = resolveScanGridOverlay({
    visibleCount: filteredRows.length,
    totalCount: baseRows.length,
    locationDenied: locationState === 'denied' || locationState === 'restricted',
    demo: scanCoreState === 'demo',
    filtersActive: hasActiveFilters(filters),
  });

  const lastScanLabel = useMemo(() => {
    void statusTick;
    if (lastCapturedAt) return formatLastScanLabel(lastCapturedAt);
    let latest: string | null = null;
    for (const row of baseRows) {
      if (!latest || row.lastSeenAt > latest) latest = row.lastSeenAt;
    }
    return formatLastScanLabel(latest);
  }, [baseRows, lastCapturedAt, statusTick]);

  return {
    baseRows,
    coloringCss,
    compareRows,
    connectedRow,
    filteredRows,
    issueIdsByRowId,
    issueKeysByIndex,
    lastScanLabel,
    linkSummary,
    overlayKind,
    rowColorClass,
    selectedBssid,
    selectedRow,
    selectedRowIds: selectedRowIdsFromModel(selectionModel),
  };
}
