import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { ssidGridLabel } from '@/entities/bss/scanGridRow';
import type { GraphLabelMode } from './types';

export type GraphLabelRow = Pick<
  ScanGridRow,
  'ssidHidden' | 'ssid' | 'bssid' | 'vendor' | 'apName' | 'annotation'
>;

/**
 * Chart / spectrum label from Settings → Advanced → graph labels.
 *
 * `apName` fallback chain: WPS device name → vendor → BSSID.
 * WPS name is the only name the AP actually claims; vendor and BSSID are
 * honest stand-ins when it is absent (never invented).
 */
export function graphLabelForRow(
  row: GraphLabelRow | null,
  mode: GraphLabelMode,
  hiddenSsidLabel: string
): string {
  if (!row) return '';

  switch (mode) {
    case 'annotation': {
      const text = row.annotation.trim();
      if (text) return text;
      return ssidGridLabel(row, hiddenSsidLabel);
    }
    case 'apName': {
      const apName = row.apName?.trim();
      if (apName) return apName;
      const vendor = row.vendor?.trim();
      if (vendor) return vendor;
      return row.bssid;
    }
    case 'ssid':
    default:
      return ssidGridLabel(row, hiddenSsidLabel);
  }
}
