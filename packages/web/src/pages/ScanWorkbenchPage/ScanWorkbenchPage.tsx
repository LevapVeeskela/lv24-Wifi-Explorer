import '@fontsource-variable/manrope';
import '@fontsource-variable/plus-jakarta-sans';
import '@/shared/lib/theme/productFonts.css';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Link, Snackbar } from '@mui/material';
import {
  GridPreferencePanelsValue,
  useGridApiRef,
  type GridApiPro,
  type GridRowSelectionModel,
} from '@mui/x-data-grid-pro';
import { ScanIntlProvider, useScanIntl } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n';
import { ThemePreferenceSync } from '@/shared/ui/ThemePreferenceSync';
import { PaneResizeSeparator } from '@/shared/ui/PaneResizeSeparator';
import {
  openCaptureFile,
  openWorkbenchFile,
  saveWorkbenchFile,
} from '@/shared/lib/files/rendererFileIo';
import { importCapture } from '@pcap';
import { asIsoTime } from '@/scan/identity';
import { mapCoreWlanRecordsToObservedBss } from '@/scan/mapObservedBss';
import { SHARED_OUI_LOOKUP } from '@/features/scan-live';
import {
  getVerticalPaneBounds,
  type VerticalPaneFractions,
} from '@/shared/lib/paneLayout/verticalPaneLayout';
import { DEMO_CONNECTED_BSSID, DEMO_OBSERVED_BSS } from '@/entities/scan';
import { observedBssToGridRow } from '@/entities/bss';
import {
  exportAnnotationCsv,
  importAnnotationCsv,
  loadPinnedColors,
  pinnedColorFor,
  removePinnedColor,
  savePinnedColors,
  setPinnedColor,
  useAnnotations,
} from '@/features/annotations';
import { LocationOnboarding } from '@/features/onboarding';
import { useNativeMenuBridge } from '@/features/menu-bridge';
import { computeIssueKeysForScan } from '@/features/issues';
import { scanIssueIdsFromMessageKeys } from '@/features/scan-issues';
import {
  loadColoringRules,
  resolveColoringColorFromStore,
  saveColoringRules,
  type ColoringRulesConfig,
} from '@/features/coloring-rules';
import type { CsvExportScope } from '@/features/export';
import {
  applyAllFilters,
  hasActiveFilters,
  useScanWorkbenchFilters,
} from '@/features/scan-filters';
import { treeDataPathForOrganize, useScanOrganize } from '@/features/scan-organize';
import { negateScanQuery, useScanSearch } from '@/features/scan-search';
import { useScanShortcuts } from '@/features/scan-shortcuts';
import {
  clampRowSelectionModel,
  resolveCompareRows,
  selectedRowIdsFromModel,
} from '@/features/bss-compare';
import {
  emptyRowSelectionModel,
  rowSelectionModelFromBssid,
  selectedBssidFromModel,
  selectionCount,
} from '@/features/scan-selection';
import { connectedBssidFromPayload, ingestScanPayload } from '@/features/scan-live';
import type { ScanViewModel } from '@/domain/scan';
import type { ObservedBss } from '@/domain/bss';
import {
  ScanSettingsWindow,
  SCAN_GRID_COLUMNS,
  chartUnitToSignalDisplay,
  loadScanSettings,
  signalDisplayToChartUnit,
  useApplyScanSettingsAppearance,
  useScanSettings,
} from '@/features/scan-settings';
import { printVisibleTable, resolvePrintColumns } from '@/features/print-export';
import type { ChartTimescale, SignalChartUnit } from '@/entities/signal';
import { ScanAppBar } from '@/widgets/ScanAppBar';
import { resolveScanGridOverlay, ScanDataGrid, showColumnModel } from '@/widgets/ScanDataGrid';
import { TitleBar } from '@/widgets/TitleBar';
import { BottomDock, type DetailsTab } from '@/widgets/BottomDock';
import { FilterSidebar } from '@/widgets/FilterSidebar';
import { IssuesInspectorProvider } from '@/widgets/IssuesInspector';
import { WorkbenchProfilesMenu } from '@/features/workbench-profiles';
import { StatusBar } from '@/widgets/StatusBar';
import { AboutDialog } from '@/widgets/AboutDialog';
import { LocationBanner } from '@/widgets/LocationBanner';
import { normalizeLocationAuthorization } from '@/widgets/LocationBanner';
import type { LocationAuthorization } from '@/domain/identity';
import { DEFAULT_COLUMN_VISIBILITY } from './columnVisibility';
import {
  scanDockRegionSx,
  scanGridRegionSx,
  scanMainSplitSx,
  scanShellSx,
  scanWorkbenchBodySx,
  skipLinkSx,
} from './styles';
import { t } from './t';
import {
  usePersistedColumnVisibility,
  usePersistedPaneLayout,
  useShellHeight,
} from './usePersistedState';
import {
  buildWorkbenchCsv,
  buildWorkbenchSnapshot,
  collectVisibleColumnIds,
  csvFileName,
  CSV_MIME,
  LV24_SCAN_EXTENSIONS,
  LV24_SCAN_FILE_ACCEPT,
  LV24_SCAN_MIME,
  parseWorkbenchSnapshot,
} from './workbenchIo';
import { locationStateFromSnapshot, scanCoreStateFromSnapshot } from './scanSnapshotLive';

