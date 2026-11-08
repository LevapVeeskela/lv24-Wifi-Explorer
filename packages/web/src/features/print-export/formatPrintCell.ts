import {
  formatBandLabel,
  formatChannelWidth,
  formatDbm,
  formatSnr,
  securityDisplayLabel,
} from '@/entities/bss/formatters';
import { ssidGridLabel, type ScanGridRow } from '@/entities/bss/scanGridRow';
import type { SignalDisplayUnit } from '@/features/scan-settings';
import type { MessageKey } from '@/shared/i18n';

function signalPercentFromRssi(rssiDbm: number): number {
  const rssiClamped = Math.min(-50, Math.max(-100, rssiDbm));
  return Math.round(((rssiClamped + 100) / 50) * 100);
}

function formatSeen(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '—';
  const deltaSec = Math.round((Date.now() - then) / 1000);
  if (deltaSec < 60) return `${Math.max(0, deltaSec)}s`;
  if (deltaSec < 3600) return `${Math.round(deltaSec / 60)}m`;
  return `${Math.round(deltaSec / 3600)}h`;
}

export type PrintCellFormatContext = {
  signalUnit: SignalDisplayUnit;
  hiddenSsidLabel: string;
  networkTypeLabels: {
    ibss: string;
    infrastructure: string;
  };
  formatIssueKey: (key: MessageKey) => string;
};

export function formatPrintCell(
  row: ScanGridRow,
  columnId: string,
  context: PrintCellFormatContext
): string {
  switch (columnId) {
    case 'bssid':
      return row.bssid;
    case 'ssid': {
      const label = ssidGridLabel(row, context.hiddenSsidLabel);
      return row.connected ? `${label} *` : label;
    }
    case 'vendor':
      return row.vendor ?? '—';
    case 'annotation':
      return row.annotation.trim() || '—';
    case 'issueFlags':
      if (row.issueKeys.length === 0) return '—';
      return row.issueKeys.map((key) => context.formatIssueKey(key)).join('; ');
    case 'signal': {
      const pct = signalPercentFromRssi(row.rssiDbm);
      return context.signalUnit === 'dbm' ? formatDbm(row.rssiDbm) : `${pct}%`;
    }
    case 'channel':
      return String(row.channel);
    case 'channelWidth':
      return formatChannelWidth(row.channelWidth);
    case 'band':
      return formatBandLabel(row.band);
    case 'phyMode':
      return row.phyMode || '—';
    case 'security':
      return securityDisplayLabel(row.securityLabel as never);
    case 'rssiDbm':
      return formatDbm(row.rssiDbm);
    case 'noiseDbm':
      return formatDbm(row.noiseDbm);
    case 'snrDb':
      return formatSnr(row.snrDb);
    case 'lastSeenAt':
      return formatSeen(row.lastSeenAt);
    case 'networkType':
      return row.networkType === 'ibss'
        ? context.networkTypeLabels.ibss
        : context.networkTypeLabels.infrastructure;
    default:
      return '';
  }
}

export function printCellClass(columnId: string): string | undefined {
  if (columnId === 'bssid') return 'mono';
  return undefined;
}
