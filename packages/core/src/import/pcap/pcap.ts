/**
 * Classic libpcap file format (both endiannesses, micro/nano timestamps).
 * Timestamps are irrelevant to the BSS model, so only lengths and payloads
 * are validated.
 */

import { ByteReader } from './bytes';
import type { Warnings } from './types';

export type FrameHandler = (linktype: number, frame: Uint8Array) => void;

export interface ClassicPcapInfo {
  littleEndian: boolean;
  nanosecond: boolean;
  snaplen: number;
  linktype: number;
}

export interface ClassicPcapResult {
  info: ClassicPcapInfo | null;
  frames: number;
}

const MAGIC_LE_MICRO = 0xa1b2c3d4;
const MAGIC_BE_MICRO = 0xd4c3b2a1;
const MAGIC_LE_NANO = 0xa1b23c4d;
const MAGIC_BE_NANO = 0x4d3cb2a1;

export function isClassicPcapMagic(magic: number): boolean {
  return (
    magic === MAGIC_LE_MICRO ||
    magic === MAGIC_BE_MICRO ||
    magic === MAGIC_LE_NANO ||
    magic === MAGIC_BE_NANO
  );
}

export function parseClassicPcap(
  bytes: Uint8Array,
  maxFrames: number,
  onFrame: FrameHandler,
  warnings: Warnings
): ClassicPcapResult {
  const reader = new ByteReader(bytes);
  const magic = reader.u32(true);
  if (magic === null) {
    warnings.add('pcap: truncated global header');
    return { info: null, frames: 0 };
  }

  const littleEndian = magic === MAGIC_LE_MICRO || magic === MAGIC_LE_NANO;
  const nanosecond = magic === MAGIC_LE_NANO || magic === MAGIC_BE_NANO;
  const versionMajor = reader.u16(littleEndian);
  reader.u16(littleEndian); // minor
  reader.u32(littleEndian); // thiszone
  reader.u32(littleEndian); // sigfigs
  const snaplen = reader.u32(littleEndian);
  const linktype = reader.u32(littleEndian);
  if (versionMajor === null || snaplen === null || linktype === null) {
    warnings.add('pcap: truncated global header');
    return { info: null, frames: 0 };
  }
  if (versionMajor !== 2) {
    warnings.add(`pcap: unexpected version ${versionMajor}.x`);
  }
  if (linktype !== 127 && linktype !== 105) {
    warnings.add(`linktype: unsupported ${linktype} (expected 127 radiotap or 105 802.11)`);
  }

  let frames = 0;
  let snaplenWarned = false;
  while (reader.remaining > 0) {
    if (frames >= maxFrames) {
      warnings.add(`limit: frame cap ${maxFrames} reached`);
      break;
    }
    const recordOffset = reader.pos;
    if (reader.remaining < 16) {
      warnings.add(`pcap: truncated record header at offset ${recordOffset}`);
      break;
    }
    reader.u32(littleEndian); // ts_sec
    reader.u32(littleEndian); // ts_frac (micro or nano, unused)
    const inclLen = reader.u32(littleEndian);
    const origLen = reader.u32(littleEndian);
    if (inclLen === null || origLen === null) {
      warnings.add(`pcap: truncated record header at offset ${recordOffset}`);
      break;
    }
    if (inclLen > reader.remaining) {
      warnings.add(`pcap: truncated packet data at offset ${recordOffset} (${inclLen} bytes)`);
      break;
    }
    if (!snaplenWarned && origLen > inclLen) {
      snaplenWarned = true;
      warnings.add('pcap: captured length shorter than original length (snap-length cut)');
    }
    const data = reader.take(inclLen);
    if (data === null) {
      warnings.add(`pcap: truncated packet data at offset ${recordOffset}`);
      break;
    }
    frames += 1;
    onFrame(linktype, data);
  }

  return { info: { littleEndian, nanosecond, snaplen, linktype }, frames };
}
