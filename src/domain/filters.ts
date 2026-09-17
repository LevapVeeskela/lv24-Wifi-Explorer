/**
 * Фильтры таблицы скана.
 *
 * Все предикаты — по уже построенным ObservedBss / EssGroup,
 * не повторный опрос CoreWLAN.
 */

import type { ObservedBss } from './bss';
import type { BandGhz } from './channel';
import type { Presence } from './timeseries';

export type SecurityFilter = 'any' | 'open' | 'secure';

export interface ScanFilter {
  bands: readonly BandGhz[] | 'all';
  security: SecurityFilter;
  /** Подстрока по displayName / utf8, без учёта регистра. */
  ssidQuery: string;
  /** Подстрока по organization / OUI. Randomized не матчится имени. */
  vendorQuery: string;
  /** Нижняя граница RSSI (dBm), включительно. null — выкл. */
  minRssiDbm: number | null;
  /** Нижняя граница SNR (dB). BSS без SNR отбрасывается, если задано. */
  minSnrDb: number | null;
  presence: readonly Presence[] | 'all';
  includeIbss: boolean;
  includeHiddenSsid: boolean;
}

export const SCAN_FILTER_DEFAULTS: ScanFilter = {
  bands: 'all',
  security: 'any',
  ssidQuery: '',
  vendorQuery: '',
  minRssiDbm: null,
  minSnrDb: null,
  presence: 'all',
  includeIbss: true,
  includeHiddenSsid: true,
};

/**
 * Семантика security-фильтра:
 * - open → `security.isOpen`
 * - secure → `security.isSecure` (PSK/802.1X/OWE)
 * WEP считается secure (не open), хотя и слабый.
 */
export const SECURITY_FILTER_NOTES = {
  openMeansNoneOnly: true,
  oweCountsAsSecure: true,
  wepCountsAsSecure: true,
} as const;

function fold(value: string): string {
  return value.trim().toLowerCase();
}

function ssidHaystack(bss: ObservedBss): string | null {
  if (bss.identity.ssid.status === 'redacted') return null;
  const ssid = bss.identity.ssid.value;
  return `${ssid.displayName} ${ssid.utf8 ?? ''}`.toLowerCase();
}

function bssidHaystack(bss: ObservedBss): string {
  if (bss.identity.bssid.status === 'available') {
    return bss.identity.bssid.value.toLowerCase();
  }
  return (bss.lastRaw.bssid ?? '').toLowerCase();
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

/**
 * Предикат фильтра по уже построенному ObservedBss.
 * ssidQuery ищет в SSID и в BSSID (подстрока, без регистра).
 */
export function matchesScanFilter(bss: ObservedBss, filter: ScanFilter): boolean {
  if (filter.bands !== 'all') {
    if (bss.channel.band === 'unknown' || !filter.bands.includes(bss.channel.band)) {
      return false;
    }
  }

  if (filter.security === 'open' && !bss.security.isOpen) return false;
  if (filter.security === 'secure' && !bss.security.isSecure) return false;

  const textQuery = fold(filter.ssidQuery);
  if (textQuery) {
    const ssid = ssidHaystack(bss);
    const mac = bssidHaystack(bss);
    const ssidHit = ssid != null && ssid.includes(textQuery);
    const bssidHit = mac.includes(textQuery);
    if (!ssidHit && !bssidHit) return false;
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

/** Отфильтровать таблицу BSS. */
export function applyScanFilter(
  rows: readonly ObservedBss[],
  filter: ScanFilter,
): ObservedBss[] {
  return rows.filter((row) => matchesScanFilter(row, filter));
}
