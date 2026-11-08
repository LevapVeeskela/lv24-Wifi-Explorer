/**
 * Bounds-checked byte reader for capture formats.
 *
 * Every read returns `null` on truncation instead of throwing or silently
 * reading past the end: a malformed capture must produce a warning, not a
 * wrong value.
 */

export class ByteReader {
  readonly bytes: Uint8Array;
  pos: number;

  constructor(bytes: Uint8Array, pos = 0) {
    this.bytes = bytes;
    this.pos = pos;
  }

  get remaining(): number {
    return this.bytes.length - this.pos;
  }

  skip(count: number): boolean {
    if (count < 0 || this.remaining < count) return false;
    this.pos += count;
    return true;
  }

  /** Advance to the next multiple of `align` (1-based power-of-two). */
  align(align: number): boolean {
    if (align <= 1) return true;
    const pad = (align - (this.pos % align)) % align;
    return this.skip(pad);
  }

  u8(): number | null {
    if (this.remaining < 1) return null;
    const value = this.bytes[this.pos] as number;
    this.pos += 1;
    return value;
  }

  u16(le: boolean): number | null {
    if (this.remaining < 2) return null;
    const a = this.bytes[this.pos] as number;
    const b = this.bytes[this.pos + 1] as number;
    this.pos += 2;
    return le ? a | (b << 8) : (a << 8) | b;
  }

  u32(le: boolean): number | null {
    if (this.remaining < 4) return null;
    const b0 = this.bytes[this.pos] as number;
    const b1 = this.bytes[this.pos + 1] as number;
    const b2 = this.bytes[this.pos + 2] as number;
    const b3 = this.bytes[this.pos + 3] as number;
    this.pos += 4;
    return le
      ? (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0
      : ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
  }

  take(count: number): Uint8Array | null {
    if (count < 0 || this.remaining < count) return null;
    const slice = this.bytes.subarray(this.pos, this.pos + count);
    this.pos += count;
    return slice;
  }
}
