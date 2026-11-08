import type { GridColDef } from '@mui/x-data-grid-pro';
import type { ScanGridRow } from '@/entities/bss';
import { uniiSubband } from '@/entities/channel';
import type { ColumnContext } from './types';

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

/** Columns derived from beacon/probe IE payloads plus timing metadata. */
export function ieColumns({ formatMessage }: ColumnContext) {
  return {
    lastSeenAt: {
      field: 'lastSeenAt',
      headerName: formatMessage('scan.col.seen'),
      width: 72,
      valueFormatter: (value) => formatSeen(String(value)),
    },
    unii: {
      field: 'unii',
      headerName: formatMessage('scan.col.unii'),
      width: 96,
      valueGetter: (_, row) => uniiSubband(row.band, row.channel) ?? '—',
    },
    firstSeenAt: {
      field: 'firstSeenAt',
      headerName: formatMessage('scan.col.firstSeen'),
      width: 88,
      valueFormatter: (value) => formatSeen(String(value)),
    },
    uptimeSec: {
      field: 'uptimeSec',
      headerName: formatMessage('scan.col.uptime'),
      width: 88,
      valueFormatter: (value) => formatUptime(value as number | null),
    },
    centerFreqMhz: {
      field: 'centerFreqMhz',
      headerName: formatMessage('scan.col.centerFreq'),
      width: 110,
      valueFormatter: (value) => (value == null ? '—' : `${value} MHz`),
    },
    maxRateMbps: {
      field: 'maxRateMbps',
      headerName: formatMessage('scan.col.maxRate'),
      width: 108,
      valueFormatter: (value) => (value == null ? '—' : `${value} Mbps`),
    },
    streams: {
      field: 'streams',
      headerName: formatMessage('scan.col.streams'),
      width: 72,
      valueFormatter: (value) => (value == null ? '—' : String(value)),
    },
    amendments: {
      field: 'amendments',
      headerName: formatMessage('scan.col.amendments'),
      width: 130,
      valueGetter: (_, row) => row.amendments.join('/'),
    },
    generation: {
      field: 'generation',
      headerName: formatMessage('scan.col.generation'),
      width: 100,
      valueFormatter: (value) => (value == null ? '—' : String(value)),
    },
    countryCode: {
      field: 'countryCode',
      headerName: formatMessage('scan.col.country'),
      width: 80,
      valueFormatter: (value) => (value == null ? '—' : String(value)),
    },
    beaconIntervalMs: {
      field: 'beaconIntervalMs',
      headerName: formatMessage('scan.col.beaconInterval'),
      width: 110,
      valueFormatter: (value) => (value == null ? '—' : `${value} ms`),
    },
    dtimPeriod: {
      field: 'dtimPeriod',
      headerName: formatMessage('scan.col.dtim'),
      width: 72,
      valueFormatter: (value) => (value == null ? '—' : String(value)),
    },
    bssLoadStations: {
      field: 'bssLoadStations',
      headerName: formatMessage('scan.col.bssLoad'),
      width: 96,
      valueFormatter: (value) => (value == null ? '—' : String(value)),
    },
    bssLoadUtilPct: {
      field: 'bssLoadUtilPct',
      headerName: formatMessage('scan.col.bssLoad'),
      width: 96,
      valueFormatter: (value) => (value == null ? '—' : `${value}%`),
    },
    channelUtilPct: {
      field: 'channelUtilPct',
      headerName: formatMessage('scan.col.channelUtil'),
      width: 116,
      valueFormatter: (value) => (value == null ? '—' : `${value}%`),
    },
    ieCount: {
      field: 'ieCount',
      headerName: formatMessage('scan.col.ieCount'),
      width: 64,
      valueFormatter: (value) => (value == null ? '—' : String(value)),
    },
    ieBytes: {
      field: 'ieBytes',
      headerName: formatMessage('scan.col.ieBytes'),
      width: 80,
      valueFormatter: (value) => (value == null ? '—' : `${value} B`),
    },
    networkType: {
      field: 'networkType',
      headerName: formatMessage('scan.col.type'),
      width: 110,
      valueGetter: (_, row) =>
        row.networkType === 'ibss'
          ? formatMessage('scan.type.ibss')
          : formatMessage('scan.type.infrastructure'),
    },
  } satisfies Record<string, GridColDef<ScanGridRow>>;
}
