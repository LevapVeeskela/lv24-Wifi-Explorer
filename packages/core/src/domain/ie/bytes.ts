/** Hex без разделителей, lowercase. */
export function toHex(bytes: readonly number[]): string {
  let out = '';
  for (const b of bytes) {
    out += (b & 0xff).toString(16).padStart(2, '0');
  }
  return out;
}

export function formatOui(bytes: readonly number[]): string | null {
  if (bytes.length < 3) return null;
  return `${(bytes[0] & 0xff).toString(16).padStart(2, '0')}:${(bytes[1] & 0xff)
    .toString(16)
    .padStart(2, '0')}:${(bytes[2] & 0xff).toString(16).padStart(2, '0')}`;
}

export function u16le(bytes: readonly number[], offset: number): number | null {
  if (offset + 1 >= bytes.length) return null;
  return (bytes[offset] & 0xff) | ((bytes[offset + 1] & 0xff) << 8);
}

export interface IeTlv {
  id: number;
  payload: readonly number[];
}

/** TLV-проход: id + length + payload. Обрыв — стоп, хвост не выдумываем. */
export function walkIeTlvs(data: readonly number[]): IeTlv[] {
  const out: IeTlv[] = [];
  let offset = 0;
  while (offset < data.length) {
    if (offset + 1 >= data.length) break;
    const id = data[offset] & 0xff;
    const len = data[offset + 1] & 0xff;
    if (offset + 2 + len > data.length) break;
    out.push({ id, payload: data.slice(offset + 2, offset + 2 + len) });
    offset += 2 + len;
  }
  return out;
}

export function asciiLetters(a: number, b: number): string | null {
  if (a < 0x41 || a > 0x5a || b < 0x41 || b > 0x5a) return null;
  return String.fromCharCode(a, b);
}
