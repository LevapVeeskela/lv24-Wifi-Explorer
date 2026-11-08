/**
 * 802.11 management frame decode: beacon (subtype 8) and probe response (5).
 *
 * Only what the bytes prove. Truncated elements stop the walk; security / PHY /
 * width inference reports `unknown` when the evidence is missing.
 */

import type { CoreWlanChannelBand, CoreWlanChannelWidth } from '../../domain/channel';
import { asciiLetters } from '../../domain/ie/bytes';
import { PHY_DISPLAY_ORDER } from '../../domain/phy';
import type { PhyLetter } from '../../domain/phy';
import { SECURITY_PRIMARY_RANK } from '../../domain/security';
import type { SecurityKind } from '../../domain/security';

export interface IeTlv {
  id: number;
  payload: readonly number[];
}

export interface BeaconLikeFrame {
  bssid: string;
  ssid: string | null;
  ssidBytes: readonly number[] | null;
  beaconIntervalMs: number;
  capability: number;
  ibss: boolean;
  /** Raw IE bytes from the end of the fixed parameters to the FCS cut. */
  ieBytes: readonly number[];
  ies: readonly IeTlv[];
  /** True when an element header/length ran past the available bytes. */
  truncatedIe: boolean;
}

export type MgmtParseResult = { ok: true; frame: BeaconLikeFrame } | { ok: false; reason: string };

export const BEACON_SUBTYPE = 8;
export const PROBE_RESPONSE_SUBTYPE = 5;

const MGMT_HEADER_LEN = 24;
const BEACON_FIXED_LEN = 12;
const FCS_LEN = 4;

function macAt(bytes: Uint8Array, offset: number): string {
  const parts: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    parts.push((bytes[offset + i] as number).toString(16).padStart(2, '0'));
  }
  return parts.join(':');
}

export function walkIeTlvs(bytes: readonly number[]): {
  ies: IeTlv[];
  truncated: boolean;
} {
  const ies: IeTlv[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    if (offset + 1 >= bytes.length) return { ies, truncated: true };
    const id = bytes[offset] as number;
    const len = bytes[offset + 1] as number;
    if (offset + 2 + len > bytes.length) return { ies, truncated: true };
    ies.push({ id, payload: bytes.slice(offset + 2, offset + 2 + len) });
    offset += 2 + len;
  }
  return { ies, truncated: false };
}

/** Parse a raw 802.11 frame that is expected to be a beacon / probe response. */
export function parseBeaconLikeFrame(bytes: Uint8Array, hasFcs: boolean): MgmtParseResult {
  if (bytes.length < MGMT_HEADER_LEN)
    return { ok: false, reason: 'frame: truncated 802.11 header' };

  const fc = (bytes[0] as number) | ((bytes[1] as number) << 8);
  const version = fc & 0x3;
  if (version !== 0) return { ok: false, reason: `frame: unsupported 802.11 version ${version}` };
  const type = (fc >>> 2) & 0x3;
  const subtype = (fc >>> 4) & 0xf;
  if (type !== 0)
    return { ok: false, reason: `frame: not management (type ${type} subtype ${subtype})` };
  if (subtype !== BEACON_SUBTYPE && subtype !== PROBE_RESPONSE_SUBTYPE) {
    return { ok: false, reason: `frame: not beacon/probe response (subtype ${subtype})` };
  }

  // Order bit for management frames means "HT Control present" (+4 bytes).
  const headerLen = MGMT_HEADER_LEN + ((fc & 0x8000) !== 0 ? 4 : 0);
  const fixedEnd = headerLen + BEACON_FIXED_LEN;
  if (bytes.length < fixedEnd) return { ok: false, reason: 'frame: truncated fixed parameters' };

  const ieEnd = hasFcs ? bytes.length - FCS_LEN : bytes.length;
  if (ieEnd < fixedEnd) return { ok: false, reason: 'frame: FCS cut leaves no IE bytes' };

  const ieBytes = Array.from(bytes.subarray(fixedEnd, ieEnd));
  const walked = walkIeTlvs(ieBytes);

  const beaconIntervalMs =
    (bytes[headerLen + 8] as number) | ((bytes[headerLen + 9] as number) << 8);
  const capability = (bytes[headerLen + 10] as number) | ((bytes[headerLen + 11] as number) << 8);

  const ssidIe = walked.ies.find((ie) => ie.id === 0) ?? null;
  const ssidBytes = ssidIe !== null && ssidIe.payload.length > 0 ? ssidIe.payload.slice() : null;
  const ssid = ssidBytes === null ? null : decodeSsid(ssidBytes);

  return {
    ok: true,
    frame: {
      bssid: macAt(bytes, 16),
      ssid,
      ssidBytes,
      beaconIntervalMs,
      capability,
      ibss: (capability & 0x0002) !== 0,
      ieBytes,
      ies: walked.ies,
      truncatedIe: walked.truncated,
    },
  };
}

