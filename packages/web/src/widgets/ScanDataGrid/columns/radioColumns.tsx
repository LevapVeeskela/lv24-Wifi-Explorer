import type { GridColDef } from '@mui/x-data-grid-pro';
import { LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import {
  formatBandLabel,
  formatChannelWidth,
  formatDbm,
  formatSnr,
  type ScanGridRow,
} from '@/entities/bss';
import { RssiSparkline } from '../RssiSparkline';
import { signalPercentFromRssi } from '../signalPercent';
import { signalBarTrackSx, signalCellSx, signalPctSx } from '../styles';
import type { ColumnContext } from './types';

function qualityColor(quality: ScanGridRow['signalQuality']): 'success' | 'warning' | 'error' {
  if (quality === 'excellent' || quality === 'good') return 'success';
  if (quality === 'fair') return 'warning';
  return 'error';
}

function signalTooltip(
  formatMessage: ColumnContext['formatMessage'],
  row: ScanGridRow,
  pct: number
): string {
  const quality = formatMessage(`scan.quality.${row.signalQuality}`);
  const snr = formatSnr(row.snrDb);
  return `RSSI ${formatDbm(row.rssiDbm)} · SNR ${snr} · ${quality} · ${pct}%`;
}

/** Signal/trend, channel geometry, PHY and raw radio levels. */
export function radioColumns({ formatMessage, signalUnit }: ColumnContext) {
  return {
    signal: {
      field: 'signal',
      headerName: formatMessage('scan.col.signal'),
      width: 140,
      sortable: true,
      valueGetter: (_, row) => row.rssiDbm,
      renderCell: (params) => {
        const pct = signalPercentFromRssi(params.row.rssiDbm);
        const label = signalUnit === 'dbm' ? formatDbm(params.row.rssiDbm) : `${pct}%`;
        return (
          <Tooltip title={signalTooltip(formatMessage, params.row, pct)}>
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
    signalTrend: {
      field: 'signalTrend',
      headerName: formatMessage('scan.col.signalTrend'),
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <RssiSparkline bss={params.row.source} color={params.row.seriesColor} />
      ),
    },
    channel: {
      field: 'channel',
      headerName: formatMessage('scan.col.channel'),
      width: 64,
      type: 'number',
    },
    channelWidth: {
      field: 'channelWidth',
      headerName: formatMessage('scan.col.channelWidth'),
      width: 96,
      valueFormatter: (value) => formatChannelWidth(value as ScanGridRow['channelWidth']),
    },
    band: {
      field: 'band',
      headerName: formatMessage('scan.col.band'),
      width: 72,
      valueFormatter: (value) => formatBandLabel(value as ScanGridRow['band']),
    },
    phyMode: {
      field: 'phyMode',
      headerName: formatMessage('scan.col.phyMode'),
      width: 88,
    },
    rssiDbm: {
      field: 'rssiDbm',
      headerName: formatMessage('scan.col.rssi'),
      width: 80,
      valueFormatter: (value) => formatDbm(value as number),
    },
    noiseDbm: {
      field: 'noiseDbm',
      headerName: formatMessage('scan.col.noise'),
      width: 80,
      valueFormatter: (value) => formatDbm(value as number | null),
    },
    snrDb: {
      field: 'snrDb',
      headerName: formatMessage('scan.col.snr'),
      width: 72,
      valueFormatter: (value) => formatSnr(value as number | null),
    },
  } satisfies Record<string, GridColDef<ScanGridRow>>;
}
