/**
 * Information Elements из `CWNetwork.informationElementData`.
 *
 * На современном macOS байты IE часто урезаны или отсутствуют (privacy).
 * Если буфер есть — разрешён только поверхностный TLV-проход:
 * elementId + length + payload, известные теги.
 *
 * Unsupported без monitor mode / полного radiotap:
 * глубокий разбор vendor IE, RNR/TBTT, FILS, зашифрованных полей,
 * per-packet IE, spectrum/CCA. Не парсить то, чего нет в буфере.
 */

/** Уровень разбора, который мы готовы заявлять. */
export type IeParseLevel =
  | 'absent'
  | 'raw-only'
  | 'shallow-tags'
  | 'unsupported-deep';

/** Известные element ID, которые v1 может *заметить* (не обязательно разобрать). */
export type KnownIeId =
  | 0 // SSID
  | 1 // Supported Rates
  | 3 // DS Parameter Set
  | 5 // TIM
  | 7 // Country
  | 11 // BSS Load
  | 32 // Power Constraint
  | 45 // HT Capabilities
  | 48 // RSN
  | 50 // Extended Supported Rates
  | 61 // HT Operation
  | 127 // Extended Capabilities
  | 191 // VHT Capabilities
  | 192 // VHT Operation
  | 221 // Vendor Specific (WPA/WPS/…)
  | 244 // RSN Extension (RSNX)
  | 255; // Extension (HE/EHT и др.)

export type SpatialStreamHint = 1 | 2 | 3 | 4 | 8;

export interface ShallowIeView {
  level: IeParseLevel;
  byteLength: number;
  presentIds: readonly number[];
  wpaVendorIe: boolean | null;
  rsnIe: boolean | null;
  htCapabilities: boolean | null;
  vhtCapabilities: boolean | null;
  /** Extension IE, HE Capabilities (ext id 35), если замечен. */
  heCapabilities: boolean | null;
  ehtCapabilities: boolean | null;
  countryFromIe: string | null;
  /**
   * NSS из MCS map HT/VHT/HE — только если тег целиком на месте.
   * Иначе null, не угадывать 2×2.
   */
  nssHint: SpatialStreamHint | null;
  /** HT Operation: primary + secondary offset (−1 above / +1 below). */
  htPrimaryChannel: number | null;
  htSecondaryOffset: -1 | 0 | 1 | null;
  /** VHT/HE Operation CCFS0, если тег разобран. */
  ccfs0: number | null;
}

/**
 * То, что сознательно не делаем даже при наличии байтов.
 * Глубокий IE ≠ «прочитать TLV».
 */
export const IE_UNSUPPORTED_DEEP = [
  'rnr-tbtt',
  'fils-indication',
  'vendor-oui-beyond-wpa-wps',
  'rsnxe-full-akm-matrix',
  'he-operation-6ghz-wide',
  'eht-operation-320',
  'encrypted-ie',
  'per-packet-ie',
] as const;

export type UnsupportedDeepIe = (typeof IE_UNSUPPORTED_DEEP)[number];

/** IEEE 00-0F-AC cipher type или чужой OUI. */
export type CipherName =
  | 'use-group'
  | 'wep-40'
  | 'tkip'
  | 'ccmp-128'
  | 'wep-104'
  | 'gcmp-128'
  | 'gcmp-256'
  | 'ccmp-256'
  | 'bip-cmac-128'
  | 'bip-gmac-128'
  | 'bip-gmac-256'
  | 'bip-cmac-256'
  | 'unknown';

/** IEEE 00-0F-AC AKM type или чужой OUI. */
export type AkmName =
  | 'ieee8021x'
  | 'psk'
  | 'ft-ieee8021x'
  | 'ft-psk'
  | 'ieee8021x-sha256'
  | 'psk-sha256'
  | 'tdls'
  | 'sae'
  | 'ft-sae'
  | 'ap-peerkey'
  | 'ieee8021x-suite-b'
  | 'ieee8021x-suite-b-192'
  | 'ft-ieee8021x-sha384'
  | 'fils-sha256'
  | 'fils-sha384'
  | 'ft-fils-sha256'
  | 'ft-fils-sha384'
  | 'owe'
  | 'ft-sae-ext-key'
  | 'sae-ext-key'
  | 'unknown';

export interface CipherSuite {
  oui: string;
  type: number;
  name: CipherName;
}

export interface AkmSuite {
  oui: string;
  type: number;
  name: AkmName;
}

export interface CountryTriplet {
  firstChannel: number;
  channelCount: number;
  maxTxPowerDbm: number;
}

