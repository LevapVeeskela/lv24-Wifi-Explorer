import '@fontsource-variable/manrope';
import '@fontsource-variable/plus-jakarta-sans';
import '@/shared/lib/theme/productFonts.css';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Link, Snackbar } from '@mui/material';
import {
  GridPreferencePanelsValue,
  useGridApiRef,
  type GridApiPro,
  type GridRowSelectionModel,
} from '@mui/x-data-grid-pro';
import { ScanIntlProvider, useScanIntl } from '@/shared/i18n';
import { ThemePreferenceSync } from '@/shared/ui/ThemePreferenceSync';
import { PaneResizeSeparator } from '@/shared/ui/PaneResizeSeparator';
import {
  getVerticalPaneBounds,
  type VerticalPaneFractions,
} from '@/shared/lib/paneLayout/verticalPaneLayout';
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
import {
  loadColoringRules,
  saveColoringRules,
  type ColoringRulesConfig,
} from '@/features/coloring-rules';
import { useScanWorkbenchFilters } from '@/features/scan-filters';
import { treeDataPathForOrganize, useScanOrganize } from '@/features/scan-organize';
import { negateScanQuery, useScanSearch } from '@/features/scan-search';
import { useScanShortcuts } from '@/features/scan-shortcuts';
import { clampRowSelectionModel } from '@/features/bss-compare';
import {
  emptyRowSelectionModel,
  rowSelectionModelFromBssid,
  selectionCount,
} from '@/features/scan-selection';
import {
  ScanSettingsWindow,
  SCAN_GRID_COLUMNS,
  chartUnitToSignalDisplay,
  signalDisplayToChartUnit,
  useApplyScanSettingsAppearance,
  useScanSettings,
} from '@/features/scan-settings';
import type { ChartTimescale, SignalChartUnit } from '@/entities/signal';
import { ScanAppBar } from '@/widgets/ScanAppBar';
import { ScanDataGrid, showColumnModel } from '@/widgets/ScanDataGrid';
import { TitleBar } from '@/widgets/TitleBar';
import { BottomDock, type DetailsTab } from '@/widgets/BottomDock';
import { FilterSidebar } from '@/widgets/FilterSidebar';
import { IssuesInspectorProvider } from '@/widgets/IssuesInspector';
import { WorkbenchProfilesMenu } from '@/features/workbench-profiles';
import { StatusBar } from '@/widgets/StatusBar';
import { AboutDialog } from '@/widgets/AboutDialog';
import { LocationBanner } from '@/widgets/LocationBanner';
import { DEFAULT_COLUMN_VISIBILITY } from '@/entities/columns';
import {
  scanDockRegionSx,
  scanGridRegionSx,
  scanMainSplitSx,
  scanShellSx,
  scanWorkbenchBodySx,
  skipLinkSx,
} from './styles';
import {
  usePersistedColumnVisibility,
  usePersistedPaneLayout,
  useShellHeight,
} from './usePersistedState';
import {
  APP_VERSION,
  DOCK_COLLAPSED_FRACTION,
  PANE_CHROME_HEIGHT,
  PANE_MIN_BOTTOM,
  PANE_MIN_TOP,
} from './lib/constants';
import { useScanSession } from './model/useScanSession';
import { useWorkbenchIo } from './model/useWorkbenchIo';
import { useWorkbenchRows } from './model/useWorkbenchRows';

export type ScanWorkbenchPageProps = {
  locale?: string;
  demoMode?: boolean;
};

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
  const [columnVisibility, setColumnVisibility] = usePersistedColumnVisibility();

  const { formatMessage } = useScanIntl();
  const scanSettings = useScanSettings();
  useApplyScanSettingsAppearance(scanSettings.settings.appearanceFollowSystem);
  const [scanSettingsOpen, setScanSettingsOpen] = useState(false);
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
  const annotations = useAnnotations();
  const [pinnedColors, setPinnedColors] = useState(() => loadPinnedColors());
  const [coloringRules, setColoringRules] = useState<ColoringRulesConfig>(() =>
    loadColoringRules()
  );

  const {
    bssList,
    setBssList,
    connectedBssid,
    locationState,
    setLocationState,
    scanCoreState,
    setScanCoreState,
    lastCapturedAt,
    setLastCapturedAt,
    statusTick,
    scanning,
    setScanning,
    toggleScan,
    startScan,
    stopScan,
    viewRef,
  } = useScanSession({
    demoMode,
    directedSsid: scanSettings.settings.directedSsid,
  });

  const {
    baseRows,
    coloringCss,
    compareRows,
    connectedRow,
    filteredRows,
    issueIdsByRowId,
    lastScanLabel,
    linkSummary,
    overlayKind,
    rowColorClass,
    selectedBssid,
    selectedRow,
  } = useWorkbenchRows({
    bssList,
    connectedBssid,
    annotations,
    pinnedColors,
    coloringRules,
    filters,
    parsedSearch: scanSearch.parsed,
    selectionModel,
    locationState,
    scanCoreState,
    lastCapturedAt,
    statusTick,
  });

  const { exportCsv, importPcapCapture, openSnapshot, printVisible, saveSnapshot } = useWorkbenchIo(
    {
      apiRef,
      baseRows,
      filteredRows,
      bssList,
      selectionModel,
      columnVisibility,
      gridColumns: SCAN_GRID_COLUMNS,
      annotationRules: annotations.rules,
      setAnnotationRules: annotations.setRules,
      pinnedColors,
      setPinnedColors,
      locationState,
      setLocationState,
      signalUnit: scanSettings.settings.signalUnit,
      formatMessage,
      setBssList,
      setLastCapturedAt,
      setScanCoreState,
      setScanning,
      setFileError,
      viewRef,
    }
  );

  const onColoringRulesChange = useCallback((next: ColoringRulesConfig) => {
    setColoringRules(next);
    saveColoringRules(next);
  }, []);

  const onSelectionModelChange = useCallback((model: GridRowSelectionModel) => {
    setSelectionModel((prev) => clampRowSelectionModel(model, prev));
  }, []);

  const paneFractions: VerticalPaneFractions = useMemo(
    () => ({
      top: paneLayout.mainGridFraction,
      bottom: 1 - paneLayout.mainGridFraction,
    }),
    [paneLayout.mainGridFraction]
  );

  const paneBounds = useMemo(
    () => getVerticalPaneBounds(shellHeight - PANE_CHROME_HEIGHT, PANE_MIN_TOP, PANE_MIN_BOTTOM),
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

  const setMinRssi = useCallback(
    (dbm: number) => {
      onFiltersChange({ ...filters, minRssiDbm: dbm });
    },
    [filters, onFiltersChange]
  );

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
        {formatMessage('scan.a11y.skipToGrid')}
      </Link>
      <Link href="#scan-dock" sx={skipLinkSx}>
        {formatMessage('scan.a11y.skipToDetails')}
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
            label={formatMessage('scan.a11y.splitterMain')}
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
