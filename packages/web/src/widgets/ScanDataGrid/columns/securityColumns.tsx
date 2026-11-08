import type { GridColDef } from '@mui/x-data-grid-pro';
import { Tooltip } from '@mui/material';
import Lock from '@mui/icons-material/Lock';
import LockOpen from '@mui/icons-material/LockOpen';
import { securityDisplayLabel, type ScanGridRow } from '@/entities/bss';
import type { ColumnContext } from './types';

/** Security lock/token plus capability flags derived from security IEs. */
export function securityColumns({ formatMessage }: ColumnContext) {
  return {
    securityLock: {
      field: 'securityLock',
      headerName: '',
      width: 40,
      sortable: true,
      valueGetter: (_, row) => (row.securityOpen ? 0 : 1),
      hideable: false,
      renderCell: (params) => (
        <Tooltip title={securityDisplayLabel(params.row.securityLabel as never)}>
          {params.row.securityOpen ? (
            <LockOpen color="warning" fontSize="small" />
          ) : (
            <Lock color="action" fontSize="small" />
          )}
        </Tooltip>
      ),
    },
    security: {
      field: 'security',
      headerName: formatMessage('scan.col.security'),
      width: 120,
      valueGetter: (_, row) => securityDisplayLabel(row.securityLabel as never),
    },
    wps: {
      field: 'wps',
      headerName: formatMessage('scan.col.wps'),
      width: 64,
      valueGetter: (_, row) => (row.wps ? '✓' : '—'),
    },
    mfp: {
      field: 'mfp',
      headerName: formatMessage('scan.col.mfp'),
      width: 64,
      valueGetter: (_, row) => (row.mfp ? '✓' : '—'),
    },
    ft: {
      field: 'ft',
      headerName: formatMessage('scan.col.ft'),
      width: 96,
      valueGetter: (_, row) => (row.ft ? '✓' : '—'),
    },
  } satisfies Record<string, GridColDef<ScanGridRow>>;
}
