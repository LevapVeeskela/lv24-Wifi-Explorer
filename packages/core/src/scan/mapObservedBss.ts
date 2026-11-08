/**
 * CoreWlanNetworkRecord → ObservedBss: derived SNR/качество/канал/PHY/rate/presence.
 */

import type { CoreWlanNetworkRecord, ObservedBss } from '../domain/bss';
import type { ChannelWidthMhz } from '../domain/channel';
import type { IsoTime, LocationAuthorization } from '../domain/identity';
import type { MaxRateEstimate, PhyDisplay, PhyLetter, PhyView, RateBasis } from '../domain/phy';
import { MAX_RATE_1SS_LONG_GI_MBPS, PHY_DISPLAY_ORDER } from '../domain/phy';
import type { RsnHint, SecurityAuthClass, SecurityKind, SecurityView } from '../domain/security';
import { SECURITY_PRIMARY_RANK } from '../domain/security';
import type { QualityBasis, SignalQuality, SignalView } from '../domain/signal';
import { NOISE_VALID_DBM, RSSI_QUALITY_MIN_DBM, SNR_QUALITY_MIN_DB } from '../domain/signal';
import type { PresenceView, RssiHistoryPoint } from '../domain/timeseries';
import { PRESENCE_POLICY } from '../domain/timeseries';
import { computeChannelView } from './channelMath';
import { parseShallowIe } from './ieShallow';
import {
  asIsoTime,
  bssMatchKey,
  buildSsidIdentity,
  gateValue,
  locationFieldsAvailable,
  matchKeyFromRaw,
  normalizeBssid,
} from './identity';
import { type OuiLookup, STUB_OUI_LOOKUP, resolveVendorView } from './vendorStub';

export interface MapObservedBssOptions {
  location?: LocationAuthorization;
  ouiLookup?: OuiLookup;
}

const QUALITY_ORDER: readonly SignalQuality[] = ['excellent', 'good', 'fair', 'poor', 'unusable'];

export function isNoiseValid(noiseDbm: number): boolean {
  return noiseDbm >= NOISE_VALID_DBM.min && noiseDbm <= NOISE_VALID_DBM.max;
}

export function qualityFromTable(
  value: number,
  table: Record<SignalQuality, number>
): SignalQuality {
  for (const label of QUALITY_ORDER) {
    if (value >= table[label]) return label;
  }
  return 'unusable';
}

export function computeSignalView(rssiDbm: number, noiseRaw: number): SignalView {
  const noiseDbm = isNoiseValid(noiseRaw) ? noiseRaw : null;
  const snrDb = noiseDbm != null ? rssiDbm - noiseDbm : null;
  const qualityBasis: QualityBasis = snrDb != null ? 'snr' : 'rssi-fallback';
  const quality =
    snrDb != null
      ? qualityFromTable(snrDb, SNR_QUALITY_MIN_DB)
      : qualityFromTable(rssiDbm, RSSI_QUALITY_MIN_DBM);
  return { rssiDbm, noiseDbm, snrDb, quality, qualityBasis };
}

function authClassOf(primary: SecurityKind): SecurityAuthClass {
  switch (primary) {
    case 'open':
      return 'open';
    case 'owe':
    case 'owe-transition':
      return 'enhanced-open';
    case 'wep':
    case 'dynamic-wep':
    case 'personal-generic':
    case 'wpa-personal':
    case 'wpa-personal-mixed':
    case 'wpa2-personal':
    case 'wpa3-personal':
    case 'wpa3-transition':
      return 'personal';
    case 'enterprise-generic':
    case 'wpa-enterprise':
    case 'wpa-enterprise-mixed':
    case 'wpa2-enterprise':
    case 'wpa3-enterprise':
      return 'enterprise';
    default:
      return 'unknown';
  }
}

