import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { ssidGridLabel } from '@/entities/bss/scanGridRow';
import type { GraphLabelMode } from './types';

export type GraphLabelRow = Pick<
  ScanGridRow,
  'ssidHidden' | 'ssid' | 'bssid' | 'vendor' | 'annotation'
>;

/** Chart / spectrum label from Settings → Advanced → graph labels. */
export function graphLabelForRow(
  row: GraphLabelRow | null,
  mode: GraphLabelMode,
  hiddenSsidLabel: string,
): string {
  if (!row) return '';

  switch (mode) {
    case 'annotation': {
      const text = row.annotation.trim();
      if (text) return text;
      return ssidGridLabel(row, hiddenSsidLabel);
    }
    case 'apName': {
      const vendor = row.vendor?.trim();
      if (vendor) return vendor;
      return row.bssid;
    }
    case 'ssid':
    default:
      return ssidGridLabel(row, hiddenSsidLabel);
  }
}
