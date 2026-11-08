import type { CompareOp, PhyShortcut, ScanPredicate, SecurityShortcut } from './ast';

const WIDTH_MHZ = new Set([20, 40, 80, 160]);

const SECURITY_WORDS: Record<string, SecurityShortcut> = {
  open: 'open',
  secure: 'secure',
  wep: 'wep',
  wpa: 'wpa',
  wpa2: 'wpa2',
  wpa3: 'wpa3',
  owe: 'owe',
  '802.1x': '802.1x',
  psk: 'psk',
  sae: 'sae',
};

const PHY_WORDS: Record<string, PhyShortcut> = {
  a: 'a',
  b: 'b',
  g: 'g',
  n: 'n',
  ac: 'ac',
  ax: 'ax',
  be: 'be',
  '11n': '11n',
  '11ac': '11ac',
  '11ax': '11ax',
  '11be': '11be',
  '802.11a': '802.11a',
  '802.11b': '802.11b',
  '802.11g': '802.11g',
  '802.11n': '802.11n',
  '802.11ac': '802.11ac',
  '802.11ax': '802.11ax',
  '802.11be': '802.11be',
};

const GENERATION_WORDS = new Set(['wifi4', 'wifi5', 'wifi6', 'wifi6e', 'wifi7']);

const HIDDEN_LITERALS = new Set(['hidden', '\u0000', '<hidden>', '«скрытая»', 'скрытая']);

function fold(word: string): string {
  return word.trim().toLowerCase();
}

/**
 * Colon or hyphen IEEE MAC / prefix (`3c:5a`, `3c-5a-b0-11-22-33`).
 * Two all-digit hyphen parts (`36-48`) stay a channel range, not a BSSID.
 * Bare hex without a separator (`3c`) is not a BSSID (ambiguous with channel).
 */
export function isBssidOctetToken(raw: string): boolean {
  const w = raw.toLowerCase();
  const hasColon = w.includes(':');
  const hasHyphen = w.includes('-');
  if (hasColon === hasHyphen) return false;
  const sep = hasColon ? ':' : '-';
  if (!(hasColon ? /^[0-9a-f:]+$/i : /^[0-9a-f-]+$/i).test(w)) return false;
  const parts = w.split(sep).filter((p) => p.length > 0);
  if (parts.length === 0) return true;
  if (!parts.every((p) => p.length <= 2 && /^[0-9a-f]*$/i.test(p))) return false;
  if (hasHyphen && parts.length === 2 && parts.every((p) => /^\d+$/.test(p))) {
    return false;
  }
  return true;
}

function parseBandWord(raw: string): ScanPredicate | null {
  const w = fold(raw);
  if (w === '2.4' || w === '2.4ghz' || w === '24ghz') {
    return { kind: 'band', band: 2.4 };
  }
  if (w === '5ghz') {
    return { kind: 'band', band: 5 };
  }
  if (w === '6ghz') {
    return { kind: 'band', band: 6 };
  }
  return null;
}

function parseWidthWord(raw: string): ScanPredicate | null {
  const w = fold(raw);
  const m = w.match(/^(\d+)mhz$/);
  if (m) {
    const n = Number(m[1]);
    if (n === 20 || n === 40 || n === 80 || n === 160) {
      return { kind: 'width', mhz: n };
    }
    return null;
  }
  const n = Number(w);
  if (WIDTH_MHZ.has(n as 20)) {
    return { kind: 'width', mhz: n as 20 | 40 | 80 | 160 };
  }
  return null;
}

function parseChannelWord(raw: string): ScanPredicate | null {
  const w = raw.trim();
  const range = w.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) {
    return {
      kind: 'channelRange',
      from: Number(range[1]),
      to: Number(range[2]),
    };
  }
  if (!/^\d+$/.test(w)) return null;
  const n = Number(w);
  if (WIDTH_MHZ.has(n as 20) && n !== 5) {
    return null;
  }
  return { kind: 'channel', channel: n };
}

