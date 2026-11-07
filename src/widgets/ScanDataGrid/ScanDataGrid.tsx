import { useMemo, type RefObject } from 'react';
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
  apiRef?: ScanDataGridApiRef;
  overlayKind?: ScanGridOverlayKind | null;
  locale?: string;
  signalUnit?: SignalDisplayUnit;
  getTreeDataPath?: ((row: ScanGridRow) => readonly string[]) | null;
};

export function ScanDataGrid({
  rows,
  selectionModel,
  onSelectionModelChange,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
  onAnnotationChange,
  apiRef,
  overlayKind = 'empty',
  locale = 'ru',
  signalUnit = 'percent',
  getTreeDataPath,
}: ScanDataGridProps) {
  const columns = useScanGridColumns(signalUnit);
  const { config: columnRules } = useColumnRules();
  const localeText = useMemo(() => getDataGridLocaleText(locale), [locale]);
  const kind = overlayKind ?? 'empty';

  return (
    <Box sx={scanDataGridRootSx}>
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
    </Box>
  );
}
