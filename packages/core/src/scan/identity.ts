/**
 * Идентичность BSS: нормализация BSSID/SSID и ключ сопоставления между сканами.
 */

import type { CoreWlanNetworkRecord, ObservedBss } from '../domain/bss';
import type { BandGhz, CoreWlanChannelBand } from '../domain/channel';
import type {
  Bssid,
  IsoTime,
  LocationAuthorization,
  LocationGated,
  Oui24,
  SsidIdentity,
  SsidOctetHex,
} from '../domain/identity';

export function asIsoTime(value: string | Date): IsoTime {
  return (typeof value === 'string' ? value : value.toISOString()) as IsoTime;
}

export function asBssid(value: string): Bssid {
  return value as Bssid;
}

export function asOui24(value: string): Oui24 {
  return value as Oui24;
}

export function asSsidOctetHex(value: string): SsidOctetHex {
  return value as SsidOctetHex;
}

/** Нижний регистр `aa:bb:cc:dd:ee:ff`, либо null если строка не 6 октетов. */
export function normalizeBssid(raw: string | null | undefined): Bssid | null {
  if (raw == null) return null;
  const hex = raw.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  if (hex.length !== 12 || !/^[0-9a-f]+$/.test(hex)) return null;
  const pairs = hex.match(/.{2}/g);
  if (!pairs || pairs.length !== 6) return null;
  return asBssid(pairs.join(':'));
}

export function octetHexOf(octets: readonly number[]): SsidOctetHex {
  return asSsidOctetHex(octets.map((b) => (b & 0xff).toString(16).padStart(2, '0')).join(''));
}

export function octetsFromRaw(raw: CoreWlanNetworkRecord): number[] {
  if (raw.ssidData != null) return [...raw.ssidData].map((b) => b & 0xff);
  if (raw.ssid != null) return [...new TextEncoder().encode(raw.ssid)];
  return [];
}

export function decodeSsidUtf8(octets: readonly number[]): string | null {
  if (octets.length === 0) return '';
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(octets));
  } catch {
    return null;
  }
}

export function ssidDisplayName(
  identity: Pick<SsidIdentity, 'hidden' | 'utf8' | 'octetHex'>
): string {
  if (identity.hidden) return '<hidden>';
  if (identity.utf8) return identity.utf8;
  return `hex:${identity.octetHex}`;
}

export function buildSsidIdentity(raw: CoreWlanNetworkRecord): SsidIdentity {
  const octets = octetsFromRaw(raw);
  const hidden = octets.length === 0;
  const utf8 = decodeSsidUtf8(octets);
  const octetHex = octetHexOf(octets);
  return {
    utf8,
    octets,
    octetHex,
    hidden,
    displayName: ssidDisplayName({ hidden, utf8, octetHex }),
  };
}

/**
 * Location: явный denied/restricted → redacted.
 * granted → available (даже если поле null).
 * иначе — по наличию хотя бы одного gated-поля в сыром рекорде.
 */
export function locationFieldsAvailable(
  raw: CoreWlanNetworkRecord,
  location?: LocationAuthorization
): boolean {
  if (location === 'denied' || location === 'restricted') return false;
  // Location can be "granted" while CoreWLAN still returns no identity fields
  // (unsigned helper / TCC identity). That is redaction, not a hidden SSID:
  // a genuinely hidden network carries an empty (non-null) ssidData array.
  const identityMissing = raw.bssid == null && raw.ssid == null && raw.ssidData == null;
  if (location === 'granted') return !identityMissing;
  if (identityMissing) return false;
  return raw.bssid != null || raw.ssid != null || raw.ssidData != null || raw.countryCode != null;
}

export function gateValue<T>(available: boolean, value: T): LocationGated<T> {
  if (!available) return { status: 'redacted', reason: 'location-required' };
  return { status: 'available', value };
}

export function bandToCore(band: BandGhz | 'unknown'): CoreWlanChannelBand {
  if (band === 2.4) return '2ghz';
  if (band === 5) return '5ghz';
  if (band === 6) return '6ghz';
  return 'unknown';
}

/** Ключ равенства между циклами: BSSID, иначе anon(ssid, channel, band, ibss). */
export function matchKeyFromRaw(raw: CoreWlanNetworkRecord): string {
  const bssid = normalizeBssid(raw.bssid);
  if (bssid) return `bssid:${bssid}`;
  const hex = octetHexOf(octetsFromRaw(raw));
  const ch = raw.channelNumber ?? -1;
  return `anon:${hex}:${ch}:${raw.channelBand}:${raw.ibss ? 1 : 0}`;
}

export function bssMatchKey(bss: ObservedBss): string {
  return matchKeyFromRaw(bss.lastRaw);
}
