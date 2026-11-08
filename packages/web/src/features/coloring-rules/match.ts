/**
 * Pure matching helpers for coloring rules: BSSID hex glob, generic `*`/`?`
 * glob and numeric token parsing. No imports — safe for every layer.
 */

/** Lowercase hex of a BSSID; separators are ignored. */
export function compactBssid(value: string): string {
  return value.toLowerCase().replace(/[^0-9a-f]/g, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Simple glob: `*` = any run of characters, `?` = exactly one character.
 * Case-insensitive; used verbatim (no BSSID normalization).
 */
export function matchGlob(pattern: string, value: string): boolean {
  if (!pattern.includes('*') && !pattern.includes('?')) {
    return value.toLowerCase() === pattern.toLowerCase();
  }
  const source = pattern
    .split('')
    .map((ch) => (ch === '*' ? '.*' : ch === '?' ? '.' : escapeRegExp(ch)))
    .join('');
  try {
    return new RegExp(`^${source}$`, 'i').test(value);
  } catch {
    return false;
  }
}

/**
 * BSSID glob: `*` = 0+ hex digits, `?` = 1 hex digit; `:`/`-` ignored on both
 * sides so `A8:9D:21:*` matches `a8:9d:21:74:24:3e`.
 */
export function matchBssidGlob(pattern: string, bssid: string): boolean {
  const hex = compactBssid(bssid);
  if (!/^[0-9a-f]{12}$/.test(hex)) return false;

  const glob = pattern
    .trim()
    .toLowerCase()
    .replace(/[^0-9a-f*?]/g, '');
  if (!glob) return false;
  if (!/[*?]/.test(glob)) return glob === hex;

  let source = '^';
  for (const ch of glob) {
    if (ch === '*') source += '[0-9a-f]*';
    else if (ch === '?') source += '[0-9a-f]';
    else if (/[0-9a-f]/.test(ch)) source += ch;
    else return false;
  }
  source += '$';
  try {
    return new RegExp(source).test(hex);
  } catch {
    return false;
  }
}

/**
 * Parses a numeric token, accepting band suffixes: `5`, `2.4`, `6`, `5ghz`,
 * `2.4 GHz`. Returns NaN when the token is not a finite number.
 */
export function parseNumericToken(raw: string): number {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return Number.NaN;
  const withoutBandSuffix = trimmed.replace(/\s*ghz$/, '');
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(withoutBandSuffix)) return Number.NaN;
  const parsed = Number(withoutBandSuffix);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
