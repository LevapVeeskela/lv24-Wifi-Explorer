import type { ObservedBss } from './bss';
import type { BandGhz } from './channel';
import { inferDfsChannel } from './issues/dfs';
import type { PhyLetter } from './phy';
import type { SecurityKind } from './security';

/**
 * Local Wi-Fi adapter capabilities used to score compatibility with a BSS.
 *
 * `estimated` is true when the backend inferred a value from the PHY mode
 * (for example `ax` → 160 MHz) instead of reading an exact capability field.
 */
export interface AdapterCapabilities {
  bands: readonly BandGhz[];
  phy: readonly PhyLetter[];
  /** 20/40/80/160/320; null when unknown. */
  maxWidthMhz: number | null;
  security: readonly SecurityKind[];
  streams: number | null;
  interfaceName: string | null;
  source: 'netsh' | 'iw' | 'system_profiler' | 'demo' | 'unknown';
  estimated: boolean;
}

export type CompatibilityFactorId = 'band' | 'phy' | 'width' | 'security' | 'signal';

export type CompatibilityFactorStatus = 'ok' | 'partial' | 'fail' | 'unknown';

export type CompatibilityFindingId =
  | 'bandUnsupported'
  | 'phyOlder'
  | 'widthLimited'
  | 'securityOlder'
  | 'weakSignal'
  | 'dfsChannel'
  | 'width40On24'
  | 'openNetwork'
  | 'unknownAdapter';

export type CompatibilityFinding = {
  id: CompatibilityFindingId;
  severity: 'critical' | 'warning' | 'info';
  /** Which side can improve the situation. */
  side: 'router' | 'device' | 'both';
};

export interface CompatibilityFactor {
  id: CompatibilityFactorId;
  earned: number;
  max: number;
  status: CompatibilityFactorStatus;
}

export interface CompatibilityResult {
  /** 1–10, rounded. */
  score: number;
  factors: readonly CompatibilityFactor[];
  findings: readonly CompatibilityFinding[];
  confidence: 'high' | 'partial' | 'low';
  /** True when the adapter capabilities were inferred rather than exact. */
  estimated: boolean;
}

const PHY_RANK: Record<PhyLetter, number> = {
  b: 1,
  a: 1,
  g: 2,
  n: 3,
  ac: 4,
  ax: 5,
  be: 6,
};

const WIDTH_RANK: Record<number, number> = {
  20: 1,
  40: 2,
  80: 3,
  160: 4,
  320: 5,
};

function highestPhy(phy: readonly PhyLetter[]): PhyLetter | null {
  let best: PhyLetter | null = null;
  for (const letter of phy) {
    if (best == null || PHY_RANK[letter] > PHY_RANK[best]) best = letter;
  }
  return best;
}

function widthRank(width: number | null): number | null {
  if (width == null) return null;
  return WIDTH_RANK[width] ?? null;
}

function securitySupported(bss: SecurityKind, adapter: readonly SecurityKind[]): boolean | null {
  if (adapter.length === 0) return null;
  if (bss === 'open' || bss === 'owe' || bss === 'owe-transition') return true;
  if (bss === 'unknown' || bss === 'personal-generic') return null;

  const has = (...kinds: SecurityKind[]) => kinds.some((kind) => adapter.includes(kind));
  switch (bss) {
    case 'wep':
    case 'dynamic-wep':
      return has('wep', 'dynamic-wep');
    case 'wpa-personal':
      return has('wpa-personal', 'wpa-personal-mixed', 'wpa2-personal', 'wpa3-transition');
    case 'wpa-personal-mixed':
    case 'wpa2-personal':
      return has('wpa2-personal', 'wpa-personal-mixed', 'wpa3-transition', 'wpa3-personal');
    case 'wpa3-personal':
      return has('wpa3-personal', 'wpa3-transition');
    case 'wpa3-transition':
      return has('wpa2-personal', 'wpa3-personal', 'wpa3-transition');
    case 'wpa-enterprise':
      return has('wpa-enterprise', 'wpa-enterprise-mixed', 'wpa2-enterprise');
    case 'wpa-enterprise-mixed':
    case 'wpa2-enterprise':
      return has('wpa2-enterprise', 'wpa-enterprise-mixed', 'wpa3-enterprise');
    case 'wpa3-enterprise':
      return has('wpa3-enterprise', 'wpa2-enterprise');
    case 'enterprise-generic':
      return null;
    default:
      return null;
  }
}

function bandStatus(
  bss: BandGhz | 'unknown',
  adapter: readonly BandGhz[]
): CompatibilityFactorStatus {
  if (bss === 'unknown' || adapter.length === 0) return 'unknown';
  return adapter.includes(bss) ? 'ok' : 'fail';
}

/**
 * Scores how well the local adapter can use one BSS. It is intentionally
 * conservative: missing adapter data lowers confidence, it does not invent a
 * perfect match.
 */