function parseNumberChannelOrWidth(raw: string): ScanPredicate | null {
  const w = raw.trim();
  if (!/^-?\d+(\.\d+)?$/.test(w)) return null;
  const n = Number(w);
  if (n === 5) {
    return { kind: 'channel', channel: 5 };
  }
  if (WIDTH_MHZ.has(n as 20)) {
    return { kind: 'width', mhz: n as 20 | 40 | 80 | 160 };
  }
  return { kind: 'channel', channel: n };
}

export function classifyBareWord(raw: string): ScanPredicate | null {
  const band = parseBandWord(raw);
  if (band) return band;

  const w = fold(raw);
  if (HIDDEN_LITERALS.has(w) || HIDDEN_LITERALS.has(raw)) {
    return { kind: 'hidden' };
  }

  const sec = SECURITY_WORDS[w];
  if (sec) return { kind: 'security', token: sec };

  const phy = PHY_WORDS[w] ?? PHY_WORDS[raw];
  if (phy) return { kind: 'phy', token: phy };

  if (GENERATION_WORDS.has(w)) {
    return {
      kind: 'generation',
      gen: w as 'wifi4' | 'wifi5' | 'wifi6' | 'wifi6e' | 'wifi7',
    };
  }

  if (w === 'wps' || w === 'ft') {
    return { kind: 'keyword', text: w };
  }

  const width = parseWidthWord(raw);
  if (width) return width;

  const channel = parseChannelWord(raw);
  if (channel) return channel;

  if (isBssidOctetToken(raw)) {
    return { kind: 'bssidOctet', fragment: raw.toLowerCase() };
  }

  return { kind: 'keyword', text: raw };
}

export function classifyNumberToken(raw: string): ScanPredicate | null {
  return parseNumberChannelOrWidth(raw);
}

export function classifyQuoted(text: string): ScanPredicate {
  return { kind: 'phrase', text };
}

export function classifyCompareOnly(op: CompareOp, valueToken: string): ScanPredicate | null {
  const pct = valueToken.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (pct) {
    return { kind: 'signalPct', op, valuePct: Number(pct[1]) };
  }
  if (/^-?\d+(\.\d+)?$/.test(valueToken)) {
    return { kind: 'signal', op, valueDbm: Number(valueToken) };
  }
  return null;
}

const KEYED_FIELDS = new Set([
  'ssid',
  'bssid',
  'vendor',
  'channel',
  'width',
  'band',
  'snr',
  'signal',
  'noise',
  'country',
  'mode',
]);

export function splitKeyedWord(raw: string): { field: string; rest: string } | null {
  const lower = raw.toLowerCase();
  for (const field of KEYED_FIELDS) {
    if (lower.startsWith(field)) {
      const tail = raw.slice(field.length);
      if (tail.length === 0) return { field, rest: '' };
      const opMatch = tail.match(/^(>=|<=|>|<|=)(.+)$/);
      if (opMatch) {
        return { field, rest: opMatch[1] + opMatch[2] };
      }
      if (tail.startsWith(':')) {
        return { field, rest: tail.slice(1) };
      }
    }
  }
  return null;
}

export function parseKeyedPredicate(field: string, rest: string): ScanPredicate | null {
  const f = field.toLowerCase();
  if (!KEYED_FIELDS.has(f)) return null;

  const opMatch = rest.match(/^(>=|<=|>|<|=)(.+)$/);
  if (opMatch) {
    const op = opMatch[1] as CompareOp;
    const val = opMatch[2].trim();
    if (f === 'snr' || f === 'signal' || f === 'noise') {
      if (!/^-?\d+(\.\d+)?%?$/.test(val)) return null;
      const pct = val.endsWith('%');
      const num = Number(pct ? val.slice(0, -1) : val);
      if (f === 'signal' && pct) {
        return { kind: 'keyed', field: 'signal', op, value: `${num}%` };
      }
      return { kind: 'keyed', field: f as 'snr' | 'signal' | 'noise', op, value: String(num) };
    }
    return { kind: 'keyed', field: f as 'ssid', op, value: val };
  }

  if (rest.length === 0) return null;
  return { kind: 'keyed', field: f as 'ssid', value: rest };
}
