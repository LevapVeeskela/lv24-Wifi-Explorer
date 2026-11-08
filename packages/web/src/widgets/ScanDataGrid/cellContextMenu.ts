/** Cell context-menu helpers: build a scan-search query from a clicked cell. */
import type { ScanGridRow } from '@/entities/bss';

/** Grid fields that can be turned into a scan-search query. */
export const FILTERABLE_CELL_FIELDS = [
  'ssid',
  'bssid',
  'vendor',
  'channel',
  'band',
  'phyMode',
  'security',
  'annotation',
] as const;

const PHY_MODE_TOKENS = new Set([
  'a',
  'b',
  'g',
  'n',
  'ac',
  'ax',
  'be',
  '11n',
  '11ac',
  '11ax',
  '11be',
  '802.11a',
  '802.11b',
  '802.11g',
  '802.11n',
  '802.11ac',
  '802.11ax',
  '802.11be',
]);

/** SecurityKind (`securityLabel`) → scan-search shortcut. */
const SECURITY_TOKENS: Record<string, string> = {
  open: 'open',
  wep: 'wep',
  'wpa-personal': 'wpa',
  'wpa-personal-mixed': 'wpa',
  'wpa2-personal': 'wpa2',
  'wpa2-enterprise': '802.1x',
  'wpa3-personal': 'wpa3',
  'wpa3-transition': 'wpa3',
  'wpa3-enterprise': '802.1x',
  owe: 'owe',
};

const MAC_PATTERN = /^[0-9a-f]{2}([:-][0-9a-f]{2}){5}$/i;

/** Values without spaces/quotes/backslashes fit the keyed-value grammar as-is. */
const SAFE_KEYED_VALUE = /^[^\s()"\\]+$/;

function quotedPhrase(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function firstWord(value: string): string | null {
  const word = value.trim().split(/\s+/)[0];
  return word ? word : null;
}

/**
 * Build `field:value` for the clicked cell, or `null` when the field carries no
 * searchable value (internal columns, redacted/unknown data, empty cells).
 */
export function filterQueryForCell(row: ScanGridRow, field: string): string | null {
  switch (field) {
    case 'ssid': {
      if (row.ssidHidden) return null;
      const ssid = row.ssid.trim();
      if (!ssid) return null;
      // Keyed values cannot contain spaces; a quoted phrase is an exact match.
      return SAFE_KEYED_VALUE.test(ssid) ? `ssid:${ssid}` : quotedPhrase(ssid);
    }
    case 'bssid':
      return MAC_PATTERN.test(row.bssid) ? `bssid:${row.bssid.toLowerCase()}` : null;
    case 'vendor': {
      const vendor = row.vendor ? firstWord(row.vendor) : null;
      return vendor ? `vendor:${vendor}` : null;
    }
    case 'channel':
      return Number.isFinite(row.channel) ? `channel:${row.channel}` : null;
    case 'band':
      return typeof row.band === 'number' ? `band:${row.band}` : null;
    case 'phyMode': {
      const mode = row.phyMode.trim().toLowerCase();
      return PHY_MODE_TOKENS.has(mode) ? `mode:${mode}` : null;
    }
    case 'security': {
      const token = SECURITY_TOKENS[row.securityLabel];
      if (token) return token;
      return row.securityOpen ? 'open' : null;
    }
    case 'annotation': {
      const annotation = row.annotation.trim();
      return annotation ? quotedPhrase(annotation) : null;
    }
    default:
      return null;
  }
}

/**
 * Next column-visibility model with `field` made visible.
 * `null` means "no change" (already visible or not a tracked column).
 */
export function showColumnModel(
  model: Record<string, boolean>,
  field: string
): Record<string, boolean> | null {
  if (model[field] !== false) return null;
  return { ...model, [field]: true };
}
