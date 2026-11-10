/**
 * Build-time codec for the MUI X license key.
 *
 * The key never appears in source: it comes from `VITE_MUI_LICENSE_KEY`
 * (a GitHub Actions secret in CI, `.env.local` locally). Vite replaces the
 * `import.meta.env` access with a random placeholder; the plugin in
 * `vite.config.ts` swaps that placeholder for a decoder expression built here,
 * after minification.
 *
 * This is obfuscation, not encryption. The decoder ships in the bundle, so a
 * determined user can still recover the key at runtime. It only defeats
 * `grep`/`strings` and casual inspection of `app.asar`.
 */

export type EncodedLicenseKey = {
  /** Key bytes XORed with `pad` and rotated by 7. */
  cipher: readonly number[];
  /** Repeating pad, one byte per key byte. */
  pad: readonly number[];
};

const ROTATION = 7;
const MASK = 0xff;

export function encodeLicenseKey(key: string, pad: Uint8Array): EncodedLicenseKey {
  if (pad.length === 0) throw new Error('encodeLicenseKey: pad must not be empty');
  const bytes = new TextEncoder().encode(key);
  return {
    cipher: Array.from(
      bytes,
      (byte, index) => ((byte ^ pad[index % pad.length]) + ROTATION) & MASK
    ),
    pad: Array.from(pad),
  };
}

export function decodeLicenseKey({ cipher, pad }: EncodedLicenseKey): string {
  if (pad.length === 0) throw new Error('decodeLicenseKey: pad must not be empty');
  const bytes = Uint8Array.from(
    cipher,
    (value, index) => ((value - ROTATION) & MASK) ^ pad[index % pad.length]
  );
  return new TextDecoder().decode(bytes);
}

/** Minified IIFE that rebuilds the key; injected into the final chunk. */
export function licenseKeyDecoderSource({ cipher, pad }: EncodedLicenseKey): string {
  return (
    '(function(){for(var a=new Uint8Array([' +
    cipher.join(',') +
    ']),b=[' +
    pad.join(',') +
    '],i=0;i<a.length;i++)a[i]=((a[i]-7)&255)^b[i%b.length];return new TextDecoder().decode(a)})()'
  );
}
