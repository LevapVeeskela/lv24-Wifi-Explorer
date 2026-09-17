import { useMemo } from 'react';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid-pro';
import { Avatar, Box, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import Lock from '@mui/icons-material/Lock';
import LockOpen from '@mui/icons-material/LockOpen';
import Wifi from '@mui/icons-material/Wifi';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import {
  formatBandLabel,
  formatChannelWidth,
  formatDbm,
  formatSnr,
  securityDisplayLabel,
  truncateBssidMiddle,
  vendorInitials,
} from '@/entities/bss/formatters';
import { signalPercentFromRssi } from './signalPercent';
import {
  monoCellSx,
  seriesSwatchSx,
  signalBarTrackSx,
  signalCellSx,
  signalPctSx,
  ssidCellSx,
  ssidTextSx,
  vendorAvatarSx,
  vendorCellSx,
} from './styles';
import { t } from './t';

function qualityColor(quality: ScanGridRow['signalQuality']): 'success' | 'warning' | 'error' {
  if (quality === 'excellent' || quality === 'good') return 'success';
  if (quality === 'fair') return 'warning';
  return 'error';
}

function formatSeen(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '—';
  const deltaSec = Math.round((Date.now() - then) / 1000);
  if (deltaSec < 60) return `${Math.max(0, deltaSec)}s`;
  if (deltaSec < 3600) return `${Math.round(deltaSec / 60)}m`;
  return `${Math.round(deltaSec / 3600)}h`;
}

function signalTooltip(row: ScanGridRow, pct: number): string {
  const quality = t(`scan.quality.${row.signalQuality}`);
  const snr = formatSnr(row.snrDb);
  return `RSSI ${formatDbm(row.rssiDbm)} · SNR ${snr} · ${quality} · ${pct}%`;
}

export function useScanGridColumns(): GridColDef<ScanGridRow>[] {
  return useMemo(
    (): GridColDef<ScanGridRow>[] => [
      {
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
      {
        field: 'bssid',
        headerName: t('scan.col.bssid'),
        width: 128,
        renderCell: (params) => (
          <Tooltip title={params.row.bssid}>
            <Typography sx={monoCellSx} variant="body2">
              {truncateBssidMiddle(params.row.bssid)}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: 'ssid',
        headerName: t('scan.col.ssid'),
        flex: 1.2,
        minWidth: 140,
        renderCell: (params) => {
          const hidden = params.row.ssidHidden;
          const connected = params.row.connected;
          const label = hidden ? t('scan.ssid.hidden') : params.row.ssid || '—';
          return (
            <Stack direction="row" spacing={0.5} sx={ssidCellSx}>
              {connected ? <Wifi aria-label={t('scan.a11y.connected')} fontSize="inherit" /> : null}
              <Typography sx={ssidTextSx({ connected, hidden })} variant="body2">
                {label}
              </Typography>
            </Stack>
          );
        },
      },
      {
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
      {
        field: 'vendor',
        headerName: t('scan.col.vendor'),
        width: 160,
        renderCell: (params) => (
          <Stack direction="row" spacing={1} sx={vendorCellSx}>
            <Avatar sx={vendorAvatarSx}>{vendorInitials(params.row.vendor)}</Avatar>
            <Typography noWrap variant="body2">
              {params.row.vendor ?? '—'}
            </Typography>
          </Stack>
        ),
      },
      {
        field: 'annotation',
        headerName: t('scan.col.annotation'),
        width: 100,
        editable: true,
        renderCell: (params) => (
          <Typography noWrap variant="body2">
            {params.row.annotation || '—'}
          </Typography>
        ),
      },
      {
        field: 'signal',
        headerName: t('scan.col.signal'),
        width: 140,
        sortable: true,
        valueGetter: (_, row) => row.rssiDbm,
        renderCell: (params) => {
          const pct = signalPercentFromRssi(params.row.rssiDbm);
          return (
            <Tooltip title={signalTooltip(params.row, pct)}>
              <Stack direction="row" spacing={1} sx={signalCellSx}>
                <Typography sx={signalPctSx} variant="caption">
                  {pct}%
                </Typography>
                <LinearProgress
                  color={qualityColor(params.row.signalQuality)}
                  sx={signalBarTrackSx}
                  value={pct}
                  variant="determinate"
                />
              </Stack>
            </Tooltip>
          );
        },
      },
      {
        field: 'channel',
        headerName: t('scan.col.channel'),
        width: 64,
        type: 'number',
      },
      {
        field: 'channelWidth',
        headerName: t('scan.col.channelWidth'),
        width: 96,
        valueFormatter: (value) => formatChannelWidth(value as ScanGridRow['channelWidth']),
      },
      {
        field: 'band',
        headerName: t('scan.col.band'),
        width: 72,
        valueFormatter: (value) => formatBandLabel(value as ScanGridRow['band']),
      },
      {
        field: 'phyMode',
        headerName: t('scan.col.phyMode'),
        width: 88,
      },
      {
        field: 'security',
        headerName: t('scan.col.security'),
        width: 120,
        valueGetter: (_, row) => securityDisplayLabel(row.securityLabel as never),
      },
      {
        field: 'rssiDbm',
        headerName: t('scan.col.rssi'),
        width: 80,
        valueFormatter: (value) => formatDbm(value as number),
      },
      {
        field: 'noiseDbm',
        headerName: t('scan.col.noise'),
        width: 80,
        valueFormatter: (value) => formatDbm(value as number | null),
      },
      {
        field: 'snrDb',
        headerName: t('scan.col.snr'),
        width: 72,
        valueFormatter: (value) => formatSnr(value as number | null),
      },
      {
        field: 'lastSeenAt',
        headerName: t('scan.col.seen'),
        width: 72,
        valueFormatter: (value) => formatSeen(String(value)),
      },
      {
        field: 'networkType',
        headerName: t('scan.col.type'),
        width: 110,
        valueGetter: (_, row) =>
          row.networkType === 'ibss' ? t('scan.type.ibss') : t('scan.type.infrastructure'),
      },
    ],
    [],
  );
}
