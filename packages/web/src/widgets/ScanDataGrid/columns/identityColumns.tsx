import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid-pro';
import { Avatar, Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import Wifi from '@mui/icons-material/Wifi';
import {
  ssidGridLabel,
  truncateBssidMiddle,
  vendorInitials,
  type ScanGridRow,
} from '@/entities/bss';
import {
  issueCountChipSx,
  issueFlagsCellSx,
  monoCellSx,
  seriesSwatchSx,
  ssidCellSx,
  ssidTextSx,
  vendorAvatarSx,
  vendorCellSx,
} from '../styles';
import type { ColumnContext } from './types';

/** Series color, BSSID, SSID, vendor, AP name, annotation and issue flags. */
export function identityColumns({ formatMessage }: ColumnContext) {
  return {
    seriesColor: {
      field: 'seriesColor',
      headerName: '',
      width: 24,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      hideable: false,
      renderCell: (params: GridRenderCellParams<ScanGridRow>) => (
        <Box aria-hidden sx={seriesSwatchSx(params.row.seriesColor)} />
      ),
    },
    bssid: {
      field: 'bssid',
      headerName: formatMessage('scan.col.bssid'),
      width: 128,
      renderCell: (params) => (
        <Tooltip title={params.row.bssid}>
          <Typography sx={monoCellSx} variant="body2">
            {truncateBssidMiddle(params.row.bssid)}
          </Typography>
        </Tooltip>
      ),
    },
    ssid: {
      field: 'ssid',
      headerName: formatMessage('scan.col.ssid'),
      flex: 1.2,
      minWidth: 140,
      valueGetter: (_, row) => ssidGridLabel(row, formatMessage('scan.ssid.hidden')),
      renderCell: (params) => {
        const hidden = params.row.ssidHidden;
        const connected = params.row.connected;
        const label = ssidGridLabel(params.row, formatMessage('scan.ssid.hidden'));
        return (
          <Stack
            className={connected ? 'scan-grid-ssid--connected' : undefined}
            direction="row"
            spacing={0.5}
            sx={ssidCellSx}
          >
            {connected ? (
              <Wifi aria-label={formatMessage('scan.a11y.connected')} fontSize="inherit" />
            ) : null}
            <Typography sx={ssidTextSx({ connected, hidden })} variant="body2">
              {label}
            </Typography>
          </Stack>
        );
      },
    },
    vendor: {
      field: 'vendor',
      headerName: formatMessage('scan.col.vendor'),
      width: 160,
      valueGetter: (_, row) => row.vendor ?? '—',
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={vendorCellSx}>
          <Avatar sx={vendorAvatarSx}>{vendorInitials(params.row.vendor)}</Avatar>
          <Typography noWrap variant="body2">
            {params.row.vendor ?? '—'}
          </Typography>
        </Stack>
      ),
    },
    apName: {
      field: 'apName',
      headerName: formatMessage('scan.col.apName'),
      width: 160,
      valueGetter: (_, row) => row.apName ?? '—',
      renderCell: (params) => (
        <Typography noWrap variant="body2">
          {params.row.apName ?? '—'}
        </Typography>
      ),
    },
    annotation: {
      field: 'annotation',
      headerName: formatMessage('scan.col.annotation'),
      width: 100,
      editable: true,
      renderCell: (params) => (
        <Typography noWrap variant="body2">
          {params.row.annotation || '—'}
        </Typography>
      ),
    },
    issueFlags: {
      field: 'issueFlags',
      headerName: formatMessage('scan.col.issues'),
      width: 72,
      sortable: true,
      valueGetter: (_, row) => row.issueKeys.length,
      renderCell: (params: GridRenderCellParams<ScanGridRow>) => {
        const keys = params.row.issueKeys;
        if (keys.length === 0) {
          return (
            <Typography color="text.secondary" variant="body2">
              —
            </Typography>
          );
        }
        const title = (
          <Stack spacing={0.25}>
            {keys.map((key) => (
              <Box key={key} component="span" sx={{ display: 'block', typography: 'caption' }}>
                {formatMessage(key)}
              </Box>
            ))}
          </Stack>
        );
        return (
          <Tooltip title={title}>
            <Box sx={issueFlagsCellSx}>
              <Chip
                aria-label={formatMessage('scan.col.issues')}
                color="warning"
                label={keys.length}
                size="small"
                sx={issueCountChipSx}
                variant="outlined"
              />
            </Box>
          </Tooltip>
        );
      },
    },
  } satisfies Record<string, GridColDef<ScanGridRow>>;
}
