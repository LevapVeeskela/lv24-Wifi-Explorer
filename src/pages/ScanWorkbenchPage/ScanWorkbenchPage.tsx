import '@fontsource-variable/manrope';
import '@fontsource-variable/plus-jakarta-sans';
import '@/shared/lib/theme/productFonts.css';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Link, Snackbar } from '@mui/material';
import { GridPreferencePanelsValue, useGridApiRef, type GridApiPro } from '@mui/x-data-grid-pro';
import { ScanIntlProvider } from '@/shared/i18n/ScanIntlProvider';
import { ThemePreferenceSync } from '@/shared/ui/ThemePreferenceSync';
import { PaneResizeSeparator } from '@/shared/ui/PaneResizeSeparator';
import { openWorkbenchFile, saveWorkbenchFile } from '@/shared/lib/files/rendererFileIo';
import {
  getVerticalPaneBounds,
  type VerticalPaneFractions,
} from '@/shared/lib/paneLayout/verticalPaneLayout';
import { DEMO_CONNECTED_BSSID, DEMO_OBSERVED_BSS } from '@/entities/scan/demoNetworks';
import { observedBssToGridRow } from '@/entities/bss/scanGridRow';
import { useAnnotations } from '@/features/annotations';
import { computeIssueKeys } from '@/features/issues/computeIssueKeys';
import type { CsvExportScope } from '@/features/export';
import {
  applyAllFilters,
  FILTER_DEFAULTS,
  hasActiveFilters,
} from '@/features/scan-filters';
import { useScanSearch } from '@/features/scan-search';
import {
  rowSelectionModelFromBssid,
  selectedBssidFromModel,
} from '@/features/scan-selection';
import {
  connectedBssidFromPayload,
  ingestScanPayload,
} from '@/features/scan-live/ingestSnapshot';
import type { ScanViewModel } from '@/domain/scan';
import type { ObservedBss } from '@/domain/bss';
import type { ChartTimescale, SignalChartUnit } from '@/features/signal-history/types';
import { ScanAppBar } from '@/widgets/ScanAppBar';
import { resolveScanGridOverlay, ScanDataGrid } from '@/widgets/ScanDataGrid';
import { TitleBar } from '@/widgets/TitleBar';
import { BottomDock, type DetailsTab } from '@/widgets/BottomDock';
import { StatusBar } from '@/widgets/StatusBar';
import { AboutDialog } from '@/widgets/AboutDialog';
import { DEFAULT_COLUMN_VISIBILITY } from './columnVisibility';
import {
  scanDockRegionSx,
  scanGridRegionSx,
  scanMainSplitSx,
  scanShellSx,
  skipLinkSx,
} from './styles';
import { t } from './t';
import { usePersistedColumnVisibility, usePersistedPaneLayout, useShellHeight } from './usePersistedState';
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