/** UTF-8 SSID decode, trailing NULs trimmed. Empty payload means hidden (null). */
function decodeSsid(bytes: readonly number[]): string | null {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end -= 1;
  if (end === 0) return null;
  const data = Uint8Array.from(bytes.slice(0, end));
  return new TextDecoder('utf-8', { fatal: false }).decode(data);
}

export function findIe(ies: readonly IeTlv[], id: number): IeTlv | null {
  return ies.find((ie) => ie.id === id) ?? null;
}

export function findExtensionIe(ies: readonly IeTlv[], extensionId: number): IeTlv | null {
  return ies.find((ie) => ie.id === 255 && ie.payload[0] === extensionId) ?? null;
}

/** DS Parameter Set (3) primary channel. */
export function dsChannel(ies: readonly IeTlv[]): number | null {
  const ie = findIe(ies, 3);
  if (ie === null || ie.payload.length < 1) return null;
  const channel = ie.payload[0] as number;
  return channel >= 1 ? channel : null;
}

/** Country (7) two ASCII letters. */
export function countryFromIes(ies: readonly IeTlv[]): string | null {
  const ie = findIe(ies, 7);
  if (ie === null || ie.payload.length < 2) return null;
  return asciiLetters(ie.payload[0] as number, ie.payload[1] as number);
}

/** HT Operation (61) secondary channel offset → 40 MHz or 20 MHz. */
export function htWidth(ies: readonly IeTlv[]): CoreWlanChannelWidth | null {
  const ie = findIe(ies, 61);
  if (ie === null || ie.payload.length < 2) return null;
  const offset = (ie.payload[1] as number) & 0x3;
  if (offset === 0) return '20mhz';
  if (offset === 1 || offset === 3) return '40mhz';
  return 'unknown';
}

/** VHT Operation (192) channel width byte. 80+80 has no CoreWLAN equivalent. */
export function vhtWidth(ies: readonly IeTlv[]): CoreWlanChannelWidth | null {
  const ie = findIe(ies, 192);
  if (ie === null || ie.payload.length < 1) return null;
  switch (ie.payload[0] as number) {
    case 0:
      return '40mhz';
    case 1:
      return '80mhz';
    case 2:
      return '160mhz';
    case 3:
      return 'unknown'; // 80+80 — not modelled by CoreWLAN
    default:
      return 'unknown';
  }
}

export function inferWidth(ies: readonly IeTlv[], truncated: boolean): CoreWlanChannelWidth {
  const vht = vhtWidth(ies);
  if (vht !== null) return vht;
  const ht = htWidth(ies);
  if (ht !== null) return ht;
  if (truncated) return 'unknown';
  const hasHe =
    findExtensionIe(ies, 35) !== null ||
    findExtensionIe(ies, 36) !== null ||
    findExtensionIe(ies, 106) !== null;
  // HE/EHT beacons carry the width in HE/EHT Operation, not HT/VHT Operation;
  // without those bytes the width is not provable.
  if (hasHe) return 'unknown';
  return '20mhz';
}

/** PHY modes the IEs actually advertise (never a guess from the channel alone). */
export function inferPhyModes(ies: readonly IeTlv[]): PhyLetter[] {
  const found = new Set<PhyLetter>();
  if (findIe(ies, 42) !== null) found.add('g'); // ERP
  if (findIe(ies, 45) !== null || findIe(ies, 61) !== null) found.add('n'); // HT
  if (findIe(ies, 191) !== null || findIe(ies, 192) !== null) found.add('ac'); // VHT
  if (findExtensionIe(ies, 35) !== null || findExtensionIe(ies, 36) !== null) found.add('ax'); // HE
  if (findExtensionIe(ies, 106) !== null) found.add('be'); // EHT
  return PHY_DISPLAY_ORDER.filter((letter) => found.has(letter));
}

interface AkmParse {
  types: number[];
  malformed: boolean;
}

/**
 * AKM suite types from an RSN-shaped body (version..capabilities).
 * `start` lets the same walker read the WPA vendor IE body.
 */
function parseAkmSuites(payload: readonly number[], start: number): AkmParse {
  const readU16 = (offset: number): number | null => {
    if (offset + 1 >= payload.length) return null;
    return ((payload[offset] as number) | ((payload[offset + 1] as number) << 8)) >>> 0;
  };
  const version = readU16(start);
  if (version === null) return { types: [], malformed: true };
  let offset = start + 2 + 4; // version + group cipher suite
  const pairwiseCount = readU16(offset);
  if (pairwiseCount === null) return { types: [], malformed: true };
  offset += 2 + pairwiseCount * 4;
  const akmCount = readU16(offset);
  if (akmCount === null) return { types: [], malformed: true };
  offset += 2;
  const types: number[] = [];
  for (let i = 0; i < akmCount; i += 1) {
    if (offset + 3 >= payload.length) return { types, malformed: true };
    // Suite selector OUI (3 bytes) + type (1 byte); only the type matters here.
    types.push(payload[offset + 3] as number);
    offset += 4;
  }
  return { types, malformed: false };
}

