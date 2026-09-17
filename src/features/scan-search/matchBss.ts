import type { ObservedBss } from '../../domain/bss';
import type { CompareOp, KeyedField, PhyShortcut, ScanPredicate, ScanQueryAst, SecurityShortcut } from './ast';

export interface ScanSearchMatchContext {
  annotation?: string;
  apName?: string;
}

export function matchBss(
  bss: ObservedBss,
  ast: ScanQueryAst,
  ctx: ScanSearchMatchContext = {},
): boolean {
  switch (ast.type) {
    case 'all':
      return true;
    case 'not':
      return !matchBss(bss, ast.inner, ctx);
    case 'bool':
      return ast.op === 'and'
        ? matchBss(bss, ast.left, ctx) && matchBss(bss, ast.right, ctx)
        : matchBss(bss, ast.left, ctx) || matchBss(bss, ast.right, ctx);
    case 'pred':
      return matchPredicate(bss, ast.pred, ctx);
    default:
      return true;
  }
}

function compareNum(op: CompareOp, left: number, right: number): boolean {
  switch (op) {
    case '>=':
      return left >= right;
    case '<=':
      return left <= right;
    case '>':
      return left > right;
    case '<':
      return left < right;
    case '=':
      return left === right;
    default:
      return false;
  }
}

function fold(s: string): string {
  return s.toLowerCase();
}

function ssidFields(bss: ObservedBss, ctx: ScanSearchMatchContext): string[] {
  const out: string[] = [];
  const id = bss.identity.ssid.status === 'available' ? bss.identity.ssid.value : null;
  if (id?.displayName) out.push(id.displayName);
  if (id?.utf8) out.push(id.utf8);
  if (ctx.annotation) out.push(ctx.annotation);
  if (ctx.apName) out.push(ctx.apName);
  const vendor = bss.vendor.organization;
  if (vendor) out.push(vendor);
  return out;
}

function bssidNormalized(bss: ObservedBss): string | null {
  if (bss.identity.bssid.status !== 'available') return null;
  return bss.identity.bssid.value.toLowerCase();
}

function isHidden(bss: ObservedBss): boolean {
  if (bss.identity.ssid.status !== 'available') return false;
  return bss.identity.ssid.value.hidden;
}

function rssiToPercent(rssiDbm: number): number {
  const clamped = Math.min(-30, Math.max(-100, rssiDbm));
  return ((clamped + 100) / 70) * 100;
}

function phyLetterFromShortcut(token: PhyShortcut): string | null {
  const map: Record<PhyShortcut, string | null> = {
    a: 'a',
    b: 'b',
    g: 'g',
    n: 'n',
    ac: 'ac',
    ax: 'ax',
    be: 'be',
    '11n': 'n',
    '11ac': 'ac',
    '11ax': 'ax',
    '11be': 'be',
    '802.11a': 'a',
    '802.11b': 'b',
    '802.11g': 'g',
    '802.11n': 'n',
    '802.11ac': 'ac',
    '802.11ax': 'ax',
    '802.11be': 'be',
  };
  return map[token];
}

function matchesSecurity(bss: ObservedBss, token: SecurityShortcut): boolean {
  const flags = bss.security.flags;
  const has = (k: string) => flags.includes(k as (typeof flags)[number]);

  switch (token) {
    case 'open':
      return bss.security.isOpen;
    case 'secure':
      return bss.security.isSecure;
    case 'wep':
      return has('wep');
    case 'wpa':
      return flags.some((f) => f.includes('wpa'));
    case 'wpa2':
      return flags.some((f) => f.includes('wpa2'));
    case 'wpa3':
      return flags.some((f) => f.includes('wpa3'));
    case 'owe':
      return has('owe') || has('owe-transition');
    case '802.1x':
      return flags.some((f) => f.includes('enterprise'));
    case 'psk':
      return flags.some((f) => f.includes('personal') || f === 'personal-generic');
    case 'sae':
      return has('wpa3-personal') || has('wpa3-transition');
    default:
      return false;
  }
}

function matchesGeneration(
  bss: ObservedBss,
  gen: 'wifi4' | 'wifi5' | 'wifi6' | 'wifi6e' | 'wifi7',
): boolean {
  const highest = bss.phy.highest;
  const band = bss.channel.band;
  switch (gen) {
    case 'wifi7':
      return highest === 'be';
    case 'wifi6e':
      return highest === 'ax' && band === 6;
    case 'wifi6':
      return highest === 'ax';
    case 'wifi5':
      return highest === 'ac';
    case 'wifi4':
      return highest === 'n';
    default:
      return false;
  }
}