interface IeCommon {
  /** Element ID (255 для Extension). */
  id: number;
  extId: number | null;
  raw: readonly number[];
  rawHex: string;
}

export type DecodedIe =
  | (IeCommon & {
      id: 0;
      kind: 'ssid';
      ssid: string;
      octets: readonly number[];
      hidden: boolean;
    })
  | (IeCommon & {
      id: 1 | 50;
      kind: 'rates';
      ratesMbps: readonly number[];
      basicRatesMbps: readonly number[];
    })
  | (IeCommon & {
      id: 3;
      kind: 'ds';
      channel: number;
    })
  | (IeCommon & {
      id: 7;
      kind: 'country';
      countryCode: string | null;
      environment: number | null;
      triplets: readonly CountryTriplet[];
    })
  | (IeCommon & {
      id: 11;
      kind: 'bss-load';
      stationCount: number | null;
      channelUtilization: number | null;
      /** raw 0–255 → × 100/255; null если байта нет. */
      channelUtilPct: number | null;
      availableAdmissionCapacity: number | null;
    })
  | (IeCommon & {
      id: 5;
      kind: 'tim';
      dtimCount: number | null;
      dtimPeriod: number | null;
      bitmapControl: number | null;
      partialBitmapLength: number;
    })
  | (IeCommon & {
      id: 32;
      kind: 'power-constraint';
      localPowerConstraintDb: number | null;
    })
  | (IeCommon & {
      id: 127;
      kind: 'extended-capabilities';
      octetCount: number;
      setFlags: readonly { octet: number; bit: number; name: string }[];
    })
  | (IeCommon & {
      id: 45;
      kind: 'ht-capabilities';
      fortyMhz: boolean | null;
      shortGi20: boolean | null;
      shortGi40: boolean | null;
      nss: SpatialStreamHint | null;
    })
  | (IeCommon & {
      id: 48;
      kind: 'rsn';
      version: number | null;
      groupCipher: CipherSuite | null;
      pairwise: readonly CipherSuite[];
      akm: readonly AkmSuite[];
      mfpc: boolean | null;
      mfpr: boolean | null;
    })
  | (IeCommon & {
      id: 61;
      kind: 'ht-operation';
      primaryChannel: number | null;
      secondaryOffset: -1 | 0 | 1 | null;
      staChannelWidthAny: boolean | null;
    })
  | (IeCommon & {
      id: 191;
      kind: 'vht-capabilities';
      nss: SpatialStreamHint | null;
      /** Макс. MCS по поддерживаемым SS из Rx MCS map; null если map обрезан. */
      maxMcs: 7 | 8 | 9 | null;
      shortGi80: boolean | null;
      shortGi160: boolean | null;
      channelWidthSet: number | null;
    })
  | (IeCommon & {
      id: 192;
      kind: 'vht-operation';
      widthCode: number | null;
      /** 0 → 20/40, 1 → 80, 2 → 160, 3 → 80+80 (не оцениваем как 320). */
      widthMhz: 20 | 40 | 80 | 160 | null;
      ccfs0: number | null;
      ccfs1: number | null;
    })
  | (IeCommon & {
      id: 221;
      kind: 'vendor';
      oui: string | null;
      vendorType: number | null;
    })
  | (IeCommon & {
      id: 221;
      kind: 'vendor-wpa';
      oui: string | null;
      version: number | null;
      groupCipher: CipherSuite | null;
      pairwise: readonly CipherSuite[];
      akm: readonly AkmSuite[];
    })
  | (IeCommon & {
      id: 244;
      kind: 'rsnx';
      saeHashToElement: boolean | null;
    })
  | (IeCommon & {
      id: 255;
      extId: 35;
      kind: 'he-capabilities';
      nss: SpatialStreamHint | null;
      /** Макс. MCS ≤80 МГц из Rx map: 7 / 9 / 11. */
      maxMcs: 7 | 9 | 11 | null;
    })
  | (IeCommon & {
      id: 255;
      extId: 36;
      kind: 'he-operation';
      bssColor: number | null;
      bssColorDisabled: boolean | null;
      sixGhzPrimaryChannel: number | null;
      ccfs0: number | null;
    })
  | (IeCommon & {
      id: 255;
      extId: 108;
      kind: 'eht-capabilities';
      nss: SpatialStreamHint | null;
      maxMcs: 7 | 9 | 11 | 13 | null;
    })
  | (IeCommon & {
      kind: 'unknown';
    });

export interface IeDecodeResult {
  level: IeParseLevel;
  byteLength: number;
  elements: readonly DecodedIe[];
  shallow: ShallowIeView;
}
