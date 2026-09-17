/**
 * BSSID glob: `*` = 0+ hex digits, `?` = 1 hex digit.
 * Separators (`:` / `-`) are ignored so `A8:9D:21:*` matches `a8:9d:21:74:24:3e`.
 */

const HEX = '[0-9a-f]';

export function compactHex(value: string): string {
  return value.toLowerCase().replace(/[:\-]/g, '');
}

export function patternHasWildcard(pattern: string): boolean {
  return /[*?]/.test(pattern);
}

export function compactPattern(pattern: string): string {
  return pattern.trim().toLowerCase().replace(/[:\-]/g, '');
}

export function patternSpecificity(pattern: string): number {
  const compact = compactPattern(pattern);
  if (!compact) return -1;
  const wild = (compact.match(/[*?]/g) ?? []).length;
  const literal = compact.replace(/[*?]/g, '').length;
  const exactBonus = patternHasWildcard(pattern) ? 0 : 1_000_000;
  return exactBonus + literal * 10 - wild;
}

function globToRegExp(compactGlob: string): RegExp | null {
  if (!compactGlob) return null;
  let source = '^';
  for (const ch of compactGlob) {
    if (ch === '*') source += `${HEX}*`;
    else if (ch === '?') source += HEX;
    else if (/[0-9a-f]/.test(ch)) source += ch;
    else return null;
  }
  source += '$';
  try {
    return new RegExp(source);
  } catch {
    return null;
  }
}

/** True when `bssid` matches `pattern` (exact or `*` / `?`). */
export function matchBssidPattern(pattern: string, bssid: string): boolean {
  const hex = compactHex(bssid);
  if (!/^[0-9a-f]{12}$/.test(hex)) return false;

  const glob = compactPattern(pattern);
  if (!glob) return false;

  if (!patternHasWildcard(pattern)) {
    return glob === hex;
  }

  const re = globToRegExp(glob);
  return re ? re.test(hex) : false;
}