function parseKeyedBand(value: string): 2.4 | 5 | 6 | null {
  const w = fold(value);
  if (w === '2.4' || w === '24' || w === '2.4ghz' || w === '24ghz') return 2.4;
  if (w === '5' || w === '5ghz') return 5;
  if (w === '6' || w === '6ghz') return 6;
  return null;
}

function matchKeyed(bss: ObservedBss, field: KeyedField, op: CompareOp | undefined, value: string, ctx: ScanSearchMatchContext): boolean {
  switch (field) {
    case 'ssid': {
      const hay = ssidFields(bss, ctx).join(' ').toLowerCase();
      const needle = fold(value);
      if (op === '=') return hay === needle || ssidFields(bss, ctx).some((s) => fold(s) === needle);
      return hay.includes(needle);
    }
    case 'bssid': {
      const mac = bssidNormalized(bss);
      if (!mac) return false;
      const needle = fold(value.replace(/-/g, ':'));
      return mac.includes(needle);
    }
    case 'vendor': {
      const org = bss.vendor.organization;
      if (!org) return false;
      return fold(org).includes(fold(value));
    }
    case 'channel': {
      const ch = bss.channel.number;
      const range = value.match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        const from = Number(range[1]);
        const to = Number(range[2]);
        const lo = Math.min(from, to);
        const hi = Math.max(from, to);
        return ch >= lo && ch <= hi;
      }
      const n = Number(value);
      if (Number.isNaN(n)) return false;
      return op ? compareNum(op ?? '=', ch, n) : ch === n;
    }
    case 'width': {
      const w = bss.channel.widthMhz;
      if (w === 'unknown') return false;
      const n = Number(value);
      if (Number.isNaN(n)) return false;
      return op ? compareNum(op, w, n) : w === n;
    }
    case 'band': {
      const parsed = parseKeyedBand(value);
      if (parsed == null) return false;
      return bss.channel.band === parsed;
    }
    case 'snr': {
      const snr = bss.signal.snrDb;
      if (snr == null || op == null) return false;
      return compareNum(op, snr, Number(value));
    }
    case 'signal': {
      if (op == null) return false;
      if (value.endsWith('%')) {
        const n = Number(value.slice(0, -1));
        if (Number.isNaN(n)) return false;
        return compareNum(op, rssiToPercent(bss.signal.rssiDbm), n);
      }
      const n = Number(value);
      if (Number.isNaN(n)) return false;
      return compareNum(op, bss.signal.rssiDbm, n);
    }
    case 'noise': {
      const noise = bss.signal.noiseDbm;
      if (noise == null || op == null) return false;
      return compareNum(op, noise, Number(value));
    }
    case 'country': {
      if (bss.countryCode.status !== 'available' || !bss.countryCode.value) return false;
      return fold(bss.countryCode.value) === fold(value);
    }
    case 'mode': {
      const letter = phyLetterFromShortcut(value as PhyShortcut) ?? fold(value);
      return bss.phy.supported.includes(letter as (typeof bss.phy.supported)[number]);
    }
    default:
      return false;
  }
}

function matchPredicate(bss: ObservedBss, pred: ScanPredicate, ctx: ScanSearchMatchContext): boolean {
  switch (pred.kind) {
    case 'keyword': {
      const hay = ssidFields(bss, ctx).join(' ').toLowerCase();
      return hay.includes(fold(pred.text));
    }
    case 'phrase': {
      const needle = fold(pred.text);
      return ssidFields(bss, ctx).some((field) => fold(field) === needle);
    }
    case 'band':
      return bss.channel.band === pred.band;
    case 'width':
      return bss.channel.widthMhz === pred.mhz;
    case 'channel':
      return bss.channel.number === pred.channel;
    case 'channelRange': {
      const lo = Math.min(pred.from, pred.to);
      const hi = Math.max(pred.from, pred.to);
      const ch = bss.channel.number;
      return ch >= lo && ch <= hi;
    }
    case 'bssidOctet': {
      const mac = bssidNormalized(bss);
      if (!mac) return false;
      return mac.includes(pred.fragment);
    }
    case 'signal':
      return compareNum(pred.op, bss.signal.rssiDbm, pred.valueDbm);
    case 'signalPct':
      return compareNum(pred.op, rssiToPercent(bss.signal.rssiDbm), pred.valuePct);
    case 'security':
      return matchesSecurity(bss, pred.token);
    case 'phy': {
      const letter = phyLetterFromShortcut(pred.token);
      if (!letter) return false;
      return bss.phy.supported.includes(letter as (typeof bss.phy.supported)[number]);
    }
    case 'generation':
      return matchesGeneration(bss, pred.gen);
    case 'hidden':
      return isHidden(bss);
    case 'keyed':
      return matchKeyed(bss, pred.field, pred.op, pred.value, ctx);
    default:
      return false;
  }
}
