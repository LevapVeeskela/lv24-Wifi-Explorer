/**
 * Поверхностный decode IE: только публичные поля IEEE 802.11,
 * и только если байты целиком на месте. Неизвестный тег → id + hex.
 */

import { asciiLetters, formatOui, toHex, u16le, walkIeTlvs } from './bytes';
import type {
  AkmName,
  AkmSuite,
  CipherName,
  CipherSuite,
  CountryTriplet,
  DecodedIe,
  IeDecodeResult,
  IeParseLevel,
  ShallowIeView,
  SpatialStreamHint,
} from './types';

const ID_SSID = 0;
const ID_RATES = 1;
const ID_TIM = 5;
const ID_DS = 3;
const ID_COUNTRY = 7;
const ID_BSS_LOAD = 11;
const ID_PWR_CONSTRAINT = 32;
const ID_HT_CAP = 45;
const ID_RSN = 48;
const ID_EXT_RATES = 50;
const ID_HT_OP = 61;
const ID_MOBILITY_DOMAIN = 54;
const ID_VHT_CAP = 191;
const ID_VHT_OP = 192;
const ID_EXT_CAP = 127;
const ID_VENDOR = 221;
const ID_RSNX = 244;
const ID_EXT = 255;

const EXT_HE_CAP = 35;
const EXT_HE_OP = 36;
const EXT_EHT_CAP = 108;

const IEEE_SUITE_OUI = '00:0f:ac';
const WPA_OUI = [0x00, 0x50, 0xf2] as const;
const WPA_TYPE = 0x01;
const WPS_TYPE = 0x04;
const WPS_SUBELEMENT_DEVICE_NAME = 0x1011;
const WPS_DEVICE_NAME_MAX_CHARS = 64;

const CIPHER_NAMES: Record<number, CipherName> = {
  0: 'use-group',
  1: 'wep-40',
  2: 'tkip',
  4: 'ccmp-128',
  5: 'wep-104',
  6: 'bip-cmac-128',
  8: 'gcmp-128',
  9: 'gcmp-256',
  10: 'ccmp-256',
  11: 'bip-gmac-128',
  12: 'bip-gmac-256',
  13: 'bip-cmac-256',
};

const AKM_NAMES: Record<number, AkmName> = {
  1: 'ieee8021x',
  2: 'psk',
  3: 'ft-ieee8021x',
  4: 'ft-psk',
  5: 'ieee8021x-sha256',
  6: 'psk-sha256',
  7: 'tdls',
  8: 'sae',
  9: 'ft-sae',
  10: 'ap-peerkey',
  11: 'ieee8021x-suite-b',
  12: 'ieee8021x-suite-b-192',
  13: 'ft-ieee8021x-sha384',
  14: 'fils-sha256',
  15: 'fils-sha384',
  16: 'ft-fils-sha256',
  17: 'ft-fils-sha384',
  18: 'owe',
  24: 'sae-ext-key',
  25: 'ft-sae-ext-key',
};

function emptyShallow(level: IeParseLevel, byteLength: number): ShallowIeView {
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
    dtimPeriod: null,
    bssLoadStations: null,
    bssLoadUtilPct: null,
    bssLoadAdmission: null,
    mfpCapable: false,
    mfpRequired: false,
    mobilityDomain: false,
    wps: false,
    wpsDeviceName: null,
  };
}

function common(id: number, payload: readonly number[], extId: number | null = null) {
  return { id, extId, raw: payload, rawHex: toHex(payload) };
}

