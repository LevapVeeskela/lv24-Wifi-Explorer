import type { Lv24ScanDocument } from './types';

/** Pretty-printed JSON for a `.lv24scan` file (UTF-8 when written to disk). */
export function serializeLv24Scan(document: Lv24ScanDocument): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function encodeLv24ScanUtf8(document: Lv24ScanDocument): Uint8Array {
  return new TextEncoder().encode(serializeLv24Scan(document));
}
