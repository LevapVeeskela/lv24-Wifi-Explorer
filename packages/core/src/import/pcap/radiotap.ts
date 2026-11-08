/**
 * Radiotap header (linktype 127) — only the fields the importer can prove:
 * signal, frequency, flags (FCS), rate, antenna. Unknown present bits stop
 * the field walk; they are never guessed at.
 */

import { ByteReader } from './bytes';
import { RADIOTAP_MAX_PRESENT_WORDS } from './types';

export interface RadiotapHeader {
  /** Radiotap header length from the header itself. */
  length: number;
  version: number;
  /** Flags field bit 0x10: 802.11 FCS is present after the frame. */
  hasFcs: boolean;
  /** Flags field bit 0x40: receiver marked the FCS bad. */
  badFcs: boolean;
  /** dBm antenna signal (field 5). null when absent or out of range. */
  signalDbm: number | null;
  frequencyMhz: number | null;
  channelFlags: number | null;
  rateKbps: number | null;
  antenna: number | null;
  /** Present bitmaps we understood. */
  presentBits: number[];
  /** First present bit we have no field layout for, if any. */
  firstUnknownPresentBit: number | null;
}

export type RadiotapParseResult =
  | { ok: true; header: RadiotapHeader }
  | { ok: false; reason: string };

interface FieldLayout {
  bit: number;
  align: number;
  size: number;
}

/**
 * Field order and sizes from the radiotap spec (bit indexes 0..26).
 * Alignment of the first member defines the field alignment.
 */
const FIELD_LAYOUT: readonly FieldLayout[] = [
  { bit: 0, align: 8, size: 8 }, // TSFT
  { bit: 1, align: 1, size: 1 }, // Flags
  { bit: 2, align: 1, size: 1 }, // Rate
  { bit: 3, align: 2, size: 4 }, // Channel: u16 freq + u16 flags
  { bit: 4, align: 2, size: 2 }, // FHSS
  { bit: 5, align: 1, size: 1 }, // dBm antenna signal
  { bit: 6, align: 1, size: 1 }, // dBm antenna noise
  { bit: 7, align: 2, size: 2 }, // Lock quality
  { bit: 8, align: 2, size: 2 }, // TX attenuation
  { bit: 9, align: 2, size: 2 }, // dB TX attenuation
  { bit: 10, align: 1, size: 1 }, // dBm TX power
  { bit: 11, align: 1, size: 1 }, // Antenna
  { bit: 12, align: 1, size: 1 }, // dB antenna signal
  { bit: 13, align: 1, size: 1 }, // dB antenna noise
  { bit: 14, align: 2, size: 2 }, // RX flags
  { bit: 15, align: 2, size: 2 }, // TX flags
  { bit: 16, align: 1, size: 1 }, // RTS retries
  { bit: 17, align: 1, size: 1 }, // Data retries
  { bit: 18, align: 4, size: 8 }, // XChannel
  { bit: 19, align: 1, size: 3 }, // MCS
  { bit: 20, align: 4, size: 8 }, // A-MPDU status
  { bit: 21, align: 2, size: 12 }, // VHT
  { bit: 22, align: 8, size: 12 }, // Timestamp
  { bit: 23, align: 2, size: 12 }, // HE
  { bit: 24, align: 2, size: 12 }, // HE-MU
  { bit: 25, align: 1, size: 0 }, // Zero-length PSDU
  { bit: 26, align: 2, size: 4 }, // L-SIG
];

const RADIOTAP_MIN_LENGTH = 8;

/** Signed 8-bit helper for radiotap dBm fields. */
function s8(value: number): number {
  return value > 0x7f ? value - 0x100 : value;
}

export function parseRadiotap(bytes: Uint8Array): RadiotapParseResult {
  if (bytes.length < RADIOTAP_MIN_LENGTH)
    return { ok: false, reason: 'radiotap: header too short' };

  const declaredLength = (bytes[2] as number) | ((bytes[3] as number) << 8);
  const version = bytes[0] as number;
  if (version !== 0) return { ok: false, reason: `radiotap: unsupported version ${version}` };
  if (declaredLength < RADIOTAP_MIN_LENGTH) {
    return { ok: false, reason: `radiotap: bad header length ${declaredLength}` };
  }
  if (declaredLength > bytes.length) {
    return { ok: false, reason: `radiotap: header length ${declaredLength} exceeds frame` };
  }

  const headerBytes = bytes.subarray(0, declaredLength);
  const reader = new ByteReader(headerBytes, 4);

  const presentBits: number[] = [];
  let word = reader.u32(true);
  let words = 0;
  while (word !== null && words < RADIOTAP_MAX_PRESENT_WORDS) {
    presentBits.push(word);
    words += 1;
    if ((word & 0x8000_0000) === 0) break;
    word = reader.u32(true);
  }
  if (word !== null && (word & 0x8000_0000) !== 0) {
    return { ok: false, reason: 'radiotap: present bitmap too long' };
  }

  let signalDbm: number | null = null;
  let frequencyMhz: number | null = null;
  let channelFlags: number | null = null;
  let rateKbps: number | null = null;
  let antenna: number | null = null;
  let hasFcs = false;
  let badFcs = false;
  let firstUnknownPresentBit: number | null = null;
  for (let bit = FIELD_LAYOUT.length; bit < presentBits.length * 32; bit += 1) {
    const presentWord = presentBits[bit >>> 5];
    if (presentWord === undefined) break;
    if ((presentWord & (1 << (bit & 31))) !== 0) {
      firstUnknownPresentBit = bit;
      break;
    }
  }

  for (const field of FIELD_LAYOUT) {
    const wordIndex = field.bit >>> 5;
    const bitMask = 1 << (field.bit & 31);
    const presentWord = presentBits[wordIndex];
    if (presentWord === undefined) break;
    if ((presentWord & bitMask) === 0) continue;

    if (!reader.align(field.align) || reader.remaining < field.size) {
      return { ok: false, reason: `radiotap: truncated field ${field.bit}` };
    }
    const start = reader.pos;
    switch (field.bit) {
      case 1: {
        const flags = headerBytes[start] as number;
        hasFcs = (flags & 0x10) !== 0;
        badFcs = (flags & 0x40) !== 0;
        break;
      }
      case 2:
        rateKbps = (headerBytes[start] as number) * 500;
        break;
      case 3:
        frequencyMhz = (headerBytes[start] as number) | ((headerBytes[start + 1] as number) << 8);
        channelFlags =
          (headerBytes[start + 2] as number) | ((headerBytes[start + 3] as number) << 8);
        break;
      case 5: {
        const dbm = s8(headerBytes[start] as number);
        if (dbm >= -120 && dbm <= -1) signalDbm = dbm;
        break;
      }
      case 11:
        antenna = headerBytes[start] as number;
        break;
      default:
        break;
    }
    reader.skip(field.size);
  }

  return {
    ok: true,
    header: {
      length: declaredLength,
      version,
      hasFcs,
      badFcs,
      signalDbm,
      frequencyMhz,
      channelFlags,
      rateKbps,
      antenna,
      presentBits,
      firstUnknownPresentBit,
    },
  };
}
