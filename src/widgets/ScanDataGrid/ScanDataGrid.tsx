import { useMemo, type RefObject } from 'react';
import {
  DataGridPro,
  type GridApiPro,
  type GridRowClassNameParams,
  type GridRowSelectionModel,
} from '@mui/x-data-grid-pro';
import { LicenseInfo } from '@mui/x-license';
import { Box } from '@mui/material';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { isRowIdSelected } from '@/features/scan-selection';
import { getDataGridLocaleText } from '@/shared/lib/mui/dataGridLocale';
import { applyMuiXLicense } from '@/shared/lib/mui/license';
import { ScanGridOverlay, type ScanGridOverlayKind } from './ScanGridOverlay';
import { scanDataGridProSx, scanDataGridRootSx } from './styles';
import { useScanGridColumns } from './useScanGridColumns';

applyMuiXLicense();
const muiLicenseKey = String(import.meta.env.VITE_MUI_LICENSE_KEY ?? '').trim();
if (muiLicenseKey) {
  LicenseInfo.setLicenseKey(muiLicenseKey);
}

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
}: ScanDataGridProps) {
  const columns = useScanGridColumns();
  const localeText = useMemo(() => getDataGridLocaleText(locale), [locale]);
  const kind = overlayKind ?? 'empty';

  return (
    <Box sx={scanDataGridRootSx}>
      <DataGridPro
        apiRef={apiRef}
        checkboxSelection={false}
        columnHeaderHeight={36}
        columnVisibilityModel={columnVisibilityModel}
        columns={columns}
        density="compact"
        disableColumnFilter
        disableColumnMenu={false}
        disableColumnReorder={false}
        disableColumnResize={false}
        disableMultipleRowSelection
        disableRowSelectionOnClick={false}
        editMode="cell"
        isCellEditable={(params) => params.field === 'annotation'}
        getRowClassName={(params: GridRowClassNameParams<ScanGridRow>) => {
          const classes: string[] = [];
          if (params.row.connected) classes.push('scan-grid-row--connected');
          if (params.row.stale) classes.push('scan-grid-row--stale');
          if (isRowIdSelected(selectionModel, params.id)) classes.push('scan-grid-row--selected');
          return classes.join(' ');
        }}
        getRowId={(row) => row.id}
        hideFooter
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
