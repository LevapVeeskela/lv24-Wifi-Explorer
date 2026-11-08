import type { ScanGridRow } from '@/entities/bss';
import { qualityMessageKey } from '@/entities/bss';
import type { FormatMessageFn, MessageKey } from '@/shared/i18n';
import {
  formatBandField,
  formatCountry,
  formatEncryption,
  formatFrequency,
  formatMaxRate,
  formatNoiseDbm,
  formatPhyMode,
  formatRelativeSeen,
  formatSecurity,
  formatSignalPct,
  formatSnrDetails,
  formatWidthField,
} from '@/entities/bss';

export type CompareCell = {
  value: string;
  unavailable?: boolean;
};

export type CompareFieldRow = {
  id: string;
  labelKey: MessageKey;
  cells: CompareCell[];
  differs: boolean;
};

type ExtractContext = {
  formatMessage: FormatMessageFn;
  hiddenSsidLabel: string;
  unavailableLabel: string;
};

type FieldDef = {
  id: string;
  labelKey: MessageKey;
  cell: (row: ScanGridRow, ctx: ExtractContext) => CompareCell;
};

function cell(value: string, unavailable = false): CompareCell {
  return { value, unavailable };
}

const FIELD_DEFS: FieldDef[] = [
  {
    id: 'ssid',
    labelKey: 'scan.details.ssid',
    cell: (row, ctx) => cell(row.ssidHidden ? ctx.hiddenSsidLabel : row.ssid || '—'),
  },
  {
    id: 'bssid',
    labelKey: 'scan.details.bssid',
    cell: (row) => cell(row.bssid),
  },
  {
    id: 'band',
    labelKey: 'scan.details.band',
    cell: (row) => cell(formatBandField(row)),
  },
  {
    id: 'vendor',
    labelKey: 'scan.details.vendor',
    cell: (row) => cell(row.vendor ?? '—', !row.vendor),
  },
  {
    id: 'phyMode',
    labelKey: 'scan.details.phyMode',
    cell: (row) => cell(formatPhyMode(row.phyMode)),
  },
  {
    id: 'maxRateMbps',
    labelKey: 'scan.details.maxRateMbps',
    cell: (row) => {
      const bss = row.source;
      return cell(formatMaxRate(bss), !bss.maxRate);
    },
  },
  {
    id: 'signalQuality',
    labelKey: 'scan.details.signalQuality',
    cell: (row, ctx) => cell(ctx.formatMessage(qualityMessageKey(row.signalQuality))),
  },
  {
    id: 'channel',
    labelKey: 'scan.details.channel',
    cell: (row) => cell(String(row.channel)),
  },
  {
    id: 'signalPct',
    labelKey: 'scan.details.signalPct',
    cell: (row) => cell(formatSignalPct(row.signalBarPct)),
  },
  {
    id: 'noiseDbm',
    labelKey: 'scan.details.noiseDbm',
    cell: (row) => cell(formatNoiseDbm(row.noiseDbm), row.noiseDbm == null),
  },
  {
    id: 'networkType',
    labelKey: 'scan.details.networkType',
    cell: (row, ctx) => {
      const key = row.networkType === 'ibss' ? 'scan.type.ibss' : 'scan.type.infrastructure';
      return cell(ctx.formatMessage(key));
    },
  },
  {
    id: 'security',
    labelKey: 'scan.details.security',
    cell: (row) => cell(formatSecurity(row)),
  },
  {
    id: 'encryption',
    labelKey: 'scan.details.encryption',
    cell: (row) => {
      const enc = formatEncryption(row.source);
      return cell(enc.value, enc.unavailable);
    },
  },
  {
    id: 'channelWidth',
    labelKey: 'scan.details.channelWidth',
    cell: (row) => cell(formatWidthField(row)),
  },
  {
    id: 'snrDb',
    labelKey: 'scan.details.snrDb',
    cell: (row) => cell(formatSnrDetails(row.snrDb), row.snrDb == null),
  },
  {
    id: 'frequencyMHz',
    labelKey: 'scan.details.frequencyMHz',
    cell: (row) => {
      const bss = row.source;
      return cell(formatFrequency(bss), bss.channel.primaryCenterMhz == null);
    },
  },
  {
    id: 'country',
    labelKey: 'scan.details.country',
    cell: (row) => {
      const country = formatCountry(row.source);
      return cell(country.value, country.unavailable);
    },
  },
  {
    id: 'firstSeen',
    labelKey: 'scan.details.firstSeen',
    cell: (row) => cell(formatRelativeSeen(row.source.presence.firstSeenAt)),
  },
  {
    id: 'lastSeen',
    labelKey: 'scan.details.lastSeen',
    cell: (row) => cell(formatRelativeSeen(row.source.presence.lastSeenAt)),
  },
  {
    id: 'connected',
    labelKey: 'scan.details.connected',
    cell: (row, ctx) => cell(row.connected ? ctx.formatMessage('scan.details.connected') : '—'),
  },
];

function cellsDiffer(cells: CompareCell[]): boolean {
  if (cells.length < 2) return false;
  const first = cells[0]?.value ?? '';
  return cells.some((c) => c.value !== first);
}

export function buildCompareFieldRows(
  rows: readonly ScanGridRow[],
  formatMessage: FormatMessageFn,
  hiddenSsidLabel: string,
  unavailableLabel: string
): CompareFieldRow[] {
  if (rows.length === 0) return [];
  const ctx: ExtractContext = { formatMessage, hiddenSsidLabel, unavailableLabel };
  return FIELD_DEFS.map((def) => {
    const cells = rows.map((row) => def.cell(row, ctx));
    return {
      id: def.id,
      labelKey: def.labelKey,
      cells,
      differs: cellsDiffer(cells),
    };
  });
}