export function evaluateCompatibility(
  bss: ObservedBss,
  adapter: AdapterCapabilities
): CompatibilityResult {
  const findings = new Map<CompatibilityFindingId, CompatibilityFinding>();
  const add = (
    id: CompatibilityFindingId,
    severity: CompatibilityFinding['severity'],
    side: CompatibilityFinding['side']
  ) => {
    if (!findings.has(id)) findings.set(id, { id, severity, side });
  };

  const factors: CompatibilityFactor[] = [];

  const band = bandStatus(bss.channel.band, adapter.bands);
  const bandEarned = band === 'ok' ? 2 : band === 'unknown' ? 1 : 0;
  factors.push({ id: 'band', earned: bandEarned, max: 2, status: band });
  if (band === 'fail') add('bandUnsupported', 'critical', 'both');

  const adapterPhy = highestPhy(adapter.phy);
  const bssPhy = bss.phy.highest;
  let phyStatus: CompatibilityFactorStatus = 'unknown';
  let phyEarned = 1.5;
  if (adapterPhy != null && bssPhy != null) {
    const diff = PHY_RANK[adapterPhy] - PHY_RANK[bssPhy];
    if (diff >= 0) {
      phyStatus = 'ok';
      phyEarned = 3;
    } else if (diff === -1) {
      phyStatus = 'partial';
      phyEarned = 2;
      add('phyOlder', 'warning', 'both');
    } else if (diff === -2) {
      phyStatus = 'partial';
      phyEarned = 1;
      add('phyOlder', 'critical', 'both');
    } else {
      phyStatus = 'fail';
      phyEarned = 0;
      add('phyOlder', 'critical', 'both');
    }
  }
  factors.push({ id: 'phy', earned: phyEarned, max: 3, status: phyStatus });

  const adapterWidth = widthRank(adapter.maxWidthMhz);
  const bssWidth = bss.channel.widthMhz === 'unknown' ? null : widthRank(bss.channel.widthMhz);
  let widthStatus: CompatibilityFactorStatus = 'unknown';
  let widthEarned = 1;
  if (adapterWidth != null && bssWidth != null) {
    const diff = adapterWidth - bssWidth;
    if (diff >= 0) {
      widthStatus = 'ok';
      widthEarned = 2;
    } else if (diff === -1) {
      widthStatus = 'partial';
      widthEarned = 1;
      add('widthLimited', 'warning', 'both');
    } else {
      widthStatus = 'fail';
      widthEarned = 0;
      add('widthLimited', 'critical', 'both');
    }
  }
  factors.push({ id: 'width', earned: widthEarned, max: 2, status: widthStatus });
  if (bss.channel.band === 2.4 && bss.channel.widthMhz === 40) {
    add('width40On24', 'info', 'router');
  }

  const security = bss.security.isOpen
    ? true
    : securitySupported(bss.security.primary, adapter.security);
  let securityStatus: CompatibilityFactorStatus = 'unknown';
  let securityEarned = 1;
  if (security === true) {
    securityStatus = 'ok';
    securityEarned = 2;
  } else if (security === false) {
    securityStatus = 'fail';
    securityEarned = 0;
    add(
      'securityOlder',
      bss.security.primary === 'wpa3-personal' || bss.security.primary === 'wpa3-enterprise'
        ? 'critical'
        : 'warning',
      'both'
    );
  }
  if (bss.security.isOpen) add('openNetwork', 'warning', 'router');
  factors.push({ id: 'security', earned: securityEarned, max: 2, status: securityStatus });

  const rssi = bss.signal.rssiDbm;
  const snr = bss.signal.snrDb;
  let signalStatus: CompatibilityFactorStatus = 'unknown';
  let signalEarned = 0.5;
  if (Number.isFinite(rssi)) {
    if (rssi >= -67 && (snr == null || snr >= 25)) {
      signalStatus = 'ok';
      signalEarned = 1;
    } else if (rssi >= -75) {
      signalStatus = 'partial';
      signalEarned = 0.5;
      add('weakSignal', 'warning', 'both');
    } else {
      signalStatus = 'fail';
      signalEarned = 0;
      add('weakSignal', 'critical', 'both');
    }
  }
  factors.push({ id: 'signal', earned: signalEarned, max: 1, status: signalStatus });

  if (inferDfsChannel(bss.channel.band, bss.channel.number)) {
    add('dfsChannel', 'info', 'router');
  }
  if (adapter.source === 'unknown' || adapter.phy.length === 0) {
    add('unknownAdapter', 'info', 'device');
  }
  const unknown = factors.filter((factor) => factor.status === 'unknown').length;
  if (unknown > 0) {
    add('unknownAdapter', 'info', 'device');
  }

  const confidence = unknown === 0 ? 'high' : unknown <= 2 ? 'partial' : 'low';
  const total = factors.reduce((sum, factor) => sum + factor.earned, 0);
  const score = Math.max(1, Math.min(10, Math.round(total)));

  return {
    score,
    factors,
    findings: [...findings.values()],
    confidence,
    estimated: adapter.estimated,
  };
}

export { PHY_RANK, WIDTH_RANK };
