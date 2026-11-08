/**
 * pcapng reader: SHB / IDB / EPB / SPB with per-interface linktypes.
 * Unknown blocks are skipped by length (normal); every malformed length stops
 * the walk with a warning instead of resyncing on garbage.
 */

import type { FrameHandler } from './pcap';
import type { Warnings } from './types';

export const PCAPNG_MAGIC = 0x0a0d0d0a;

const BLOCK_IDB = 0x0000_0001;
const BLOCK_PB = 0x0000_0002;
const BLOCK_SPB = 0x0000_0003;
const BLOCK_EPB = 0x0000_0006;
const BYTE_ORDER_MAGIC = 0x1a2b3c4d;

const SHB_MIN_LENGTH = 28;

interface InterfaceDescription {
  linktype: number;
  snaplen: number;
}

function readU16(bytes: Uint8Array, offset: number, le: boolean): number {
  const a = bytes[offset] as number;
  const b = bytes[offset + 1] as number;
  return (le ? a | (b << 8) : (a << 8) | b) >>> 0;
}

function readU32(bytes: Uint8Array, offset: number, le: boolean): number {
  const b0 = bytes[offset] as number;
  const b1 = bytes[offset + 1] as number;
  const b2 = bytes[offset + 2] as number;
  const b3 = bytes[offset + 3] as number;
  return (
    (le ? b0 | (b1 << 8) | (b2 << 16) | (b3 << 24) : (b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0
  );
}

export function isPcapngMagic(magic: number): boolean {
  return magic === PCAPNG_MAGIC;
}

export function parsePcapng(
  bytes: Uint8Array,
  maxFrames: number,
  onFrame: FrameHandler,
  warnings: Warnings
): number {
  let pos = 0;
  let littleEndian = true;
  let interfaces: InterfaceDescription[] = [];
  let sawSection = false;
  let frames = 0;

  while (pos < bytes.length) {
    if (frames >= maxFrames) {
      warnings.add(`limit: frame cap ${maxFrames} reached`);
      break;
    }
    if (bytes.length - pos < 12) {
      warnings.add(`pcapng: truncated block header at offset ${pos}`);
      break;
    }

    const blockTypeLe = readU32(bytes, pos, true);
    let blockLittleEndian: boolean = littleEndian;
    if (blockTypeLe === PCAPNG_MAGIC) {
      if (bytes.length - pos < SHB_MIN_LENGTH) {
        warnings.add(`pcapng: truncated section header block at offset ${pos}`);
        break;
      }
      // The byte-order magic is inside the section header body.
      blockLittleEndian = readU32(bytes, pos + 8, true) === BYTE_ORDER_MAGIC;
      if (!blockLittleEndian && readU32(bytes, pos + 8, false) !== BYTE_ORDER_MAGIC) {
        warnings.add(`pcapng: invalid byte-order magic at offset ${pos}`);
        break;
      }
      littleEndian = blockLittleEndian;
      sawSection = true;
      interfaces = [];
    } else if (!sawSection) {
      warnings.add('pcapng: block before section header block');
      break;
    }

    const totalLength = readU32(bytes, pos + 4, blockLittleEndian);
    if (totalLength < 12 || totalLength % 4 !== 0) {
      warnings.add(`pcapng: invalid block length ${totalLength} at offset ${pos}`);
      break;
    }
    if (totalLength > bytes.length - pos) {
      warnings.add(`pcapng: truncated block body at offset ${pos} (${totalLength} bytes)`);
      break;
    }

    const bodyStart = pos + 8;
    const bodyLength = totalLength - 12;
    const body = bytes.subarray(bodyStart, bodyStart + bodyLength);
    const blockType = readU32(bytes, pos, blockLittleEndian);
    const trailer = readU32(bytes, pos + totalLength - 4, blockLittleEndian);
    if (trailer !== totalLength) {
      warnings.add(`pcapng: block length trailer mismatch at offset ${pos}`);
    }

    switch (blockType) {
      case PCAPNG_MAGIC:
        break; // section header already applied above
      case BLOCK_IDB: {
        if (bodyLength < 8) {
          warnings.add(`pcapng: malformed interface description block at offset ${pos}`);
          break;
        }
        const linktype = readU16(body, 0, littleEndian);
        interfaces.push({ linktype, snaplen: readU32(body, 4, littleEndian) });
        if (linktype !== 127 && linktype !== 105) {
          warnings.add(`linktype: unsupported ${linktype} (expected 127 radiotap or 105 802.11)`);
        }
        break;
      }
      case BLOCK_EPB: {
        if (bodyLength < 20) {
          warnings.add(`pcapng: malformed enhanced packet block at offset ${pos}`);
          break;
        }
        const interfaceId = readU32(body, 0, littleEndian);
        const capturedLength = readU32(body, 12, littleEndian);
        const iface = interfaces[interfaceId];
        if (iface === undefined) {
          warnings.add(`pcapng: enhanced packet block references unknown interface ${interfaceId}`);
          break;
        }
        const available = bodyLength - 20;
        const effective = Math.min(capturedLength, available);
        if (effective < capturedLength) {
          warnings.add(`pcapng: truncated packet data at offset ${pos}`);
        }
        if (effective > 0) {
          frames += 1;
          onFrame(iface.linktype, body.subarray(20, 20 + effective));
        }
        break;
      }
      case BLOCK_SPB: {
        if (bodyLength < 4) {
          warnings.add(`pcapng: malformed simple packet block at offset ${pos}`);
          break;
        }
        const iface = interfaces[0];
        if (iface === undefined) {
          warnings.add('pcapng: simple packet block without interface description');
          break;
        }
        const originalLength = readU32(body, 0, littleEndian);
        const caplen = iface.snaplen > 0 ? Math.min(originalLength, iface.snaplen) : originalLength;
        const available = bodyLength - 4;
        const effective = Math.min(caplen, available);
        if (effective < caplen) {
          warnings.add(`pcapng: truncated packet data at offset ${pos}`);
        }
        if (effective > 0) {
          frames += 1;
          onFrame(iface.linktype, body.subarray(4, 4 + effective));
        }
        break;
      }
      case BLOCK_PB:
        warnings.add('pcapng: obsolete packet block (type 2) skipped');
        break;
      default:
        break; // name resolution, statistics, custom blocks: skip by length
    }

    pos += totalLength;
  }

  return frames;
}