export function pickPrimarySecurity(flags: readonly SecurityKind[]): SecurityKind {
  let best: SecurityKind = 'unknown';
  let bestRank = -1;
  for (const flag of flags) {
    const rank = SECURITY_PRIMARY_RANK.indexOf(flag);
    if (rank > bestRank) {
      best = flag;
      bestRank = rank;
    }
  }
  return best;
}

export function computeSecurityView(flags: readonly SecurityKind[], ieHint: RsnHint): SecurityView {
  const unique: SecurityKind[] = [];
  for (const flag of flags) {
    if (!unique.includes(flag)) unique.push(flag);
  }
  const primary = unique.length === 0 ? 'unknown' : pickPrimarySecurity(unique);
  const authClass = authClassOf(primary);
  const isOpen = primary === 'open';
  const isSecure =
    authClass === 'personal' || authClass === 'enterprise' || authClass === 'enhanced-open';
  return { flags: unique, primary, authClass, isOpen, isSecure, ieHint };
}

export function computePhyView(supportedRaw: readonly PhyLetter[]): PhyView {
  const supported = PHY_DISPLAY_ORDER.filter((letter) => supportedRaw.includes(letter));
  const highest = supported.length > 0 ? supported[supported.length - 1] : null;
  const display = (supported.length > 0 ? supported.join('/') : '') as PhyDisplay | '';
  return { supported, highest, display, source: 'api-supportsPHYMode' };
}

type RatePhy = keyof typeof MAX_RATE_1SS_LONG_GI_MBPS;

function isRatePhy(letter: PhyLetter): letter is RatePhy {
  return letter !== 'be' && letter in MAX_RATE_1SS_LONG_GI_MBPS;
}

function lookup1ssLongGi(phy: RatePhy, width: ChannelWidthMhz | 'unknown'): number | null {
  const table = MAX_RATE_1SS_LONG_GI_MBPS[phy] as Partial<Record<ChannelWidthMhz, number>>;
  const target: ChannelWidthMhz = width === 'unknown' ? 20 : width;
  const descending: ChannelWidthMhz[] = [160, 80, 40, 20];
  for (const w of descending) {
    if (w > target) continue;
    const rate = table[w];
    if (rate != null) return rate;
  }
  return null;
}

export function estimateMaxRate(
  phy: PhyView,
  widthMhz: ChannelWidthMhz | 'unknown',
  nssHint: 1 | 2 | 3 | 4 | 8 | null
): MaxRateEstimate | null {
  const ratePhy = [...phy.supported].reverse().find(isRatePhy);
  if (!ratePhy) return null;
  const mbpsLow = lookup1ssLongGi(ratePhy, widthMhz);
  if (mbpsLow == null) return null;

  const hasNss = nssHint != null;
  const basis: RateBasis = hasNss ? 'ie-nss-mcs' : 'phy-width-1ss-long-gi';
  const nssUsed: 1 | 2 | 3 | 4 | 8 = hasNss ? nssHint : 1;
  const mbpsHigh = hasNss ? mbpsLow * nssUsed : null;

  return {
    mbpsLow,
    mbpsHigh,
    basis,
    nssUsed,
    disclaimer: 'not-a-link-speed',
  };
}

function rsnHintFromIe(ie: ObservedBss['ie']): RsnHint {
  if (ie.level === 'absent') return 'none';
  if (ie.level === 'raw-only' || ie.level === 'unsupported-deep') return 'unparsed';
  if (ie.rsnIe && ie.wpaVendorIe) return 'both';
  if (ie.rsnIe) return 'rsn-ie';
  if (ie.wpaVendorIe) return 'wpa-ie';
  return 'none';
}

export function pruneRssiHistory(
  points: readonly RssiHistoryPoint[],
  capturedAt: IsoTime
): RssiHistoryPoint[] {
  const end = Date.parse(capturedAt);
  const minAt = end - PRESENCE_POLICY.historyMaxAgeSeconds * 1000;
  const kept = points.filter((p) => {
    const t = Date.parse(p.at);
    return Number.isFinite(t) && t >= minAt && t <= end;
  });
  if (kept.length <= PRESENCE_POLICY.historyMaxPoints) return kept;
  return kept.slice(kept.length - PRESENCE_POLICY.historyMaxPoints);
}