/** 2-битная MCS map (VHT/HE): 3 = not supported. Допустимые nss: 1|2|3|4|8. */
export function nssFromMcsMap(lo: number, hi: number): SpatialStreamHint | null {
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

export function nssFromHtMcsSet(mcsSet: readonly number[]): SpatialStreamHint | null {
  if (mcsSet.length < 4) return null;
  let nss: 1 | 2 | 3 | 4 | null = null;
  for (let ss = 0; ss < 4; ss += 1) {
    if (mcsSet[ss] !== 0) nss = (ss + 1) as 1 | 2 | 3 | 4;
  }
  return nss;
}

/** VHT Rx MCS map: 0=MCS0–7, 1=MCS0–8, 2=MCS0–9, 3=нет. */
export function maxMcsFromVhtMap(lo: number, hi: number): 7 | 8 | 9 | null {
  const map = (lo & 0xff) | ((hi & 0xff) << 8);
  let max: 7 | 8 | 9 | null = null;
  for (let i = 0; i < 8; i += 1) {
    const bits = (map >> (i * 2)) & 0b11;
    if (bits === 0) max = max == null || max < 7 ? 7 : max;
    else if (bits === 1) max = max == null || max < 8 ? 8 : max;
    else if (bits === 2) max = 9;
  }
  return max;
}

/** HE Rx MCS map: 0=MCS0–7, 1=MCS0–9, 2=MCS0–11, 3=нет. */
export function maxMcsFromHeMap(lo: number, hi: number): 7 | 9 | 11 | null {
  const map = (lo & 0xff) | ((hi & 0xff) << 8);
  let max: 7 | 9 | 11 | null = null;
  for (let i = 0; i < 8; i += 1) {
    const bits = (map >> (i * 2)) & 0b11;
    if (bits === 0) max = max == null || max < 7 ? 7 : max;
    else if (bits === 1) max = max == null || max < 9 ? 9 : max;
    else if (bits === 2) max = 11;
  }
  return max;
}

/** EHT Rx MCS map (≤80 MHz): 0=0–7, 1=0–9, 2=0–11, 3=0–13. */
export function maxMcsFromEhtMap(lo: number, hi: number): 7 | 9 | 11 | 13 | null {
  const map = (lo & 0xff) | ((hi & 0xff) << 8);
  let max: 7 | 9 | 11 | 13 | null = null;
  for (let i = 0; i < 8; i += 1) {
    const bits = (map >> (i * 2)) & 0b11;
    if (bits === 0) max = max == null || max < 7 ? 7 : max;
    else if (bits === 1) max = max == null || max < 9 ? 9 : max;
    else if (bits === 2) max = max == null || max < 11 ? 11 : max;
    else if (bits === 3) max = 13;
  }
  return max;
}

/** IEEE 802.11 Extended Capabilities — выборочные именованные биты (octet 0–3). */
const EXT_CAP_NAMED_BITS: readonly { octet: number; bit: number; name: string }[] = [
  { octet: 0, bit: 0, name: '20/40 BSS coexistence management' },
  { octet: 0, bit: 1, name: 'Generalized link' },
  { octet: 0, bit: 2, name: 'Extended channel switching' },
  { octet: 0, bit: 4, name: 'BSS transition' },
  { octet: 0, bit: 5, name: 'SSID list' },
  { octet: 0, bit: 6, name: 'Operating mode notification' },
  { octet: 1, bit: 0, name: 'UTF-8 SSID' },
  { octet: 1, bit: 2, name: 'TDLS peer U-APSD buffer STA support' },
  { octet: 1, bit: 3, name: 'TDLS peer PSM support' },
  { octet: 1, bit: 4, name: 'TDLS channel switching' },
  { octet: 2, bit: 0, name: 'Interworking' },
  { octet: 2, bit: 2, name: 'QoS map' },
  { octet: 2, bit: 3, name: 'EBR' },
  { octet: 2, bit: 4, name: 'SSPN interface' },
  { octet: 3, bit: 0, name: 'MSGCF capability' },
  { octet: 3, bit: 2, name: 'TDLS support' },
  { octet: 3, bit: 3, name: 'TDLS prohibited' },
  { octet: 3, bit: 4, name: 'TDLS channel switching prohibited' },
  { octet: 3, bit: 7, name: 'Extended spectrum management' },
];

function maxNss(
  a: SpatialStreamHint | null,
  b: SpatialStreamHint | null
): SpatialStreamHint | null {
  if (a == null) return b;
  if (b == null) return a;
  return a > b ? a : b;
}

function decodeSsid(payload: readonly number[]): DecodedIe {
  const hidden = payload.length === 0;
  let ssid = '';
  try {
    ssid = new TextDecoder('utf-8', { fatal: false }).decode(Uint8Array.from(payload));
  } catch {
    ssid = '';
  }
  return { ...common(ID_SSID, payload), id: 0, kind: 'ssid', ssid, octets: payload, hidden };
}

function decodeRates(id: 1 | 50, payload: readonly number[]): DecodedIe {
  const ratesMbps: number[] = [];
  const basicRatesMbps: number[] = [];
  for (const byte of payload) {
    const mbps = (byte & 0x7f) * 0.5;
    ratesMbps.push(mbps);
    if (byte & 0x80) basicRatesMbps.push(mbps);
  }
  return { ...common(id, payload), id, kind: 'rates', ratesMbps, basicRatesMbps };
}

function decodeDs(payload: readonly number[]): DecodedIe {
  return {
    ...common(ID_DS, payload),
    id: 3,
    kind: 'ds',
    channel: payload.length >= 1 ? payload[0] & 0xff : 0,
  };
}

function decodeCountry(payload: readonly number[]): DecodedIe {
  const countryCode = payload.length >= 2 ? asciiLetters(payload[0], payload[1]) : null;
  const environment = payload.length >= 3 ? payload[2] & 0xff : null;
  const triplets: CountryTriplet[] = [];
  for (let i = 3; i + 2 < payload.length; i += 3) {
    triplets.push({
      firstChannel: payload[i] & 0xff,
      channelCount: payload[i + 1] & 0xff,
      maxTxPowerDbm: payload[i + 2] & 0xff,
    });
  }
  return {
    ...common(ID_COUNTRY, payload),
    id: 7,
    kind: 'country',
    countryCode,
    environment,
    triplets,
  };
}

function decodeTim(payload: readonly number[]): DecodedIe {
  const dtimCount = payload.length >= 1 ? payload[0] & 0xff : null;
  const dtimPeriod = payload.length >= 2 ? payload[1] & 0xff : null;
  const bitmapControl = payload.length >= 3 ? payload[2] & 0xff : null;
  const partialBitmapLength = Math.max(0, payload.length - 3);
  return {
    ...common(ID_TIM, payload),
    id: 5,
    kind: 'tim',
    dtimCount,
    dtimPeriod,
    bitmapControl,
    partialBitmapLength,
  };
}

function decodePowerConstraint(payload: readonly number[]): DecodedIe {
  return {
    ...common(ID_PWR_CONSTRAINT, payload),
    id: 32,
    kind: 'power-constraint',
    localPowerConstraintDb: payload.length >= 1 ? payload[0] & 0xff : null,
  };
}

function decodeExtendedCapabilities(payload: readonly number[]): DecodedIe {
  const setFlags: { octet: number; bit: number; name: string }[] = [];
  for (const def of EXT_CAP_NAMED_BITS) {
    if (def.octet >= payload.length) continue;
    if (payload[def.octet] & (1 << def.bit)) {
      setFlags.push(def);
    }
  }
  return {
    ...common(ID_EXT_CAP, payload),
    id: 127,
    kind: 'extended-capabilities',
    octetCount: payload.length,
    setFlags,
  };
}

function decodeBssLoad(payload: readonly number[]): DecodedIe {
  const stationCount = u16le(payload, 0);
  const channelUtilization = payload.length >= 3 ? payload[2] & 0xff : null;
  const channelUtilPct = channelUtilization == null ? null : (channelUtilization * 100) / 255;
  const availableAdmissionCapacity = u16le(payload, 3);
  return {
    ...common(ID_BSS_LOAD, payload),
    id: 11,
    kind: 'bss-load',
    stationCount,
    channelUtilization,
    channelUtilPct,
    availableAdmissionCapacity,
  };
}

function decodeHtCap(payload: readonly number[]): DecodedIe {
  const info = u16le(payload, 0);
  const nss = payload.length >= 7 ? nssFromHtMcsSet(payload.slice(3, 7)) : null;
  return {
    ...common(ID_HT_CAP, payload),
    id: 45,
    kind: 'ht-capabilities',
    fortyMhz: info == null ? null : Boolean(info & (1 << 1)),
    shortGi20: info == null ? null : Boolean(info & (1 << 5)),
    shortGi40: info == null ? null : Boolean(info & (1 << 6)),
    nss,
  };
}

function htSecondaryOffset(payload: readonly number[]): -1 | 0 | 1 | null {
  if (payload.length < 2) return null;
  const raw = payload[1] & 0b11;
  if (raw === 0) return 0;
  if (raw === 1) return 1;
  if (raw === 3) return -1;
  return null;
}

function decodeHtOp(payload: readonly number[]): DecodedIe {
  return {
    ...common(ID_HT_OP, payload),
    id: 61,
    kind: 'ht-operation',
    primaryChannel: payload.length >= 1 ? payload[0] & 0xff : null,
    secondaryOffset: htSecondaryOffset(payload),
    staChannelWidthAny: payload.length >= 2 ? Boolean(payload[1] & 0b100) : null,
  };
}

function readSuiteOui(payload: readonly number[], offset: number): string | null {
  if (offset + 2 >= payload.length) return null;
  return formatOui(payload.slice(offset, offset + 3));
}

function readCipher(payload: readonly number[], offset: number): CipherSuite | null {
  const oui = readSuiteOui(payload, offset);
  if (oui == null || offset + 3 >= payload.length) return null;
  const type = payload[offset + 3] & 0xff;
  const name = oui === IEEE_SUITE_OUI ? (CIPHER_NAMES[type] ?? 'unknown') : 'unknown';
  return { oui, type, name };
}

function readAkm(payload: readonly number[], offset: number): AkmSuite | null {
  const oui = readSuiteOui(payload, offset);
  if (oui == null || offset + 3 >= payload.length) return null;
  const type = payload[offset + 3] & 0xff;
  const name = oui === IEEE_SUITE_OUI ? (AKM_NAMES[type] ?? 'unknown') : 'unknown';
  return { oui, type, name };
}

function decodeRsn(payload: readonly number[]): DecodedIe {
  const version = u16le(payload, 0);
  let offset = 2;
  const groupCipher = readCipher(payload, offset);
  if (groupCipher) offset += 4;
  const pairwise: CipherSuite[] = [];
  const pairwiseCount = u16le(payload, offset);
  if (pairwiseCount != null) {
    offset += 2;
    for (let i = 0; i < pairwiseCount; i += 1) {
      const suite = readCipher(payload, offset);
      if (!suite) break;
      pairwise.push(suite);
      offset += 4;
    }
  }
  const akm: AkmSuite[] = [];
  const akmCount = u16le(payload, offset);
  if (akmCount != null) {
    offset += 2;
    for (let i = 0; i < akmCount; i += 1) {
      const suite = readAkm(payload, offset);
      if (!suite) break;
      akm.push(suite);
      offset += 4;
    }
  }
  const caps = u16le(payload, offset);
  return {
    ...common(ID_RSN, payload),
    id: 48,
    kind: 'rsn',
    version,
    groupCipher,
    pairwise,
    akm,
    mfpr: caps == null ? null : Boolean(caps & (1 << 6)),
    mfpc: caps == null ? null : Boolean(caps & (1 << 7)),
  };
}

function decodeVhtCap(payload: readonly number[]): DecodedIe {
  const info =
    payload.length >= 4
      ? (payload[0] | (payload[1] << 8) | (payload[2] << 16) | (payload[3] << 24)) >>> 0
      : null;
  const nss = payload.length >= 6 ? nssFromMcsMap(payload[4], payload[5]) : null;
  const maxMcs = payload.length >= 6 ? maxMcsFromVhtMap(payload[4], payload[5]) : null;
  return {
    ...common(ID_VHT_CAP, payload),
    id: 191,
    kind: 'vht-capabilities',
    nss,
    maxMcs,
    shortGi80: info == null ? null : Boolean(info & (1 << 5)),
    shortGi160: info == null ? null : Boolean(info & (1 << 6)),
    channelWidthSet: info == null ? null : (info >> 2) & 0b11,
  };
}

function vhtWidthMhz(widthCode: number): 20 | 40 | 80 | 160 | null {
  if (widthCode === 0) return 20;
  if (widthCode === 1) return 80;
  if (widthCode === 2) return 160;
  if (widthCode === 3) return 160;
  return null;
}

function decodeVhtOp(payload: readonly number[]): DecodedIe {
  const widthCode = payload.length >= 1 ? payload[0] & 0xff : null;
  return {
    ...common(ID_VHT_OP, payload),
    id: 192,
    kind: 'vht-operation',
    widthCode,
    widthMhz: widthCode == null ? null : vhtWidthMhz(widthCode),
    ccfs0: payload.length >= 2 ? payload[1] & 0xff : null,
    ccfs1: payload.length >= 3 ? payload[2] & 0xff : null,
  };
}

function decodeWpaVendor(payload: readonly number[]): DecodedIe {
  const oui = formatOui(payload);
  const version = u16le(payload, 4);
  let offset = 6;
  const groupCipher = readCipher(payload, offset);
  if (groupCipher) offset += 4;
  const pairwise: CipherSuite[] = [];
  const pairwiseCount = u16le(payload, offset);
  if (pairwiseCount != null) {
    offset += 2;
    for (let i = 0; i < pairwiseCount; i += 1) {
      const suite = readCipher(payload, offset);
      if (!suite) break;
      pairwise.push(suite);
      offset += 4;
    }
  }
  const akm: AkmSuite[] = [];
  const akmCount = u16le(payload, offset);
  if (akmCount != null) {
    offset += 2;
    for (let i = 0; i < akmCount; i += 1) {
      const suite = readAkm(payload, offset);
      if (!suite) break;
      akm.push(suite);
      offset += 4;
    }
  }
  return {
    ...common(ID_VENDOR, payload),
    id: 221,
    kind: 'vendor-wpa',
    oui,
    version,
    groupCipher,
    pairwise,
    akm,
  };
}

function decodeVendor(payload: readonly number[]): DecodedIe {
  if (isWpaVendor(payload)) return decodeWpaVendor(payload);
  return {
    ...common(ID_VENDOR, payload),
    id: 221,
    kind: 'vendor',
    oui: formatOui(payload),
    vendorType: payload.length >= 4 ? payload[3] & 0xff : null,
  };
}

function decodeRsnx(payload: readonly number[]): DecodedIe {
  const first = payload.length >= 1 ? payload[0] & 0xff : null;
  return {
    ...common(ID_RSNX, payload),
    id: 244,
    kind: 'rsnx',
    // B5 SAE Hash-to-Element (IEEE 802.11 Extended RSN Capabilities).
    saeHashToElement: first == null ? null : Boolean(first & (1 << 5)),
  };
}

function decodeHeCap(afterExt: readonly number[], fullPayload: readonly number[]): DecodedIe {
  // HE MAC (6) + HE PHY (11) + Rx MCS ≤80 (2).
  const nss = afterExt.length >= 19 ? nssFromMcsMap(afterExt[17], afterExt[18]) : null;
  const maxMcs = afterExt.length >= 19 ? maxMcsFromHeMap(afterExt[17], afterExt[18]) : null;
  return {
    ...common(ID_EXT, fullPayload, EXT_HE_CAP),
    id: 255,
    extId: 35,
    kind: 'he-capabilities',
    nss,
    maxMcs,
  };
}

/** EHT Rx map: NSS — как HE (3 = stream absent); max MCS — 3 = up to MCS 13. */
export function nssFromEhtMcsMap(lo: number, hi: number): SpatialStreamHint | null {
  return nssFromMcsMap(lo, hi);
}

function decodeEhtCap(afterExt: readonly number[], fullPayload: readonly number[]): DecodedIe {
  const nss = afterExt.length >= 13 ? nssFromEhtMcsMap(afterExt[11], afterExt[12]) : null;
  const maxMcs = afterExt.length >= 13 ? maxMcsFromEhtMap(afterExt[11], afterExt[12]) : null;
  return {
    ...common(ID_EXT, fullPayload, EXT_EHT_CAP),
    id: 255,
    extId: EXT_EHT_CAP,
    kind: 'eht-capabilities',
    nss,
    maxMcs,
  };
}

function decodeHeOp(afterExt: readonly number[], fullPayload: readonly number[]): DecodedIe {
  const params =
    afterExt.length >= 3 ? (afterExt[0] | (afterExt[1] << 8) | (afterExt[2] << 16)) >>> 0 : 0;
  const colorByte = afterExt.length >= 4 ? afterExt[3] & 0xff : null;
  const vhtPresent = Boolean(params & (1 << 7));
  const colocated = Boolean(params & (1 << 8));
  const sixGhzPresent = Boolean(params & (1 << 10));
  let optional = 6; // params(3)+color(1)+basic MCS(2)
  if (vhtPresent) optional += 3;
  if (colocated) optional += 1;
  let sixGhzPrimaryChannel: number | null = null;
  let ccfs0: number | null = null;
  if (sixGhzPresent && afterExt.length >= optional + 5) {
    sixGhzPrimaryChannel = afterExt[optional] & 0xff;
    ccfs0 = afterExt[optional + 2] & 0xff;
  }
  return {
    ...common(ID_EXT, fullPayload, EXT_HE_OP),
    id: 255,
    extId: 36,
    kind: 'he-operation',
    bssColor: colorByte == null ? null : colorByte & 0x3f,
    bssColorDisabled: colorByte == null ? null : Boolean(colorByte & 0x80),
    sixGhzPrimaryChannel,
    ccfs0,
  };
}

function decodeUnknown(id: number, payload: readonly number[], extId: number | null): DecodedIe {
  return { ...common(id, payload, extId), kind: 'unknown' };
}

function decodeOne(id: number, payload: readonly number[]): DecodedIe {
  if (id === ID_SSID) return decodeSsid(payload);
  if (id === ID_RATES) return decodeRates(1, payload);
  if (id === ID_TIM) return decodeTim(payload);
  if (id === ID_DS) return decodeDs(payload);
  if (id === ID_COUNTRY) return decodeCountry(payload);
  if (id === ID_BSS_LOAD) return decodeBssLoad(payload);
  if (id === ID_PWR_CONSTRAINT) return decodePowerConstraint(payload);
  if (id === ID_HT_CAP) return decodeHtCap(payload);
  if (id === ID_RSN) return decodeRsn(payload);
  if (id === ID_EXT_RATES) return decodeRates(50, payload);
  if (id === ID_HT_OP) return decodeHtOp(payload);
  if (id === ID_VHT_CAP) return decodeVhtCap(payload);
  if (id === ID_VHT_OP) return decodeVhtOp(payload);
  if (id === ID_EXT_CAP) return decodeExtendedCapabilities(payload);
  if (id === ID_VENDOR) return decodeVendor(payload);
  if (id === ID_RSNX) return decodeRsnx(payload);
  if (id === ID_EXT) {
    const extId = payload.length >= 1 ? payload[0] & 0xff : null;
    const rest = payload.slice(1);
    if (extId === EXT_HE_CAP) return decodeHeCap(rest, payload);
    if (extId === EXT_HE_OP) return decodeHeOp(rest, payload);
    if (extId === EXT_EHT_CAP) return decodeEhtCap(rest, payload);
    return decodeUnknown(ID_EXT, payload, extId);
  }
  return decodeUnknown(id, payload, null);
}

function isWpaVendor(payload: readonly number[]): boolean {
  return (
    payload.length >= 4 &&
    payload[0] === WPA_OUI[0] &&
    payload[1] === WPA_OUI[1] &&
    payload[2] === WPA_OUI[2] &&
    payload[3] === WPA_TYPE
  );
}

/** Vendor IE 221 с Microsoft OUI и WPS type 4. */
function isWpsVendor(payload: readonly number[]): boolean {
  return (
    payload.length >= 4 &&
    payload[0] === WPA_OUI[0] &&
    payload[1] === WPA_OUI[1] &&
    payload[2] === WPA_OUI[2] &&
    payload[3] === WPS_TYPE
  );
}

function u16be(bytes: readonly number[], offset: number): number | null {
  if (offset < 0 || offset + 1 >= bytes.length) return null;
  return (((bytes[offset] & 0xff) << 8) | (bytes[offset + 1] & 0xff)) >>> 0;
}

function decodeWpsText(value: readonly number[]): string | null {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: false }).decode(Uint8Array.from(value));
  } catch {
    return null;
  }
  const trimmed = text.trim();
  return trimmed ? trimmed.slice(0, WPS_DEVICE_NAME_MAX_CHARS) : null;
}

