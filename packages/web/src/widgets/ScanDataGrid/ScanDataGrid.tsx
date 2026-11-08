import { useCallback, useMemo, useState, type MouseEvent, type RefObject } from 'react';
import {
  DataGridPro,
  type GridApiPro,
  type GridRowClassNameParams,
  type GridRowSelectionModel,
} from '@mui/x-data-grid-pro';
import { Box } from '@mui/material';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { columnRuleClassNameForCell, useColumnRules } from '@/features/column-rules';
import { isRowIdSelected } from '@/features/scan-selection';
import type { SignalDisplayUnit } from '@/features/scan-settings';
import { getDataGridLocaleText } from '@/shared/lib/mui/dataGridLocale';
import { filterQueryForCell } from './cellContextMenu';
import { ScanCellContextMenu, type ScanCellMenuAnchor } from './ScanCellContextMenu';
import { ScanGridOverlay, type ScanGridOverlayKind } from './ScanGridOverlay';
import { scanDataGridProSx, scanDataGridRootSx } from './styles';
import { useScanGridColumns } from './useScanGridColumns';

export type ScanDataGridApiRef = RefObject<GridApiPro | null>;

export type ScanDataGridProps = {
  rows: readonly ScanGridRow[];
  selectionModel: GridRowSelectionModel;
  onSelectionModelChange: (model: GridRowSelectionModel) => void;
  columnVisibilityModel: Record<string, boolean>;
  onColumnVisibilityModelChange: (model: Record<string, boolean>) => void;
  onAnnotationChange?: (bssid: string, text: string) => void;
  /** Fields that are known catalog columns but currently hidden. */
  hiddenColumnFields?: readonly string[];
  /** Apply the cell query as the scan search filter. */
  onApplyFilter?: (query: string) => void;
  /** Apply the negated cell query as the scan search filter. */
  onApplyFilterNegate?: (query: string) => void;
  /** Make a hidden catalog column visible. */
  onShowColumn?: (field: string) => void;
  apiRef?: ScanDataGridApiRef;
  overlayKind?: ScanGridOverlayKind | null;
  locale?: string;
  signalUnit?: SignalDisplayUnit;
  getTreeDataPath?: ((row: ScanGridRow) => readonly string[]) | null;
  rowColorClass?: (row: ScanGridRow) => string | null;
};

type CellContextTarget = {
  row: ScanGridRow;
  field: string;
  anchorPosition: ScanCellMenuAnchor;
};

/** Resolve the grid cell (row id + field) under a context-menu event target. */
function resolveCellContextTarget(
  event: MouseEvent<HTMLDivElement>,
  rowById: ReadonlyMap<string, ScanGridRow>
): CellContextTarget | null {
  const target = event.target instanceof Element ? event.target : null;
  const cell = target?.closest<HTMLElement>('[data-field]');
  if (!cell) return null;
  const row = cell.closest<HTMLElement>('[data-id]');
  const field = cell.getAttribute('data-field');
  const rowId = row?.getAttribute('data-id');
  if (!field || !rowId) return null;
  const gridRow = rowById.get(rowId);
  if (!gridRow) return null;
  return {
    row: gridRow,
    field,
    anchorPosition: { top: event.clientY + 2, left: event.clientX + 2 },
  };
}

export function ScanDataGrid({
  rows,
  selectionModel,
  onSelectionModelChange,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
  onAnnotationChange,
  hiddenColumnFields,
  onApplyFilter,
  onApplyFilterNegate,
  onShowColumn,
  apiRef,
  overlayKind = 'empty',
  locale = 'ru',
  signalUnit = 'percent',
  getTreeDataPath,
  rowColorClass,
}: ScanDataGridProps) {
  const columns = useScanGridColumns(signalUnit);
  const { config: columnRules } = useColumnRules();
  const localeText = useMemo(() => getDataGridLocaleText(locale), [locale]);
  const kind = overlayKind ?? 'empty';
  const [cellMenu, setCellMenu] = useState<CellContextTarget | null>(null);
  const rowById = useMemo(() => new Map(rows.map((row) => [row.id, row] as const)), [rows]);

  const onCellContextMenu = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const target = resolveCellContextTarget(event, rowById);
      if (!target) return;
      event.preventDefault();
      setCellMenu(target);
    },
    [rowById]
  );

  const closeCellMenu = useCallback(() => setCellMenu(null), []);
  const filterQuery = cellMenu ? filterQueryForCell(cellMenu.row, cellMenu.field) : null;
  const canShowColumn = cellMenu
    ? (hiddenColumnFields ?? []).includes(cellMenu.field) && onShowColumn != null
    : false;

  return (
    <Box sx={scanDataGridRootSx} onContextMenu={onCellContextMenu}>
      <DataGridPro
        apiRef={apiRef}
        checkboxSelection
        columnHeaderHeight={36}
        columnVisibilityModel={columnVisibilityModel}
        columns={columns}
        density="compact"
        disableColumnFilter
        disableColumnMenu={false}
        disableColumnReorder={false}
        disableColumnResize={false}
        disableMultipleRowSelection={false}
        disableRowSelectionOnClick={false}
        editMode="cell"
        isCellEditable={(params) => params.field === 'annotation'}
        getCellClassName={(params) =>
          columnRuleClassNameForCell(params.row, params.field, columnRules)
        }
        getRowClassName={(params: GridRowClassNameParams<ScanGridRow>) => {
          const classes: string[] = [];
          const coloring = rowColorClass?.(params.row);
          if (coloring) classes.push(coloring);
          if (params.row.connected) classes.push('scan-grid-row--connected');
          if (params.row.stale) classes.push('scan-grid-row--stale');
          if (isRowIdSelected(selectionModel, params.id)) classes.push('scan-grid-row--selected');
          return classes.join(' ');
        }}
        getRowId={(row) => row.id}
        getTreeDataPath={getTreeDataPath ?? undefined}
        defaultGroupingExpansionDepth={-1}
        hideFooter
        treeData={Boolean(getTreeDataPath)}
        initialState={{
          pinnedColumns: { left: ['seriesColor'] },
          sorting: {
            sortModel: [{ field: 'signal', sort: 'desc' }],
          },
        }}
        localeText={localeText}
        onColumnVisibilityModelChange={(model) =>
          onColumnVisibilityModelChange(model as Record<string, boolean>)
        }
        onProcessRowUpdateError={() => undefined}
        onRowSelectionModelChange={onSelectionModelChange}
        processRowUpdate={(next, prev) => {
          if (next.annotation !== prev.annotation) {
            onAnnotationChange?.(next.bssid, String(next.annotation ?? ''));
          }
          return next;
        }}
        rowHeight={30}
        rowSelectionModel={selectionModel}
        rows={[...rows]}
        slotProps={{
          columnsManagement: {
            disableShowHideToggle: false,
          },
        }}
        slots={{
          noRowsOverlay: () => <ScanGridOverlay kind={kind} />,
        }}
        sx={scanDataGridProSx}
      />
      <ScanCellContextMenu
        anchorPosition={cellMenu?.anchorPosition ?? null}
        canShowColumn={canShowColumn}
        field={cellMenu?.field ?? ''}
        filterQuery={filterQuery}
        onApplyFilter={(query) => onApplyFilter?.(query)}
        onApplyFilterNegate={(query) => onApplyFilterNegate?.(query)}
        onClose={closeCellMenu}
        onShowColumn={(field) => onShowColumn?.(field)}
      />
    </Box>
  );
}
