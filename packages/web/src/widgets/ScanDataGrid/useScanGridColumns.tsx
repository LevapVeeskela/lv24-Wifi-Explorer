import { useMemo } from 'react';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid-pro';
import { Avatar, Box, Chip, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import Lock from '@mui/icons-material/Lock';
import LockOpen from '@mui/icons-material/LockOpen';
import Wifi from '@mui/icons-material/Wifi';
import { ssidGridLabel, type ScanGridRow } from '@/entities/bss';
import type { SignalDisplayUnit } from '@/features/scan-settings';
import {
  formatBandLabel,
  formatChannelWidth,
  formatDbm,
  formatSnr,
  securityDisplayLabel,
  truncateBssidMiddle,
  vendorInitials,
} from '@/entities/bss';
import { useScanIntl } from '@/shared/i18n';
import { RssiSparkline } from './RssiSparkline';
import { signalPercentFromRssi } from './signalPercent';
import { uniiSubband } from '@/entities/channel';
import {
  issueCountChipSx,
  issueFlagsCellSx,
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

function formatUptime(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function signalTooltip(row: ScanGridRow, pct: number): string {
  const quality = t(`scan.quality.${row.signalQuality}`);
  const snr = formatSnr(row.snrDb);
  return `RSSI ${formatDbm(row.rssiDbm)} · SNR ${snr} · ${quality} · ${pct}%`;
}

export function useScanGridColumns(
  signalUnit: SignalDisplayUnit = 'percent'
): GridColDef<ScanGridRow>[] {
  const { formatMessage } = useScanIntl();

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
        valueGetter: (_, row) => ssidGridLabel(row, t('scan.ssid.hidden')),
        renderCell: (params) => {
          const hidden = params.row.ssidHidden;
          const connected = params.row.connected;
          const label = ssidGridLabel(params.row, t('scan.ssid.hidden'));
          return (
            <Stack
              className={connected ? 'scan-grid-ssid--connected' : undefined}
              direction="row"
              spacing={0.5}
              sx={ssidCellSx}
            >
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
      {
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
        field: 'issueFlags',
        headerName: t('scan.col.issues'),
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
      {
        field: 'signal',
        headerName: t('scan.col.signal'),
        width: 140,
        sortable: true,
        valueGetter: (_, row) => row.rssiDbm,
        renderCell: (params) => {
          const pct = signalPercentFromRssi(params.row.rssiDbm);
          const label = signalUnit === 'dbm' ? formatDbm(params.row.rssiDbm) : `${pct}%`;
          return (
            <Tooltip title={signalTooltip(params.row, pct)}>
              <Stack direction="row" spacing={1} sx={signalCellSx}>
                <Typography sx={signalPctSx} variant="caption">
                  {label}
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
        field: 'signalTrend',
        headerName: t('scan.col.signalTrend'),
        width: 80,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <RssiSparkline bss={params.row.source} color={params.row.seriesColor} />
        ),
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
        field: 'unii',
        headerName: t('scan.col.unii'),
        width: 96,
        valueGetter: (_, row) => uniiSubband(row.band, row.channel) ?? '—',
      },
      {
        field: 'firstSeenAt',
        headerName: t('scan.col.firstSeen'),
        width: 88,
        valueFormatter: (value) => formatSeen(String(value)),
      },
      {
        field: 'uptimeSec',
        headerName: t('scan.col.uptime'),
        width: 88,
        valueFormatter: (value) => formatUptime(value as number | null),
      },
      {
        field: 'centerFreqMhz',
        headerName: t('scan.col.centerFreq'),
        width: 110,
        valueFormatter: (value) => (value == null ? '—' : `${value} MHz`),
      },
      {
        field: 'maxRateMbps',
        headerName: t('scan.col.maxRate'),
        width: 108,
        valueFormatter: (value) => (value == null ? '—' : `${value} Mbps`),
      },
      {
        field: 'streams',
        headerName: t('scan.col.streams'),
        width: 72,
        valueFormatter: (value) => (value == null ? '—' : String(value)),
      },
      {
        field: 'amendments',
        headerName: t('scan.col.amendments'),
        width: 130,
        valueGetter: (_, row) => row.amendments.join('/'),
      },
      {
        field: 'generation',
        headerName: t('scan.col.generation'),
        width: 100,
        valueFormatter: (value) => (value == null ? '—' : String(value)),
      },
      {
        field: 'countryCode',
        headerName: t('scan.col.country'),
        width: 80,
        valueFormatter: (value) => (value == null ? '—' : String(value)),
      },
      {
        field: 'beaconIntervalMs',
        headerName: t('scan.col.beaconInterval'),
        width: 110,
        valueFormatter: (value) => (value == null ? '—' : `${value} ms`),
      },
      {
        field: 'dtimPeriod',
        headerName: t('scan.col.dtim'),
        width: 72,
        valueFormatter: (value) => (value == null ? '—' : String(value)),
      },
      {
        field: 'bssLoadStations',
        headerName: t('scan.col.bssLoad'),
        width: 96,
        valueFormatter: (value) => (value == null ? '—' : String(value)),
      },
      {
        field: 'bssLoadUtilPct',
        headerName: t('scan.col.bssLoad'),
        width: 96,
        valueFormatter: (value) => (value == null ? '—' : `${value}%`),
      },
      {
        field: 'channelUtilPct',
        headerName: t('scan.col.channelUtil'),
        width: 116,
        valueFormatter: (value) => (value == null ? '—' : `${value}%`),
      },
      {
        field: 'ieCount',
        headerName: t('scan.col.ieCount'),
        width: 64,
        valueFormatter: (value) => (value == null ? '—' : String(value)),
      },
      {
        field: 'ieBytes',
        headerName: t('scan.col.ieBytes'),
        width: 80,
        valueFormatter: (value) => (value == null ? '—' : `${value} B`),
      },
      {
        field: 'wps',
        headerName: t('scan.col.wps'),
        width: 64,
        valueGetter: (_, row) => (row.wps ? '✓' : '—'),
      },
      {
        field: 'mfp',
        headerName: t('scan.col.mfp'),
        width: 64,
        valueGetter: (_, row) => (row.mfp ? '✓' : '—'),
      },
      {
        field: 'ft',
        headerName: t('scan.col.ft'),
        width: 96,
        valueGetter: (_, row) => (row.ft ? '✓' : '—'),
      },
      {
        field: 'networkType',
        headerName: t('scan.col.type'),
        width: 110,
        valueGetter: (_, row) =>
          row.networkType === 'ibss' ? t('scan.type.ibss') : t('scan.type.infrastructure'),
      },
    ],
    [formatMessage, signalUnit]
  );
}
