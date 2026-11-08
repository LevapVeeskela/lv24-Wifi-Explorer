import { asOui24, normalizeBssid, type Oui24 } from './identity';

/**
 * Производитель по OUI.
 *
 * Источник: локальный файл реестра IEEE MA-L (24 бита), не вшитая
 * база стороннего приложения. Первые 3 октета BSSID.
 *
 * Ограничения:
 * - MA-M (28 бит) и MA-S (36 бит) по 24 битам неоднозначны.
 * - Локально администрируемый MAC (U/L bit = 1) — randomized, без вендора.
 * - I/G bit = 1 (multicast) для BSSID почти не встречается; помечаем.
 */

export type VendorMatch = 'ieee-mal-24' | 'randomized' | 'unknown' | 'bssid-redacted';

export interface VendorView {
  oui: Oui24 | null;
  /** Второй младший бит первого октета (U/L). */
  locallyAdministered: boolean;
  /** Младший бит первого октета (I/G). */
  multicast: boolean;
  organization: string | null;
  match: VendorMatch;
  /** Имя локального файла реестра (например `oui/ieee-mal.txt`). */
  registryFile: string | null;
}

/** Запись локального IEEE MA-L. */
export interface OuiRegistryRecord {
  oui: Oui24;
  organization: string;
}

/**
 * Минимальный контракт реестра (типы, не реализация).
 * Поиск: нормализовать BSSID → первые 3 октета → MA-L map.
 */
export interface OuiRegistry {
  readonly format: 'ieee-mal-24';
  readonly fileName: string;
  readonly generatedAt: string;
}

/** Первый октет BSSID (0–255) или null, если MAC не разобрать. */
export function firstOctet(bssid: string): number | null {
  const norm = normalizeBssid(bssid);
  if (!norm) return null;
  const value = Number.parseInt(norm.slice(0, 2), 16);
  return Number.isFinite(value) ? value : null;
}

/**
 * U/L bit: второй младший бит первого октета.
 * 1 → локально администрируемый / randomized MAC, без вендора IEEE.
 */
export function isLocallyAdministered(bssid: string): boolean {
  const octet = firstOctet(bssid);
  if (octet == null) return false;
  return (octet & 0x02) !== 0;
}

/** Синоним: randomized, если выставлен U/L. */
export function isRandomizedMac(bssid: string): boolean {
  return isLocallyAdministered(bssid);
}

/** I/G bit: младший бит первого октета (multicast). */
export function isMulticastMac(bssid: string): boolean {
  const octet = firstOctet(bssid);
  if (octet == null) return false;
  return (octet & 0x01) !== 0;
}

/** Первые 3 октета нормализованного BSSID. */
export function ouiFromBssid(bssid: string): Oui24 | null {
  const norm = normalizeBssid(bssid);
  if (!norm) return null;
  return asOui24(norm.slice(0, 8));
}

/**
 * Флаги вендора без реестра MA-L.
 * U/L = 1 → match=`randomized`, organization не заполняем.
 */
export function vendorFlagsFromBssid(
  bssid: string
): Pick<VendorView, 'oui' | 'locallyAdministered' | 'multicast' | 'match'> {
  const oui = ouiFromBssid(bssid);
  const locallyAdministered = isLocallyAdministered(bssid);
  const multicast = isMulticastMac(bssid);
  return {
    oui,
    locallyAdministered,
    multicast,
    match: locallyAdministered ? 'randomized' : 'unknown',
  };
}