const APP_VERSION = '0.1.0';
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
  const shellHeight = useShellHeight();
  const [paneLayout, setPaneLayout] = usePersistedPaneLayout();
  const [columnVisibility, setColumnVisibility] = usePersistedColumnVisibility(
    DEFAULT_COLUMN_VISIBILITY,
  );

  const [scanning, setScanning] = useState(true);
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const scanSearch = useScanSearch(filters.searchQuery);
  const [selectedBssid, setSelectedBssid] = useState<string | null>(null);
  const [detailsTab, setDetailsTab] = useState<DetailsTab>('details');
  const [chartUnit, setChartUnit] = useState<SignalChartUnit>('pct');
  const [timescale, setTimescale] = useState<ChartTimescale>('1m');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [bssList, setBssList] = useState<readonly ObservedBss[]>(DEMO_OBSERVED_BSS);
  const [connectedBssid, setConnectedBssid] = useState(DEMO_CONNECTED_BSSID);
  const [locationState, setLocationState] = useState<'granted' | 'denied'>('granted');
  const [scanCoreState, setScanCoreState] = useState<'ok' | 'error' | 'demo'>(
    demoMode ? 'demo' : 'ok',
  );
  const annotations = useAnnotations();
  const viewRef = useRef<ScanViewModel | null>(null);

  useEffect(() => {
    const bridge = window.wifiExplorer;
    if (!bridge) return;

    const offSnap = bridge.onScanSnapshot((payload) => {
      const view = ingestScanPayload(viewRef.current, payload);
      viewRef.current = view;
      setBssList(view.bssRows);
      const liveConnected = connectedBssidFromPayload(payload);
      if (payload.demo === true || payload.source === 'fixtures') {
        setScanCoreState('demo');
        setConnectedBssid(DEMO_CONNECTED_BSSID);
      } else {
        setScanCoreState('ok');
        if (liveConnected) setConnectedBssid(liveConnected);
      }
    });

    return () => {
      offSnap();
    };
  }, []);

  useEffect(() => {
    const bridge = window.wifiExplorer;
    if (!bridge) return;
    const off = bridge.onPermissionsStatus((status) => {
      setLocationState(status.location === 'granted' ? 'granted' : 'denied');
      if (status.demoMode) setScanCoreState('demo');
    });
    return () => off();
  }, []);

  const baseRows = useMemo(() => {
    return bssList
      .map((bss) => {
        const row = observedBssToGridRow(bss, { connectedBssid });
        if (!row) return null;
        return {
          ...row,
          annotation: annotations.textFor(row.bssid) ?? '',
          issueKeys: computeIssueKeys(bss, bssList),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
  }, [annotations, bssList, connectedBssid]);

  const filteredRows = useMemo(
    () => applyAllFilters(baseRows, filters, scanSearch.parsed),
    [baseRows, filters, scanSearch.parsed],
  );

  const selectionModel = useMemo(
    () => rowSelectionModelFromBssid(selectedBssid),
    [selectedBssid],
  );

  const selectedRow = useMemo(() => {
    if (selectedBssid == null) return null;
    return filteredRows.find((row) => row.id === selectedBssid) ?? null;
  }, [filteredRows, selectedBssid]);

  const connectedRow = useMemo(
    () => baseRows.find((row) => row.connected) ?? null,
    [baseRows],
  );

  const linkSummary = connectedRow
    ? `${connectedRow.rssiDbm} dBm · ${connectedRow.band} GHz · ${connectedRow.channelWidth} MHz`
    : null;

  const overlayKind = resolveScanGridOverlay({
    visibleCount: filteredRows.length,
    totalCount: baseRows.length,
    locationDenied: locationState === 'denied',
    demo: scanCoreState === 'demo',
    filtersActive: hasActiveFilters(filters),
  });

  const lastScanLabel = useMemo(() => {
    let latest: string | null = null;
    for (const row of baseRows) {
      if (!latest || row.lastSeenAt > latest) latest = row.lastSeenAt;
    }
    return formatLastScanLabel(latest);
  }, [baseRows]);

  const paneFractions: VerticalPaneFractions = useMemo(
    () => ({
      top: paneLayout.mainGridFraction,
      bottom: 1 - paneLayout.mainGridFraction,
    }),
    [paneLayout.mainGridFraction],
  );

  const paneBounds = useMemo(
    () => getVerticalPaneBounds(shellHeight - 120, 160, 180),
    [shellHeight],
  );

  const onPaneChange = useCallback(
    (next: VerticalPaneFractions) => {
      setPaneLayout({
        ...paneLayout,
        mainGridFraction: next.top,
      });
    },
    [paneLayout, setPaneLayout],
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

  const toggleScan = useCallback(() => {
    setScanning((value) => {
      const next = !value;
      const bridge = window.wifiExplorer;
      if (bridge) {
        if (next) void bridge.scanStart();
        else void bridge.scanStop();
      }
      return next;
    });
  }, []);

  const openAbout = useCallback(() => setAboutOpen(true), []);

  const commitAnnotation = useCallback(
    (bssid: string, text: string) => {
      const pattern = bssid.trim();
      const trimmed = text.trim();
      const existing = annotations.rules.find(
        (rule) => rule.bssidPattern.trim().toLowerCase() === pattern.toLowerCase(),
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
    [annotations],
  );

  const exportCsv = useCallback(
    (scope: CsvExportScope) => {
      const csv = buildWorkbenchCsv({
        scope,
        allRows: baseRows,
        visibleRows: filteredRows,
        selectedIds: selectedBssid ? [selectedBssid] : [],
        visibleColumnIds: collectVisibleColumnIds(apiRef.current, columnVisibility),
      });
      void saveWorkbenchFile({
        defaultPath: csvFileName(scope),
        contents: csv.text,
        mimeType: CSV_MIME,
      });
    },
    [apiRef, baseRows, columnVisibility, filteredRows, selectedBssid],
  );

  const saveSnapshot = useCallback(() => {
    const snapshot = buildWorkbenchSnapshot({
      networks: bssList,
      annotations: annotations.rules,
      appVersion: APP_VERSION,
      location: locationState,
    });
    void saveWorkbenchFile({
      defaultPath: snapshot.fileName,
      contents: snapshot.text,
      mimeType: LV24_SCAN_MIME,
    });
  }, [annotations.rules, bssList, locationState]);

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
    const snapLocation = parsed.document.metadata.location;
    if (snapLocation === 'granted' || snapLocation === 'denied') {
      setLocationState(snapLocation);
    }
    setScanning(false);
    viewRef.current = null;
    const bridge = window.wifiExplorer;
    if (bridge) void bridge.scanStop();
  }, [annotations]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        setFilters((prev) => ({ ...prev, searchQuery: '' }));
      }
      if (mod && event.key === 'p') {
        event.preventDefault();
        toggleScan();
      }
      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveSnapshot();
      }
      if (mod && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        void openSnapshot();
      }
      if (mod && event.key === 'c') {
        const active = document.activeElement;
        if (active && searchRef.current && searchRef.current.contains(active)) return;
        if (selectedRow?.bssid) {
          event.preventDefault();
          void navigator.clipboard?.writeText(selectedRow.bssid);
        }
      }
      if (mod && event.key === '1') setDetailsTab('details');
      if (mod && event.key === '2') setDetailsTab('signal');
      if (mod && event.key === '3') setDetailsTab('occupancy');
      if (mod && event.key === '4') setDetailsTab('advanced');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSnapshot, saveSnapshot, selectedRow, toggleScan]);

  return (
    <Box sx={scanShellSx}>
      <Link href="#scan-grid" sx={skipLinkSx}>
        {t('scan.a11y.skipToGrid')}
      </Link>
      <Link href="#scan-dock" sx={skipLinkSx}>
        {t('scan.a11y.skipToDetails')}
      </Link>
      <TitleBar
        connectedSsid={connectedRow?.ssidHidden ? null : (connectedRow?.ssid ?? null)}
        demoMode={scanCoreState === 'demo'}
        exportSelectedDisabled={!selectedBssid}
        linkSummary={linkSummary}
        scanning={scanning}
        onAbout={openAbout}
        onExportCsv={exportCsv}
        onOpenSnapshot={() => void openSnapshot()}
        onSaveSnapshot={saveSnapshot}
        onToggleScan={toggleScan}
      />
      <ScanAppBar
        exportSelectedDisabled={!selectedBssid}
        filters={filters}
        searchInputRef={searchRef}
        onExportCsv={exportCsv}
        onFiltersChange={setFilters}
        onOpenColumnsPanel={openColumnsPanel}
      />
      <Box sx={scanMainSplitSx}>
        <Box id="scan-grid" sx={scanGridRegionSx(paneFractions.top)}>
          <ScanDataGrid
            apiRef={apiRef}
            columnVisibilityModel={columnVisibility}
            locale={locale}
            overlayKind={overlayKind}
            rows={filteredRows}
            selectionModel={selectionModel}
            onAnnotationChange={commitAnnotation}
            onColumnVisibilityModelChange={setColumnVisibility}
            onSelectionModelChange={(model) => setSelectedBssid(selectedBssidFromModel(model))}
          />
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
          <BottomDock
            allBss={bssList}
            chartUnit={chartUnit}
            selectedRow={selectedRow}
            tab={detailsTab}
            timescale={timescale}
            onChartUnitChange={setChartUnit}
            onTabChange={setDetailsTab}
            onTimescaleChange={setTimescale}
          />
        </Box>
      </Box>
      <StatusBar
        lastScanLabel={lastScanLabel}
        locationState={locationState}
        networksFound={filteredRows.length}
        scanCoreState={scanCoreState}
        selectedCount={selectedBssid ? 1 : 0}
        version={APP_VERSION}
        onAbout={openAbout}
      />
      <AboutDialog open={aboutOpen} version={APP_VERSION} onClose={() => setAboutOpen(false)} />
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
      <ThemePreferenceSync />
      <ScanIntlProvider locale={locale}>
        <ScanWorkbenchInner demoMode={demoMode} locale={locale} />
      </ScanIntlProvider>
    </>
  );
}