export function stitchRssiHistory(
  prev: readonly RssiHistoryPoint[],
  next: readonly RssiHistoryPoint[],
  capturedAt: IsoTime
): RssiHistoryPoint[] {
  const byAt = new Map<string, RssiHistoryPoint>();
  for (const p of prev) byAt.set(p.at, p);
  for (const p of next) byAt.set(p.at, p);
  const merged = [...byAt.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return pruneRssiHistory(merged, capturedAt);
}

function presenceOnSeen(prev: ObservedBss | undefined, capturedAt: IsoTime): PresenceView {
  return {
    firstSeenAt: prev?.presence.firstSeenAt ?? capturedAt,
    lastSeenAt: capturedAt,
    lastMissingAt: prev?.presence.lastMissingAt ?? null,
    consecutiveMisses: 0,
    presence: 'current',
  };
}

/**
 * Сырой CWNetwork + предыдущая строка того же BSS → ObservedBss.
 * Presence здесь всегда `current`: пропуски считает mergeSnapshots.
 */
export function mapCoreWlanRecordToObservedBss(
  raw: CoreWlanNetworkRecord,
  prev: ObservedBss | undefined,
  capturedAt: IsoTime,
  options: MapObservedBssOptions = {}
): ObservedBss {
  const at = asIsoTime(capturedAt);
  const locOk = locationFieldsAvailable(raw, options.location);
  const bssidNorm = normalizeBssid(raw.bssid);
  const ssidIdentity = buildSsidIdentity(raw);
  const ie = parseShallowIe(raw.informationElementData);
  const signal = computeSignalView(raw.rssiDbm, raw.noiseDbm);
  const channel = computeChannelView(raw.channelNumber, raw.channelBand, raw.channelWidth, ie);
  const phy = computePhyView(raw.supportedPhyModes);
  const security = computeSecurityView(raw.supportedSecurity, rsnHintFromIe(ie));
  const maxRate = estimateMaxRate(phy, channel.widthMhz, ie.nssHint);
  const identity = {
    bssid:
      locOk && bssidNorm != null
        ? { status: 'available' as const, value: bssidNorm }
        : { status: 'redacted' as const, reason: 'location-required' as const },
    ssid: gateValue(locOk, ssidIdentity),
  };

  const point: RssiHistoryPoint = {
    at,
    rssiDbm: signal.rssiDbm,
    noiseDbm: signal.noiseDbm,
    snrDb: signal.snrDb,
    channelNumber: raw.channelNumber,
  };
  const rssiHistory = stitchRssiHistory(prev?.rssiHistory ?? [], [point], at);

  return {
    identity,
    ibss: raw.ibss,
    countryCode: gateValue(locOk, raw.countryCode),
    beaconIntervalMs: raw.beaconIntervalMs,
    signal,
    channel,
    security,
    phy,
    maxRate,
    vendor: resolveVendorView(identity.bssid, options.ouiLookup ?? STUB_OUI_LOOKUP),
    ie,
    presence: presenceOnSeen(prev, at),
    rssiHistory,
    lastRaw: raw,
  };
}

export function mapCoreWlanRecordsToObservedBss(
  records: readonly CoreWlanNetworkRecord[],
  prevRows: readonly ObservedBss[] | undefined,
  capturedAt: IsoTime,
  options: MapObservedBssOptions = {}
): ObservedBss[] {
  const prevMap = new Map<string, ObservedBss>();
  if (prevRows) {
    for (const row of prevRows) prevMap.set(bssMatchKey(row), row);
  }
  return records.map((raw) =>
    mapCoreWlanRecordToObservedBss(raw, prevMap.get(matchKeyFromRaw(raw)), capturedAt, options)
  );
}