function wpaVendorPayload(ies: readonly IeTlv[]): readonly number[] | null {
  for (const ie of ies) {
    if (ie.id !== 221 || ie.payload.length < 4) continue;
    const p = ie.payload;
    if (p[0] === 0x00 && p[1] === 0x50 && p[2] === 0xf2 && p[3] === 0x01) return p;
  }
  return null;
}

export interface SecurityInference {
  kinds: SecurityKind[];
}

export function inferSecurity(ies: readonly IeTlv[], capability: number): SecurityInference {
  const kinds = new Set<SecurityKind>();

  const rsnIe = findIe(ies, 48);
  let rsnSae = false;
  let rsnPsk = false;
  let rsnEnterprise = false;
  let rsnOwe = false;

  if (rsnIe !== null) {
    const akm = parseAkmSuites(rsnIe.payload, 0);
    for (const type of akm.types) {
      if (type === 18) rsnOwe = true;
      else if (type === 8 || type === 9 || type === 24) rsnSae = true;
      else if (type === 2 || type === 4 || type === 6) rsnPsk = true;
      else if (type === 1 || type === 3 || type === 5) rsnEnterprise = true;
    }
  }

  const wpaPayload = wpaVendorPayload(ies);
  let wpaPsk = false;
  let wpaEnterprise = false;
  if (wpaPayload !== null) {
    const akm = parseAkmSuites(wpaPayload, 4);
    for (const type of akm.types) {
      if (type === 2) wpaPsk = true;
      else if (type === 1) wpaEnterprise = true;
    }
  }

  if (rsnOwe) kinds.add('owe');
  if (rsnSae && rsnPsk) kinds.add('wpa3-transition');
  else if (rsnSae) kinds.add('wpa3-personal');
  else if (rsnPsk) kinds.add('wpa2-personal');
  if (rsnEnterprise) kinds.add('wpa2-enterprise');
  if (rsnIe !== null && kinds.size === 0 && !rsnOwe) {
    // RSN present but no AKM we can name: do not invent WPA2.
    kinds.add('unknown');
  }
  if (wpaPsk) kinds.add('wpa-personal');
  if (wpaEnterprise) kinds.add('wpa-enterprise');
  if (wpaPayload !== null && rsnPsk) kinds.add('wpa-personal-mixed');
  if (wpaPayload !== null && rsnEnterprise) kinds.add('wpa-enterprise-mixed');

  if (kinds.size === 0) {
    kinds.add(((capability & 0x0010) !== 0 ? 'wep' : 'open') as SecurityKind);
  }

  const rank = (kind: SecurityKind): number => {
    const index = SECURITY_PRIMARY_RANK.indexOf(kind);
    return index === -1 ? SECURITY_PRIMARY_RANK.length : index;
  };
  return { kinds: Array.from(kinds).sort((a, b) => rank(a) - rank(b)) };
}

/**
 * Band from radiotap/802.11 frequency. Unknown frequencies stay 'unknown'
 * rather than being snapped to a band.
 */
export function bandFromFrequency(frequencyMhz: number): CoreWlanChannelBand {
  if (frequencyMhz >= 2400 && frequencyMhz <= 2500) return '2ghz';
  if (frequencyMhz >= 4900 && frequencyMhz <= 5925) return '5ghz';
  if (frequencyMhz > 5925 && frequencyMhz <= 7125) return '6ghz';
  return 'unknown';
}

/** Primary 20 MHz channel for a known band/frequency pair. */
export function channelFromFrequency(frequencyMhz: number): number | null {
  if (frequencyMhz === 2484) return 14;
  if (frequencyMhz >= 2400 && frequencyMhz <= 2500) {
    const channel = (frequencyMhz - 2407) / 5;
    return Number.isInteger(channel) && channel >= 1 && channel <= 14 ? channel : null;
  }
  if (frequencyMhz >= 4900 && frequencyMhz <= 5925) {
    const channel = (frequencyMhz - 5000) / 5;
    return Number.isInteger(channel) && channel >= 1 ? channel : null;
  }
  if (frequencyMhz > 5925 && frequencyMhz <= 7125) {
    const channel = (frequencyMhz - 5950) / 5;
    return Number.isInteger(channel) && channel >= 1 ? channel : null;
  }
  return null;
}

/** Band heuristic used only when no radiotap frequency is available. */
export function bandFromChannelNumber(channel: number): CoreWlanChannelBand {
  if (channel >= 1 && channel <= 14) return '2ghz';
  if (channel >= 32 && channel <= 196) return '5ghz';
  return 'unknown';
}
