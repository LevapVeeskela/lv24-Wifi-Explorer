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
import { useNativeMenuBridge } from '@/features/menu-bridge/useNativeMenuBridge';
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
import type { ScanSnapshotIpcPayload } from '@/shared/ipc/scanIpc';
import type { ScanViewModel } from '@/domain/scan';
import type { ObservedBss } from '@/domain/bss';
import {
  ScanSettingsDialog,
  chartUnitToSignalDisplay,
  loadScanSettings,
  signalDisplayToChartUnit,
  useScanSettings,
} from '@/features/scan-settings';
import type { ChartTimescale, SignalChartUnit } from '@/features/signal-history/types';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';
import { ScanAppBar } from '@/widgets/ScanAppBar';
import { resolveScanGridOverlay, ScanDataGrid } from '@/widgets/ScanDataGrid';
import { TitleBar } from '@/widgets/TitleBar';
import { BottomDock, type DetailsTab } from '@/widgets/BottomDock';
import { StatusBar } from '@/widgets/StatusBar';
import { AboutDialog } from '@/widgets/AboutDialog';
import { LocationBanner } from '@/widgets/LocationBanner';
import { normalizeLocationAuthorization } from '@/widgets/LocationBanner/normalizeLocationAuthorization';
import type { LocationAuthorization } from '@/domain/identity';
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

  const { formatMessage } = useScanIntl();
  const scanSettings = useScanSettings();
  const [scanSettingsOpen, setScanSettingsOpen] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [filters, setFilters] = useState(() => ({
    ...FILTER_DEFAULTS,
    minRssiDbm: loadScanSettings().minRssiDbm,
  }));
  const scanSearch = useScanSearch(filters.searchQuery);
  const [selectedBssid, setSelectedBssid] = useState<string | null>(null);
  const [detailsTab, setDetailsTab] = useState<DetailsTab>('details');
  const chartUnit = signalDisplayToChartUnit(scanSettings.settings.signalUnit);
  const onChartUnitChange = useCallback(
    (unit: SignalChartUnit) => {
      scanSettings.patchSettings({ signalUnit: chartUnitToSignalDisplay(unit) });
    },
    [scanSettings],
  );
  const [timescale, setTimescale] = useState<ChartTimescale>('1m');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [bssList, setBssList] = useState<readonly ObservedBss[]>(DEMO_OBSERVED_BSS);
  const [connectedBssid, setConnectedBssid] = useState(DEMO_CONNECTED_BSSID);
  const [locationState, setLocationState] = useState<LocationAuthorization>('granted');
  const [scanCoreState, setScanCoreState] = useState<'ok' | 'error' | 'demo'>(
    demoMode ? 'demo' : 'ok',
  );
  const [lastCapturedAt, setLastCapturedAt] = useState<string | null>(null);
  const [statusTick, setStatusTick] = useState(0);
  const annotations = useAnnotations();
  const viewRef = useRef<ScanViewModel | null>(null);

  useEffect(() => {
    if (demoMode) setScanCoreState('demo');
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
    locationDenied:
      locationState === 'denied' ||
      locationState === 'restricted' ||
      locationState === 'not-determined',
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

  const onFiltersChange = useCallback(
    (next: typeof filters) => {
      setFilters(next);
      if (next.minRssiDbm !== scanSettings.settings.minRssiDbm) {
        scanSettings.patchSettings({ minRssiDbm: next.minRssiDbm });
      }
    },
    [scanSettings],
  );

  const onScanIntervalSecChange = useCallback(
    (sec: number) => {
      scanSettings.patchSettings({ scanIntervalSec: sec });
    },
    [scanSettings],
  );

  const onScanSettingsChange = useCallback(
    (next: typeof scanSettings.settings) => {
      scanSettings.setSettings(next);
      setFilters((prev) => ({ ...prev, minRssiDbm: next.minRssiDbm }));
    },
    [scanSettings],
  );

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
    setLastCapturedAt(parsed.document.metadata.capturedAt);
    setScanCoreState('ok');
    setScanning(false);
    viewRef.current = null;
    const bridge = window.wifiExplorer;
    if (bridge) void bridge.scanStop();
  }, [annotations]);

  const clearSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, searchQuery: '' }));
  }, []);

  useScanShortcuts({
    searchInputRef: searchRef,
    gridContainerRef,
    selectedBssid: selectedRow?.bssid ?? null,
    onClearSearch: clearSearch,
    onToggleScan: toggleScan,
    onDetailsTabChange: setDetailsTab,
    onSaveSnapshot: saveSnapshot,
    onOpenSnapshot: openSnapshot,
  });

  useNativeMenuBridge({
    onOpenSnapshot: () => void openSnapshot(),
    onSaveSnapshot: saveSnapshot,
    onExportCsv: exportCsv,
    onAbout: openAbout,
  });

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
        scanIntervalSec={scanSettings.settings.scanIntervalSec}
        searchInputRef={searchRef}
        onExportCsv={exportCsv}
        onFiltersChange={onFiltersChange}
        onOpenColumnsPanel={openColumnsPanel}
        onOpenSettings={() => setScanSettingsOpen(true)}
        onScanIntervalSecChange={onScanIntervalSecChange}
      />
      <LocationBanner demoMode={scanCoreState === 'demo'} location={locationState} />
      <Box sx={scanMainSplitSx}>
        <Box ref={gridContainerRef} id="scan-grid" sx={scanGridRegionSx(paneFractions.top)}>
          <ScanDataGrid
            apiRef={apiRef}
            columnVisibilityModel={columnVisibility}
            locale={locale}
            overlayKind={overlayKind}
            rows={filteredRows}
            selectionModel={selectionModel}
            signalUnit={scanSettings.settings.signalUnit}
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
            onChartUnitChange={onChartUnitChange}
            onTabChange={setDetailsTab}
            onTimescaleChange={setTimescale}
          />
        </Box>
      </Box>
      <StatusBar
        lastScanLabel={lastScanLabel}
        locationState={locationState}
        networksFound={baseRows.length}
        scanCoreState={scanCoreState}
        selectedCount={selectedBssid ? 1 : 0}
        version={APP_VERSION}
        onAbout={openAbout}
      />
      <AboutDialog open={aboutOpen} version={APP_VERSION} onClose={() => setAboutOpen(false)} />
      <ScanSettingsDialog
        open={scanSettingsOpen}
        settings={scanSettings.settings}
        labels={{
          title: formatMessage('scan.settings.title'),
          signalUnit: formatMessage('scan.settings.signalUnit'),
          signalUnitDbm: formatMessage('scan.settings.signalUnit.dbm'),
          signalUnitPercent: formatMessage('scan.settings.signalUnit.percent'),
          minRssi: formatMessage('scan.filter.minRssi'),
          scanInterval: formatMessage('scan.settings.scanInterval'),
          scanIntervalSec: (sec) => formatMessage('scan.settings.scanIntervalSec', { sec }),
        }}
        onChange={onScanSettingsChange}
        onClose={() => setScanSettingsOpen(false)}
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
      <ThemePreferenceSync />
      <ScanIntlProvider locale={locale}>
        <ScanWorkbenchInner demoMode={demoMode} locale={locale} />
      </ScanIntlProvider>
    </>
  );
}
