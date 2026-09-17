/**
 * Поверхностный TLV-проход informationElementData.
 * Глубокий RNR/FILS/EHT-320 / vendor beyond WPA — не разбираем.
 */

import type { ShallowIeView } from '../domain/ie';

const ID_COUNTRY = 7;
const ID_HT_CAP = 45;
const ID_RSN = 48;
const ID_HT_OP = 61;
const ID_VHT_CAP = 191;
const ID_VHT_OP = 192;
const ID_VENDOR = 221;
const ID_EXT = 255;

const EXT_HE_CAP = 35;
const EXT_EHT_CAP = 108;

const WPA_OUI = [0x00, 0x50, 0xf2] as const;
const WPA_TYPE = 0x01;

function emptyIe(level: ShallowIeView['level'], byteLength: number): ShallowIeView {
  return {
    level,
    byteLength,
    presentIds: [],
    wpaVendorIe: level === 'shallow-tags' ? false : null,
    rsnIe: level === 'shallow-tags' ? false : null,
    htCapabilities: level === 'shallow-tags' ? false : null,
    vhtCapabilities: level === 'shallow-tags' ? false : null,
    heCapabilities: level === 'shallow-tags' ? false : null,
    ehtCapabilities: level === 'shallow-tags' ? false : null,
    countryFromIe: null,
    nssHint: null,
    htPrimaryChannel: null,
    htSecondaryOffset: null,
    ccfs0: null,
  };
}

/** 2-битная MCS map (VHT/HE): 3 = not supported. Допустимые nss: 1|2|3|4|8. */
function nssFromMcsMap(lo: number, hi: number): 1 | 2 | 3 | 4 | 8 | null {
  const map = (lo & 0xff) | ((hi & 0xff) << 8);
  let nss = 0;
  for (let i = 0; i < 8; i += 1) {
    const bits = (map >> (i * 2)) & 0b11;
    if (bits !== 3) nss = i + 1;
  }
  if (nss === 0) return null;
  if (nss >= 8) return 8;
  if (nss === 5 || nss === 6 || nss === 7) return 4;
  return nss as 1 | 2 | 3 | 4;
}

function nssFromHtCap(payload: readonly number[]): 1 | 2 | 3 | 4 | 8 | null {
  // HT Cap Info (2) + A-MPDU (1) + MCS set. Нужны хотя бы 4 байта MCS (1–4 SS).
  if (payload.length < 7) return null;
  let nss: 1 | 2 | 3 | 4 | null = null;
  for (let ss = 0; ss < 4; ss += 1) {
    if (payload[3 + ss] !== 0) nss = (ss + 1) as 1 | 2 | 3 | 4;
  }
  return nss;
}

function nssFromVhtCap(payload: readonly number[]): 1 | 2 | 3 | 4 | 8 | null {
  // VHT Cap Info (4) + Rx MCS map (2).
  if (payload.length < 6) return null;
  return nssFromMcsMap(payload[4], payload[5]);
}

function nssFromHeCap(afterExtId: readonly number[]): 1 | 2 | 3 | 4 | 8 | null {
  // HE MAC (6) + HE PHY (11) + Rx MCS ≤80 (2).
  if (afterExtId.length < 19) return null;
  return nssFromMcsMap(afterExtId[17], afterExtId[18]);
}

function countryFromPayload(payload: readonly number[]): string | null {
  if (payload.length < 2) return null;
  const a = payload[0];
  const b = payload[1];
  if (a < 0x41 || a > 0x5a || b < 0x41 || b > 0x5a) return null;
  return String.fromCharCode(a, b);
}

function htSecondaryOffset(payload: readonly number[]): -1 | 0 | 1 | null {
  if (payload.length < 2) return null;
  const raw = payload[1] & 0b11;
  if (raw === 0) return 0;
  if (raw === 1) return 1;
  if (raw === 3) return -1;
  return null;
}

function maxNss(
  a: 1 | 2 | 3 | 4 | 8 | null,
  b: 1 | 2 | 3 | 4 | 8 | null,
): 1 | 2 | 3 | 4 | 8 | null {
  if (a == null) return b;
  if (b == null) return a;
  return a > b ? a : b;
}

export function parseShallowIe(data: readonly number[] | null): ShallowIeView {
  if (data == null || data.length === 0) return emptyIe('absent', data?.length ?? 0);

  const presentIds: number[] = [];
  let wpaVendorIe = false;
  let rsnIe = false;
  let htCapabilities = false;
  let vhtCapabilities = false;
  let heCapabilities = false;
  let ehtCapabilities = false;
  let countryFromIe: string | null = null;
  let nssHint: 1 | 2 | 3 | 4 | 8 | null = null;
  let htPrimaryChannel: number | null = null;
  let htSecondary: -1 | 0 | 1 | null = null;
  let ccfs0: number | null = null;

  let offset = 0;
  let parsedAny = false;
  while (offset < data.length) {
    const id = data[offset];
    if (offset + 1 >= data.length) break;
    const len = data[offset + 1];
    if (len < 0 || offset + 2 + len > data.length) break;
    const payload = data.slice(offset + 2, offset + 2 + len);
    parsedAny = true;
    if (!presentIds.includes(id)) presentIds.push(id);

    if (id === ID_COUNTRY) {
      countryFromIe = countryFromPayload(payload) ?? countryFromIe;
    } else if (id === ID_HT_CAP) {
      htCapabilities = true;
      nssHint = maxNss(nssHint, nssFromHtCap(payload));
    } else if (id === ID_RSN) {
      rsnIe = true;
    } else if (id === ID_HT_OP) {
      if (payload.length >= 1) htPrimaryChannel = payload[0];
      htSecondary = htSecondaryOffset(payload);
    } else if (id === ID_VHT_CAP) {
      vhtCapabilities = true;
      nssHint = maxNss(nssHint, nssFromVhtCap(payload));
    } else if (id === ID_VHT_OP) {
      if (payload.length >= 2) ccfs0 = payload[1];
    } else if (id === ID_VENDOR) {
      if (
        payload.length >= 4 &&
        payload[0] === WPA_OUI[0] &&
        payload[1] === WPA_OUI[1] &&
        payload[2] === WPA_OUI[2] &&
        payload[3] === WPA_TYPE
      ) {
        wpaVendorIe = true;
      }
    } else if (id === ID_EXT && payload.length >= 1) {
      const extId = payload[0];
      const rest = payload.slice(1);
      if (extId === EXT_HE_CAP) {
        heCapabilities = true;
        nssHint = maxNss(nssHint, nssFromHeCap(rest));
      } else if (extId === EXT_EHT_CAP) {
        ehtCapabilities = true;
      }
    }

    offset += 2 + len;
  }

  if (!parsedAny) {
    return emptyIe('raw-only', data.length);
  }

  return {
    level: 'shallow-tags',
    byteLength: data.length,
    presentIds,
    wpaVendorIe,
    rsnIe,
    htCapabilities,
    vhtCapabilities,
    heCapabilities,
    ehtCapabilities,
    countryFromIe,
    nssHint,
    htPrimaryChannel,
    htSecondaryOffset: htSecondary,
    ccfs0,
  };
}