/**
 * WPS Device Name (0x1011) из vendor IE 221 / OUI 00:50:f2 / type 4.
 * Атрибуты: u16be type, u16be length, value. Обрыв потока — стоп, без догадок.
 */
export function parseWpsDeviceName(payload: readonly number[]): string | null {
  if (!isWpsVendor(payload)) return null;
  let name: string | null = null;
  let offset = 4;
  while (offset + 4 <= payload.length) {
    const type = u16be(payload, offset);
    const length = u16be(payload, offset + 2);
    if (type == null || length == null) break;
    const start = offset + 4;
    const end = start + length;
    if (end > payload.length) break; // truncated value — не отдаём половину имени
    if (type === WPS_SUBELEMENT_DEVICE_NAME && name == null) {
      name = decodeWpsText(payload.slice(start, end));
    }
    offset = end;
  }
  return name;
}

function buildShallow(
  byteLength: number,
  elements: readonly DecodedIe[],
  presentIds: readonly number[]
): ShallowIeView {
  let wpaVendorIe = false;
  let rsnIe = false;
  let htCapabilities = false;
  let vhtCapabilities = false;
  let heCapabilities = false;
  let ehtCapabilities = false;
  let countryFromIe: string | null = null;
  let nssHint: SpatialStreamHint | null = null;
  let htPrimaryChannel: number | null = null;
  let htSecondary: -1 | 0 | 1 | null = null;
  let ccfs0: number | null = null;
  let dtimPeriod: number | null = null;
  let bssLoadStations: number | null = null;
  let bssLoadUtilPct: number | null = null;
  let bssLoadAdmission: number | null = null;
  let mfpCapable = false;
  let mfpRequired = false;
  let wps = false;
  let wpsDeviceName: string | null = null;
  const mobilityDomain = presentIds.includes(ID_MOBILITY_DOMAIN);

  for (const el of elements) {
    if (el.kind === 'tim') {
      if (el.dtimPeriod != null && dtimPeriod == null) dtimPeriod = el.dtimPeriod;
    } else if (el.kind === 'bss-load') {
      if (bssLoadStations == null) bssLoadStations = el.stationCount;
      if (bssLoadUtilPct == null) bssLoadUtilPct = el.channelUtilPct;
      if (bssLoadAdmission == null) bssLoadAdmission = el.availableAdmissionCapacity;
    } else if (el.kind === 'country') {
      countryFromIe = el.countryCode ?? countryFromIe;
    } else if (el.kind === 'ht-capabilities') {
      htCapabilities = true;
      nssHint = maxNss(nssHint, el.nss);
    } else if (el.kind === 'rsn') {
      rsnIe = true;
      if (el.mfpc === true) mfpCapable = true;
      if (el.mfpr === true) mfpRequired = true;
    } else if (el.kind === 'ht-operation') {
      if (el.primaryChannel != null) htPrimaryChannel = el.primaryChannel;
      htSecondary = el.secondaryOffset;
    } else if (el.kind === 'vht-capabilities') {
      vhtCapabilities = true;
      nssHint = maxNss(nssHint, el.nss);
    } else if (el.kind === 'vht-operation') {
      if (el.ccfs0 != null) ccfs0 = el.ccfs0;
    } else if (el.kind === 'vendor-wpa') {
      wpaVendorIe = true;
    } else if (el.kind === 'vendor') {
      if (isWpaVendor(el.raw)) wpaVendorIe = true;
      else if (el.oui === '00:50:f2' && el.vendorType === 4) {
        wps = true;
        wpsDeviceName = parseWpsDeviceName(el.raw) ?? wpsDeviceName;
      }
    } else if (el.kind === 'he-capabilities') {
      heCapabilities = true;
      nssHint = maxNss(nssHint, el.nss);
    } else if (el.kind === 'he-operation') {
      if (el.ccfs0 != null) ccfs0 = el.ccfs0;
    } else if (el.kind === 'eht-capabilities') {
      ehtCapabilities = true;
      nssHint = maxNss(nssHint, el.nss);
    } else if (el.kind === 'unknown' && el.id === ID_EXT && el.extId === EXT_EHT_CAP) {
      ehtCapabilities = true;
    }
  }

  return {
    level: 'shallow-tags',
    byteLength,
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
    dtimPeriod,
    bssLoadStations,
    bssLoadUtilPct,
    bssLoadAdmission,
    mfpCapable,
    mfpRequired,
    mobilityDomain,
    wps,
    wpsDeviceName,
  };
}

export function decodeInformationElements(data: readonly number[] | null): IeDecodeResult {
  if (data == null || data.length === 0) {
    const byteLength = data?.length ?? 0;
    return {
      level: 'absent',
      byteLength,
      elements: [],
      shallow: emptyShallow('absent', byteLength),
    };
  }

  const tlvs = walkIeTlvs(data);
  if (tlvs.length === 0) {
    return {
      level: 'raw-only',
      byteLength: data.length,
      elements: [],
      shallow: emptyShallow('raw-only', data.length),
    };
  }

  const presentIds: number[] = [];
  const elements: DecodedIe[] = [];
  for (const tlv of tlvs) {
    if (!presentIds.includes(tlv.id)) presentIds.push(tlv.id);
    elements.push(decodeOne(tlv.id, tlv.payload));
  }

  return {
    level: 'shallow-tags',
    byteLength: data.length,
    elements,
    shallow: buildShallow(data.length, elements, presentIds),
  };
}

/** Совместимо с прежним поверхностным TLV-проходом. */
export function parseShallowIe(data: readonly number[] | null): ShallowIeView {
  return decodeInformationElements(data).shallow;
}