const APP_VERSION = '1.0.0';
const DOCK_COLLAPSED_FRACTION = 0.92;

export type ScanWorkbenchPageProps = {
  locale?: string;
  demoMode?: boolean;
};

function formatLastScanLabel(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '—';
  const deltaSec = Math.round((Date.now() - then) / 1000);
  if (deltaSec < 2) return 'now';
  if (deltaSec < 60) return `${deltaSec}s`;
  if (deltaSec < 3600) return `${Math.round(deltaSec / 60)}m`;
  return `${Math.round(deltaSec / 3600)}h`;
}

function ScanWorkbenchInner({
  demoMode = true,
  locale = 'ru',
}: {
  demoMode?: boolean;
  locale?: string;
}) {
  const apiRef = useGridApiRef<GridApiPro>();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const shellHeight = useShellHeight();
  const [paneLayout, setPaneLayout] = usePersistedPaneLayout();
  const [columnVisibility, setColumnVisibility] =
    usePersistedColumnVisibility(DEFAULT_COLUMN_VISIBILITY);

  const { formatMessage } = useScanIntl();
  const scanSettings = useScanSettings();
  useApplyScanSettingsAppearance(scanSettings.settings.appearanceFollowSystem);
  const [scanSettingsOpen, setScanSettingsOpen] = useState(false);
  const [scanning, setScanning] = useState(
    () => demoMode || loadScanSettings().autoStartScanOnLaunch
  );
  const { filters, onFiltersChange, syncSettingsFields } = useScanWorkbenchFilters(
    scanSettings.settings,
    scanSettings.patchSettings
  );
  const scanSearch = useScanSearch(filters.searchQuery);
  const { organizeBy, setOrganizeBy } = useScanOrganize();
  const [selectionModel, setSelectionModel] = useState(emptyRowSelectionModel);
  const [detailsTab, setDetailsTab] = useState<DetailsTab>('details');
  const chartUnit = signalDisplayToChartUnit(scanSettings.settings.signalUnit);
  const onChartUnitChange = useCallback(
    (unit: SignalChartUnit) => {
      scanSettings.patchSettings({ signalUnit: chartUnitToSignalDisplay(unit) });
    },
    [scanSettings]
  );
  const [timescale, setTimescale] = useState<ChartTimescale>('1m');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [bssList, setBssList] = useState<readonly ObservedBss[]>(() =>
    demoMode ? DEMO_OBSERVED_BSS : []
  );
  const [connectedBssid, setConnectedBssid] = useState<string | null>(() =>
    demoMode ? DEMO_CONNECTED_BSSID : null
  );
  const [locationState, setLocationState] = useState<LocationAuthorization>(() =>
    demoMode ? 'granted' : 'not-determined'
  );
  const [scanCoreState, setScanCoreState] = useState<'ok' | 'error' | 'demo'>(
    demoMode ? 'demo' : 'ok'
  );
  const [lastCapturedAt, setLastCapturedAt] = useState<string | null>(null);
  const [statusTick, setStatusTick] = useState(0);
  const annotations = useAnnotations();
  const [pinnedColors, setPinnedColors] = useState(() => loadPinnedColors());
  const [coloringRules, setColoringRules] = useState<ColoringRulesConfig>(() =>
    loadColoringRules()
  );
  const viewRef = useRef<ScanViewModel | null>(null);

  useEffect(() => {
    if (demoMode) {
      setScanCoreState('demo');
      return;
    }
    // Live mode: do not show synthetic rows before the first real snapshot.
    if (viewRef.current == null) setBssList([]);
  }, [demoMode]);

  useEffect(() => {
    const bridge = window.wifiExplorer;
    if (!bridge) return;
    if (demoMode) {
      // Demo fixtures are a product surface, not a scan preference: show them.
      void bridge.scanStart();
      return;
    }
    const initial = loadScanSettings();
    if (initial.autoStartScanOnLaunch) void bridge.scanStart(initial.directedSsid || undefined);
    else void bridge.scanStop();
  }, [demoMode]);

  useEffect(() => {
    const id = window.setInterval(() => setStatusTick((value) => value + 1), 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const bridge = window.wifiExplorer;
    if (!bridge) return;

    const offSnap = bridge.onScanSnapshot((payload) => {
      const view = ingestScanPayload(viewRef.current, payload);
      viewRef.current = view;
      setBssList(view.bssRows);
      const liveConnected = connectedBssidFromPayload(payload);
      const snapLocation = locationStateFromSnapshot(payload.location);
      if (snapLocation) setLocationState(snapLocation);
      setScanCoreState(scanCoreStateFromSnapshot(payload, demoMode));
      if (typeof payload.capturedAt === 'string') {
        setLastCapturedAt(payload.capturedAt);
      }
      if (payload.demo === true || payload.source === 'fixtures') {
        setConnectedBssid(DEMO_CONNECTED_BSSID);
      } else if (liveConnected) {
        setConnectedBssid(liveConnected);
      }
    });

    return () => {
      offSnap();
    };
  }, [demoMode]);

  useEffect(() => {
    const bridge = window.wifiExplorer;
    if (!bridge) return;

    void bridge.permissionsQuery().then((status) => {
      setLocationState(normalizeLocationAuthorization(status.location));
      if (status.demoMode) setScanCoreState('demo');
    });

    const off = bridge.onPermissionsStatus((status) => {
      setLocationState(normalizeLocationAuthorization(status.location));
      if (status.demoMode) setScanCoreState('demo');
    });
    return () => off();
  }, []);

  const issueKeysByIndex = useMemo(() => computeIssueKeysForScan(bssList), [bssList]);

  const baseRows = useMemo(() => {
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

  const rowColorClass = useCallback(
    (row: (typeof baseRows)[number]): string | null => {
      if (!coloringRules.enabled) return null;
      const color = resolveColoringColorFromStore(row, coloringRules);
      return color ? `lv24-row-${color.replace('#', '')}` : null;
    },
    [coloringRules]
  );

  const onColoringRulesChange = useCallback((next: ColoringRulesConfig) => {
    setColoringRules(next);
    saveColoringRules(next);
  }, []);

  const issueIdsByRowId = useMemo(
    () =>
      new Map(baseRows.map((row) => [row.id, scanIssueIdsFromMessageKeys(row.issueKeys)] as const)),
    [baseRows]
  );

  const filteredRows = useMemo(
    () => applyAllFilters(baseRows, filters, scanSearch.parsed),
    [baseRows, filters, scanSearch.parsed]
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

  const onSelectionModelChange = useCallback((model: GridRowSelectionModel) => {
    setSelectionModel((prev) => clampRowSelectionModel(model, prev));
  }, []);

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

  const paneFractions: VerticalPaneFractions = useMemo(
    () => ({
      top: paneLayout.mainGridFraction,
      bottom: 1 - paneLayout.mainGridFraction,
    }),
    [paneLayout.mainGridFraction]
  );

  const paneBounds = useMemo(
    () => getVerticalPaneBounds(shellHeight - 120, 160, 180),
    [shellHeight]
  );

  const onPaneChange = useCallback(
    (next: VerticalPaneFractions) => {
      setPaneLayout({
        ...paneLayout,
        mainGridFraction: next.top,
      });
    },
    [paneLayout, setPaneLayout]
  );

  const onPaneDoubleClick = useCallback(() => {
    const collapsed = paneLayout.mainGridFraction >= DOCK_COLLAPSED_FRACTION;
    setPaneLayout({
      ...paneLayout,
      mainGridFraction: collapsed ? 0.58 : DOCK_COLLAPSED_FRACTION,
    });
  }, [paneLayout, setPaneLayout]);

  const openColumnsPanel = useCallback(() => {
    apiRef.current?.showPreferences?.(GridPreferencePanelsValue.columns);
  }, [apiRef]);

  const resetColumnVisibility = useCallback(() => {
    setColumnVisibility({ ...DEFAULT_COLUMN_VISIBILITY });
  }, [setColumnVisibility]);

  const hiddenColumnFields = useMemo(
    () =>
      SCAN_GRID_COLUMNS.filter(
        (column) => column.hideable && columnVisibility[column.field] === false
      ).map((column) => column.field),
    [columnVisibility]
  );

  const showColumn = useCallback(
    (field: string) => {
      const next = showColumnModel(columnVisibility, field);
      if (next) setColumnVisibility(next);
    },
    [columnVisibility, setColumnVisibility]
  );

  const onAnnotationsExportCsv = useCallback(
    () => exportAnnotationCsv(annotations.rules),
    [annotations.rules]
  );

  const onAnnotationsImportCsv = useCallback(
    (text: string) => {
      annotations.setRules(importAnnotationCsv(text));
    },
    [annotations]
  );

  const onScanIntervalSecChange = useCallback(
    (sec: number) => {
      scanSettings.patchSettings({ scanIntervalSec: sec });
    },
    [scanSettings]
  );

  const onScanSettingsChange = useCallback(
    (next: typeof scanSettings.settings) => {
      scanSettings.setSettings(next);
      syncSettingsFields(next);
    },
    [scanSettings, syncSettingsFields]
  );

  const toggleScan = useCallback(() => {
    setScanning((value) => {
      const next = !value;
      const bridge = window.wifiExplorer;
      if (bridge) {
        if (next) void bridge.scanStart(scanSettings.settings.directedSsid || undefined);
        else void bridge.scanStop();
      }
      return next;
    });
  }, []);

  const startScan = useCallback(() => {
    setScanning((value) => {
      if (value) return value;
      const bridge = window.wifiExplorer;
      if (bridge) void bridge.scanStart(scanSettings.settings.directedSsid || undefined);
      return true;
    });
  }, [scanSettings.settings.directedSsid]);

  const stopScan = useCallback(() => {
    setScanning((value) => {
      if (!value) return value;
      const bridge = window.wifiExplorer;
      if (bridge) void bridge.scanStop();
      return false;
    });
  }, []);

  const openAbout = useCallback(() => setAboutOpen(true), []);
  const openScanSettings = useCallback(() => setScanSettingsOpen(true), []);

  const commitAnnotation = useCallback(
    (bssid: string, text: string) => {
      const pattern = bssid.trim();
      const trimmed = text.trim();
      const existing = annotations.rules.find(
        (rule) => rule.bssidPattern.trim().toLowerCase() === pattern.toLowerCase()
      );
      if (!trimmed) {
        if (existing) annotations.remove(existing.id);
        return;
      }
      annotations.upsert({
        id: existing?.id,
        bssidPattern: pattern,
        text: trimmed,
      });
    },
    [annotations]
  );

  const printVisible = useCallback(() => {
    const columnIds = collectVisibleColumnIds(apiRef.current, columnVisibility);
    const labelForField = (fieldId: string): string => {
      const def = SCAN_GRID_COLUMNS.find((column) => column.field === fieldId);
      return def ? formatMessage(def.labelKey as MessageKey) : fieldId;
    };
    printVisibleTable({
      productTitle: formatMessage('scan.about.title'),
      rows: filteredRows,
      columns: resolvePrintColumns(columnIds, labelForField),
      signalUnit: scanSettings.settings.signalUnit,
      hiddenSsidLabel: formatMessage('scan.ssid.hidden'),
      networkTypeLabels: {
        ibss: formatMessage('scan.type.ibss'),
        infrastructure: formatMessage('scan.type.infrastructure'),
      },
      formatIssueKey: (key) => formatMessage(key),
    });
  }, [apiRef, columnVisibility, filteredRows, formatMessage, scanSettings.settings.signalUnit]);

  const exportCsv = useCallback(
    (scope: CsvExportScope) => {
      const csv = buildWorkbenchCsv({
        scope,
        allRows: baseRows,
        visibleRows: filteredRows,
        selectedIds: selectedRowIdsFromModel(selectionModel),
        visibleColumnIds: collectVisibleColumnIds(apiRef.current, columnVisibility),
      });
      void saveWorkbenchFile({
        defaultPath: csvFileName(scope),
        contents: csv.text,
        mimeType: CSV_MIME,
      });
    },
    [apiRef, baseRows, columnVisibility, filteredRows, selectionModel]
  );

  const saveSnapshot = useCallback(() => {
    const snapshot = buildWorkbenchSnapshot({
      networks: bssList,
      annotations: annotations.rules,
      appVersion: APP_VERSION,
      location: locationState,
      pinnedColors,
    });
    void saveWorkbenchFile({
      defaultPath: snapshot.fileName,
      contents: snapshot.text,
      mimeType: LV24_SCAN_MIME,
    });
  }, [annotations.rules, bssList, locationState, pinnedColors]);

  const openSnapshot = useCallback(async () => {
    const picked = await openWorkbenchFile({
      accept: LV24_SCAN_FILE_ACCEPT,
      extensions: LV24_SCAN_EXTENSIONS,
    });
    if (picked.canceled) return;
    const parsed = parseWorkbenchSnapshot(picked.text, picked.name);
    if (!parsed.ok) {
      setFileError(t('scan.snapshot.openError', { detail: parsed.error }));
      return;
    }
    setBssList(parsed.document.networks);
    annotations.setRules(parsed.document.annotations);
    setPinnedColors(parsed.document.pinnedColors);
    const snapLocation = parsed.document.metadata.location;
    if (snapLocation) {
      setLocationState(normalizeLocationAuthorization(snapLocation));
    }
    setLastCapturedAt(parsed.document.metadata.capturedAt);
    setScanCoreState('ok');
    setScanning(false);
    viewRef.current = null;
    const bridge = window.wifiExplorer;
    if (bridge) void bridge.scanStop();
  }, [annotations]);

  const importPcapCapture = useCallback(async () => {
    const picked = await openCaptureFile({ accept: '.pcap,.pcapng,application/vnd.tcpdump.pcap' });
    if (picked.canceled) {
      if (picked.error === 'file-too-large')
        setFileError(t('scan.snapshot.openError', { detail: 'file too large' }));
      return;
    }
    const parsed = importCapture(picked.bytes);
    if (parsed.records.length === 0) {
      setFileError(t('scan.snapshot.openError', { detail: parsed.warnings[0] ?? 'no beacons' }));
      return;
    }
    const capturedAt = new Date().toISOString();
    setBssList(
      mapCoreWlanRecordsToObservedBss(parsed.records, undefined, asIsoTime(capturedAt), {
        location: 'granted',
        ouiLookup: SHARED_OUI_LOOKUP,
      })
    );
    viewRef.current = null;
    setLastCapturedAt(capturedAt);
    setScanCoreState('ok');
    setScanning(false);
    window.wifiExplorer?.scanStop();
    if (parsed.warnings.length > 0) {
      setFileError(`Imported ${parsed.records.length} BSS (${parsed.warnings.length} warnings)`);
    }
  }, []);

  const clearSearch = useCallback(() => {
    onFiltersChange({ ...filters, searchQuery: '' });
  }, [filters, onFiltersChange]);

  const applySearchQuery = useCallback(
    (query: string) => {
      onFiltersChange({ ...filters, searchQuery: query });
    },
    [filters, onFiltersChange]
  );

  const applyNegatedSearchQuery = useCallback(
    (query: string) => {
      onFiltersChange({ ...filters, searchQuery: negateScanQuery(query) });
    },
    [filters, onFiltersChange]
  );

  const setMinRssi = useCallback(
    (dbm: number) => {
      onFiltersChange({ ...filters, minRssiDbm: dbm });
    },
    [filters, onFiltersChange]
  );

  useScanShortcuts({
    searchInputRef: searchRef,
    gridContainerRef,
    selectedBssid: selectedRow?.bssid ?? null,
    onClearSearch: clearSearch,
    onStartScan: startScan,
    onStopScan: stopScan,
    onDetailsTabChange: setDetailsTab,
    onSaveSnapshot: saveSnapshot,
    onOpenSnapshot: openSnapshot,
    onSetMinRssi: setMinRssi,
  });

  useNativeMenuBridge({
    onOpenSnapshot: () => void openSnapshot(),
    onImportPcap: () => void importPcapCapture(),
    onSaveSnapshot: saveSnapshot,
    onExportCsv: exportCsv,
    onPrintVisible: printVisible,
    onOpenSettings: openScanSettings,
    onAbout: openAbout,
  });

  return (
    <Box sx={scanShellSx}>
      <ThemePreferenceSync followSystem={scanSettings.settings.appearanceFollowSystem} />
      <Link href="#scan-grid" sx={skipLinkSx}>
        {t('scan.a11y.skipToGrid')}
      </Link>
      <Link href="#scan-dock" sx={skipLinkSx}>
        {t('scan.a11y.skipToDetails')}
      </Link>
      <TitleBar
        connectedSsid={connectedRow?.ssidHidden ? null : (connectedRow?.ssid ?? null)}
        demoMode={scanCoreState === 'demo'}
        exportSelectedDisabled={selectionCount(selectionModel) === 0}
        linkSummary={linkSummary}
        scanning={scanning}
        onAbout={openAbout}
        onExportCsv={exportCsv}
        onPrintVisible={printVisible}
        onImportPcap={() => void importPcapCapture()}
        onOpenSnapshot={() => void openSnapshot()}
        onSaveSnapshot={saveSnapshot}
        onToggleScan={toggleScan}
        profilesMenu={
          <WorkbenchProfilesMenu
            state={{
              columnVisibility,
              filters,
              organizeBy,
              scanIntervalSec: scanSettings.settings.scanIntervalSec,
            }}
            onApply={(patch) => {
              setColumnVisibility(patch.columnVisibility);
              onFiltersChange(patch.filters);
              setOrganizeBy(patch.organizeBy);
              if (patch.scanIntervalSec != null) {
                scanSettings.patchSettings({ scanIntervalSec: patch.scanIntervalSec });
              }
            }}
          />
        }
      />
      <ScanAppBar
        exportSelectedDisabled={selectionCount(selectionModel) === 0}
        filters={filters}
        scanIntervalSec={scanSettings.settings.scanIntervalSec}
        searchInputRef={searchRef}
        onExportCsv={exportCsv}
        onFiltersChange={onFiltersChange}
        onOpenColumnsPanel={openColumnsPanel}
        onOpenSettings={() => setScanSettingsOpen(true)}
        onOrganizeByChange={setOrganizeBy}
        onScanIntervalSecChange={onScanIntervalSecChange}
        organizeBy={organizeBy}
      />
      <LocationOnboarding
        demoMode={scanCoreState === 'demo'}
        location={locationState}
        onContinue={() => {
          if (!scanning) toggleScan();
        }}
      />
      <LocationBanner demoMode={scanCoreState === 'demo'} location={locationState} />
      <Box sx={scanWorkbenchBodySx}>
        <FilterSidebar filters={filters} rows={baseRows} onFiltersChange={onFiltersChange} />
        <Box sx={scanMainSplitSx}>
          <Box ref={gridContainerRef} id="scan-grid" sx={scanGridRegionSx(paneFractions.top)}>
            <ScanDataGrid
              apiRef={apiRef}
              columnVisibilityModel={columnVisibility}
              hiddenColumnFields={hiddenColumnFields}
              locale={locale}
              overlayKind={overlayKind}
              rows={filteredRows}
              selectionModel={selectionModel}
              getTreeDataPath={treeDataPathForOrganize(organizeBy)}
              signalUnit={scanSettings.settings.signalUnit}
              onAnnotationChange={commitAnnotation}
              onApplyFilter={applySearchQuery}
              onApplyFilterNegate={applyNegatedSearchQuery}
              onColumnVisibilityModelChange={setColumnVisibility}
              onSelectionModelChange={onSelectionModelChange}
              onShowColumn={showColumn}
              rowColorClass={rowColorClass}
            />
            <style>{coloringCss}</style>
          </Box>
          <PaneResizeSeparator
            bounds={paneBounds}
            fractions={paneFractions}
            label={t('scan.a11y.splitterMain')}
            orientation="horizontal"
            onChange={onPaneChange}
            onDoubleClick={onPaneDoubleClick}
          />
          <Box id="scan-dock" sx={scanDockRegionSx(paneFractions.bottom)}>
            <IssuesInspectorProvider
              value={{
                rows: filteredRows,
                issueIdsByRowId,
                selectedBssid,
                onSelectBssid: (bssid) => {
                  setSelectionModel(rowSelectionModelFromBssid(bssid));
                  setDetailsTab('issues');
                },
              }}
            >
              <BottomDock
                allBss={bssList}
                chartUnit={chartUnit}
                compareRows={compareRows}
                graphLabelMode={scanSettings.settings.graphLabelMode}
                hideEmptySpectrumBand={scanSettings.settings.hideEmptySpectrumBand}
                selectedRow={selectedRow}
                tab={detailsTab}
                timescale={timescale}
                onChartUnitChange={onChartUnitChange}
                onTabChange={setDetailsTab}
                onTimescaleChange={setTimescale}
                pinnedColor={selectedRow ? pinnedColorFor(pinnedColors, selectedRow.bssid) : null}
                onPinColor={(color) => {
                  if (!selectedRow) return;
                  const next =
                    color == null
                      ? removePinnedColor(pinnedColors, selectedRow.bssid)
                      : setPinnedColor(pinnedColors, selectedRow.bssid, color);
                  if (next) {
                    setPinnedColors(next);
                    savePinnedColors(next);
                  }
                }}
              />
            </IssuesInspectorProvider>
          </Box>
        </Box>
      </Box>
      <StatusBar
        lastScanLabel={lastScanLabel}
        locationState={locationState}
        networksFound={baseRows.length}
        displayedCount={filteredRows.length}
        annotationCount={annotations.rules.length}
        signalQuality={selectedRow?.signalQuality ?? null}
        scanCoreState={scanCoreState}
        selectedCount={selectionCount(selectionModel)}
        version={APP_VERSION}
        onAbout={openAbout}
      />
      <AboutDialog open={aboutOpen} version={APP_VERSION} onClose={() => setAboutOpen(false)} />
      <ScanSettingsWindow
        annotations={annotations.rules}
        columnVisibility={columnVisibility}
        coloringRules={coloringRules}
        onColoringRulesChange={onColoringRulesChange}
        open={scanSettingsOpen}
        settings={scanSettings.settings}
        onAnnotationRemove={annotations.remove}
        onAnnotationUpsert={annotations.upsert}
        onAnnotationsExportCsv={onAnnotationsExportCsv}
        onAnnotationsImportCsv={onAnnotationsImportCsv}
        onClose={() => setScanSettingsOpen(false)}
        onColumnVisibilityChange={setColumnVisibility}
        onResetColumns={resetColumnVisibility}
        onSettingsChange={onScanSettingsChange}
      />
      <Snackbar
        autoHideDuration={6000}
        message={fileError ?? ''}
        open={Boolean(fileError)}
        onClose={() => setFileError(null)}
      />
    </Box>
  );
}

export function ScanWorkbenchPage({ locale = 'ru', demoMode = true }: ScanWorkbenchPageProps) {
  return (
    <>
      <ScanIntlProvider locale={locale}>
        <ScanWorkbenchInner demoMode={demoMode} locale={locale} />
      </ScanIntlProvider>
    </>
  );
}
