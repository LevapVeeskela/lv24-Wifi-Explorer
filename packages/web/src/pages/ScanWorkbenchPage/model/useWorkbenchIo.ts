import { useCallback, type MutableRefObject } from 'react';
import type { GridApiPro, GridRowSelectionModel } from '@mui/x-data-grid-pro';
import type { ObservedBss } from '@/domain/bss';
import type { LocationAuthorization } from '@/domain/identity';
import type { ScanViewModel } from '@/domain/scan';
import { importCapture } from '@pcap';
import { asIsoTime } from '@/scan/identity';
import { mapCoreWlanRecordsToObservedBss } from '@/scan/mapObservedBss';
import type { ScanGridRow } from '@/entities/bss';
import type { AnnotationRule, PinnedColor } from '@/features/annotations';
import { selectedRowIdsFromModel } from '@/features/bss-compare';
import type { CsvExportScope } from '@/features/export';
import { printVisibleTable, resolvePrintColumns } from '@/features/print-export';
import { SHARED_OUI_LOOKUP } from '@/features/scan-live';
import type { FormatMessageFn, MessageKey } from '@/shared/i18n';
import {
  openCaptureFile,
  openWorkbenchFile,
  saveWorkbenchFile,
} from '@/shared/lib/files/rendererFileIo';
import { normalizeLocationAuthorization } from '@/widgets/LocationBanner';
import { APP_VERSION } from '../lib/constants';
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
} from '../workbenchIo';
import type { ScanCoreState } from './useScanSession';

type GridApiRef = GridApiPro | null | undefined;

export type UseWorkbenchIoOptions = {
  apiRef: { readonly current: GridApiRef };
  baseRows: readonly ScanGridRow[];
  filteredRows: readonly ScanGridRow[];
  bssList: readonly ObservedBss[];
  selectionModel: GridRowSelectionModel;
  columnVisibility: Record<string, boolean>;
  gridColumns: readonly { field: string; labelKey: MessageKey }[];
  annotationRules: readonly AnnotationRule[];
  setAnnotationRules: (rules: AnnotationRule[]) => void;
  pinnedColors: readonly PinnedColor[];
  setPinnedColors: (colors: PinnedColor[]) => void;
  locationState: LocationAuthorization;
  setLocationState: (state: LocationAuthorization) => void;
  signalUnit: Parameters<typeof printVisibleTable>[0]['signalUnit'];
  formatMessage: FormatMessageFn;
  setBssList: (rows: readonly ObservedBss[]) => void;
  setLastCapturedAt: (iso: string | null) => void;
  setScanCoreState: (state: ScanCoreState) => void;
  setScanning: (value: boolean) => void;
  setFileError: (message: string | null) => void;
  viewRef: MutableRefObject<ScanViewModel | null>;
};

/**
 * File/menu actions for the workbench: CSV export, `.lv24scan` save/open,
 * pcap import and printing. All side effects are confined here.
 */
export function useWorkbenchIo(options: UseWorkbenchIoOptions) {
  const {
    apiRef,
    baseRows,
    filteredRows,
    bssList,
    selectionModel,
    columnVisibility,
    gridColumns,
    annotationRules,
    setAnnotationRules,
    pinnedColors,
    setPinnedColors,
    locationState,
    setLocationState,
    signalUnit,
    formatMessage,
    setBssList,
    setLastCapturedAt,
    setScanCoreState,
    setScanning,
    setFileError,
    viewRef,
  } = options;

  const printVisible = useCallback(() => {
    const columnIds = collectVisibleColumnIds(apiRef.current, columnVisibility);
    const labelForField = (fieldId: string): string => {
      const def = gridColumns.find((column) => column.field === fieldId);
      return def ? formatMessage(def.labelKey) : fieldId;
    };
    printVisibleTable({
      productTitle: formatMessage('scan.about.title'),
      rows: filteredRows,
      columns: resolvePrintColumns(columnIds, labelForField),
      signalUnit,
      hiddenSsidLabel: formatMessage('scan.ssid.hidden'),
      networkTypeLabels: {
        ibss: formatMessage('scan.type.ibss'),
        infrastructure: formatMessage('scan.type.infrastructure'),
      },
      formatIssueKey: (key) => formatMessage(key),
    });
  }, [apiRef, columnVisibility, filteredRows, formatMessage, gridColumns, signalUnit]);

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
      annotations: annotationRules,
      appVersion: APP_VERSION,
      location: locationState,
      pinnedColors,
    });
    void saveWorkbenchFile({
      defaultPath: snapshot.fileName,
      contents: snapshot.text,
      mimeType: LV24_SCAN_MIME,
    });
  }, [annotationRules, bssList, locationState, pinnedColors]);

  const openSnapshot = useCallback(async () => {
    const picked = await openWorkbenchFile({
      accept: LV24_SCAN_FILE_ACCEPT,
      extensions: LV24_SCAN_EXTENSIONS,
    });
    if (picked.canceled) return;
    const parsed = parseWorkbenchSnapshot(picked.text, picked.name);
    if (!parsed.ok) {
      setFileError(formatMessage('scan.snapshot.openError', { detail: parsed.error }));
      return;
    }
    setBssList(parsed.document.networks);
    setAnnotationRules(parsed.document.annotations);
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
  }, [
    formatMessage,
    setAnnotationRules,
    setBssList,
    setFileError,
    setLastCapturedAt,
    setLocationState,
    setPinnedColors,
    setScanCoreState,
    setScanning,
    viewRef,
  ]);

  const importPcapCapture = useCallback(async () => {
    const picked = await openCaptureFile({ accept: '.pcap,.pcapng,application/vnd.tcpdump.pcap' });
    if (picked.canceled) {
      if (picked.error === 'file-too-large')
        setFileError(formatMessage('scan.snapshot.openError', { detail: 'file too large' }));
      return;
    }
    const parsed = importCapture(picked.bytes);
    if (parsed.records.length === 0) {
      setFileError(
        formatMessage('scan.snapshot.openError', { detail: parsed.warnings[0] ?? 'no beacons' })
      );
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
  }, [
    formatMessage,
    setBssList,
    setFileError,
    setLastCapturedAt,
    setScanCoreState,
    setScanning,
    viewRef,
  ]);

  return { exportCsv, importPcapCapture, openSnapshot, printVisible, saveSnapshot };
}
