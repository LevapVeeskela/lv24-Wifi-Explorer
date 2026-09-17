/**
 * Фильтры таблицы по уже построенным ObservedBss.
 */

import type { ObservedBss } from '../domain/bss';
import type { ScanFilter } from '../domain/filters';

function fold(value: string): string {
  return value.trim().toLowerCase();
}

function ssidHaystack(bss: ObservedBss): string | null {
  if (bss.identity.ssid.status === 'redacted') return null;
  const ssid = bss.identity.ssid.value;
  return `${ssid.displayName} ${ssid.utf8 ?? ''}`.toLowerCase();
}

function vendorHaystack(bss: ObservedBss): string {
  const parts: string[] = [];
  if (bss.vendor.oui) parts.push(bss.vendor.oui);
  // Randomized не матчится имени организации (её и нет).
  if (bss.vendor.match !== 'randomized' && bss.vendor.organization) {
    parts.push(bss.vendor.organization);
  }
  return parts.join(' ').toLowerCase();
}

function isHidden(bss: ObservedBss): boolean {
  if (bss.identity.ssid.status === 'redacted') return true;
  return bss.identity.ssid.value.hidden;
}

export function matchesScanFilter(bss: ObservedBss, filter: ScanFilter): boolean {
  if (filter.bands !== 'all') {
    if (bss.channel.band === 'unknown' || !filter.bands.includes(bss.channel.band)) {
      return false;
    }
  }

  if (filter.security === 'open' && !bss.security.isOpen) return false;
  if (filter.security === 'secure' && !bss.security.isSecure) return false;

  const ssidQ = fold(filter.ssidQuery);
  if (ssidQ) {
    const hay = ssidHaystack(bss);
    if (hay == null || !hay.includes(ssidQ)) return false;
  }

  const vendorQ = fold(filter.vendorQuery);
  if (vendorQ && !vendorHaystack(bss).includes(vendorQ)) return false;

  if (filter.minRssiDbm != null && bss.signal.rssiDbm < filter.minRssiDbm) return false;

  if (filter.minSnrDb != null) {
    if (bss.signal.snrDb == null || bss.signal.snrDb < filter.minSnrDb) return false;
  }

  if (filter.presence !== 'all' && !filter.presence.includes(bss.presence.presence)) {
    return false;
  }

  if (!filter.includeIbss && bss.ibss) return false;
  if (!filter.includeHiddenSsid && isHidden(bss)) return false;

  return true;
}

export function applyScanFilter(
  rows: readonly ObservedBss[],
  filter: ScanFilter,
): ObservedBss[] {
  return rows.filter((row) => matchesScanFilter(row, filter));
}
