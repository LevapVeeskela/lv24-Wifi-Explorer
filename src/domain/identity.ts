/**
 * Идентичность сети: BSS (радиоточка) vs SSID/ESS (логическое имя).
 *
 * Один SSID часто живёт на нескольких BSSID (несколько AP / band steering /
 * mesh). Атомарная единица скана — BSS. Группа ESS собирается отдельно.
 */

/** BSSID: lowercase `aa:bb:cc:dd:ee:ff`. Пусто без Location Services. */
export type Bssid = string & { readonly __brand: 'Bssid' };

/** 24-битный OUI из первых трёх октетов BSSID (`aa:bb:cc`). */
export type Oui24 = string & { readonly __brand: 'Oui24' };

/**
 * SSID как hex октетов (0–32 байта). Ключ группировки, не зависящий от UTF-8.
 * Скрытая сеть: пустая строка — но такие BSS **нельзя** сливать в одну группу.
 */
export type SsidOctetHex = string & { readonly __brand: 'SsidOctetHex' };

/** ISO-8601 timestamp в UTC. */
export type IsoTime = string & { readonly __brand: 'IsoTime' };

/**
 * Доступ к SSID / BSSID / countryCode на современном macOS
 * требует включённых Служб геолокации и согласия пользователя.
 */
export type LocationAuthorization =
  | 'granted'
  | 'denied'
  | 'not-determined'
  | 'restricted';

export type LocationGated<T> =
  | { status: 'available'; value: T }
  | { status: 'redacted'; reason: 'location-required' };

export interface SsidIdentity {
  /** UTF-8/WinLatin1 представление; null, если октеты не кодируются. */
  utf8: string | null;
  /** Сырые 0–32 октета из `CWNetwork.ssidData`. */
  octets: readonly number[];
  octetHex: SsidOctetHex;
  /**
   * Скрытый SSID: пустые октеты или сеть, вернувшаяся только при
   * `scanForNetworksWithSSID:includeHidden:`.
   */
  hidden: boolean;
  /** Для UI: utf8, иначе `<hidden>` или `hex:…`. Не ключ группировки. */
  displayName: string;
}

/**
 * Ключ ESS-группы.
 * - видимый SSID → `ess:<octetHex>`
 * - IBSS → `ibss:<octetHex>:<bssid>` (ad-hoc не роумится как ESS)
 * - скрытый → `hidden-bss:<bssid>` (пустые SSID не сливать)
 */
export type EssGroupKey = string & { readonly __brand: 'EssGroupKey' };

/** Равенство как у `CWNetwork.isEqualToNetwork:` — пара (ssidData, bssid). */
export interface BssIdentity {
  bssid: LocationGated<Bssid>;
  ssid: LocationGated<SsidIdentity>;
}

/** Пометить строку как BSSID. */
export function asBssid(value: string): Bssid {
  return value as Bssid;
}

/** Пометить строку как 24-битный OUI. */
export function asOui24(value: string): Oui24 {
  return value as Oui24;
}

/** Пометить hex октетов SSID. */
export function asSsidOctetHex(value: string): SsidOctetHex {
  return value as SsidOctetHex;
}

/** Пометить ключ ESS-группы. */
export function asEssGroupKey(value: string): EssGroupKey {
  return value as EssGroupKey;
}

/** Нормализовать метку времени в ISO-8601 UTC. */
export function asIsoTime(value: string | Date): IsoTime {
  return (typeof value === 'string' ? value : value.toISOString()) as IsoTime;
}

/**
 * Нижний регистр `aa:bb:cc:dd:ee:ff`.
 * @returns null, если нет ровно 6 октетов.
 */
export function normalizeBssid(raw: string | null | undefined): Bssid | null {
  if (raw == null) return null;
  const hex = raw.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  if (hex.length !== 12 || !/^[0-9a-f]+$/.test(hex)) return null;
  const pairs = hex.match(/.{2}/g);
  if (!pairs || pairs.length !== 6) return null;
  return asBssid(pairs.join(':'));
}

/** Hex октетов SSID (ключ группировки по ssidData). */
export function octetHexOf(octets: readonly number[]): SsidOctetHex {
  return asSsidOctetHex(
    octets.map((b) => (b & 0xff).toString(16).padStart(2, '0')).join(''),
  );
}

/** Октеты из ssidData, иначе UTF-8 от ssid, иначе пусто. */
export function octetsFromSsidFields(
  ssidData: readonly number[] | null | undefined,
  ssid: string | null | undefined,
): number[] {
  if (ssidData != null) return [...ssidData].map((b) => b & 0xff);
  if (ssid != null) return [...new TextEncoder().encode(ssid)];
  return [];
}

/**
 * Ключ сопоставления BSS между циклами скана.
 * Есть BSSID → `bssid:…`; иначе anon(ssidData, канал, полоса, ibss).
 */
export function bssMatchKeyFromRaw(raw: {
  bssid: string | null;
  ssidData: readonly number[] | null;
  ssid: string | null;
  channelNumber: number | null;
  channelBand: string;
  ibss: boolean;
}): string {
  const bssid = normalizeBssid(raw.bssid);
  if (bssid) return `bssid:${bssid}`;
  const hex = octetHexOf(octetsFromSsidFields(raw.ssidData, raw.ssid));
  const ch = raw.channelNumber ?? -1;
  return `anon:${hex}:${ch}:${raw.channelBand}:${raw.ibss ? 1 : 0}`;
}
