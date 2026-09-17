/**
 * Группировка BSS → ESS по ESS_GROUPING_RULES.
 * Скрытые пустые SSID не сливаются. IBSS изолирован.
 */

import type { ObservedBss } from '../domain/bss';
import type { BandGhz } from '../domain/channel';
import type { EssGroup, EssKind } from '../domain/ess';
import type { Bssid, EssGroupKey, SsidIdentity } from '../domain/identity';
import type { SecurityKind } from '../domain/security';
import { SECURITY_PRIMARY_RANK } from '../domain/security';
import type { SignalQuality } from '../domain/signal';

const BAND_ORDER: readonly BandGhz[] = [2.4, 5, 6];

const QUALITY_RANK: Record<SignalQuality, number> = {
  unusable: 0,
  poor: 1,
  fair: 2,
  good: 3,
  excellent: 4,
};

const EMPTY_SSID: SsidIdentity = {
  utf8: '',
  octets: [],
  octetHex: '' as SsidIdentity['octetHex'],
  hidden: true,
  displayName: '<hidden>',
};

function isHiddenSsid(bss: ObservedBss): boolean {
  if (bss.identity.ssid.status === 'redacted') return true;
  return bss.identity.ssid.value.hidden;
}

function essKeyOf(bss: ObservedBss, index: number): { key: EssGroupKey; kind: EssKind } {
  const bssidPart =
    bss.identity.bssid.status === 'available'
      ? bss.identity.bssid.value
      : `redacted:${index}`;
  const hex =
    bss.identity.ssid.status === 'available' ? bss.identity.ssid.value.octetHex : '';

  if (bss.ibss) {
    return { key: `ibss:${hex}:${bssidPart}` as EssGroupKey, kind: 'ibss' };
  }
  if (isHiddenSsid(bss)) {
    return { key: `hidden-bss:${bssidPart}` as EssGroupKey, kind: 'hidden-singleton' };
  }
  return { key: `ess:${hex}` as EssGroupKey, kind: 'infrastructure' };
}

function uniqueBands(members: readonly ObservedBss[]): BandGhz[] {
  const set = new Set<BandGhz>();
  for (const m of members) {
    if (m.channel.band !== 'unknown') set.add(m.channel.band);
  }
  return BAND_ORDER.filter((b) => set.has(b));
}

function uniqueSecurity(members: readonly ObservedBss[]): SecurityKind[] {
  const set = new Set<SecurityKind>();
  for (const m of members) set.add(m.security.primary);
  return SECURITY_PRIMARY_RANK.filter((k) => set.has(k));
}

function visibleForStrength(members: readonly ObservedBss[]): ObservedBss[] {
  const live = members.filter((m) => m.presence.presence !== 'disappeared');
  return live.length > 0 ? live : [...members];
}

function strongest(members: readonly ObservedBss[]): {
  strongestBssid: Bssid | null;
  strongestRssiDbm: number | null;
} {
  const pool = visibleForStrength(members);
  if (pool.length === 0) return { strongestBssid: null, strongestRssiDbm: null };
  let best = pool[0];
  for (const m of pool) {
    if (m.signal.rssiDbm > best.signal.rssiDbm) best = m;
  }
  const strongestBssid =
    best.identity.bssid.status === 'available' ? best.identity.bssid.value : null;
  return { strongestBssid, strongestRssiDbm: best.signal.rssiDbm };
}

function qualityBest(members: readonly ObservedBss[]): SignalQuality | null {
  const pool = visibleForStrength(members);
  if (pool.length === 0) return null;
  let best = pool[0].signal.quality;
  for (const m of pool) {
    if (QUALITY_RANK[m.signal.quality] > QUALITY_RANK[best]) best = m.signal.quality;
  }
  return best;
}

function groupSsid(members: readonly ObservedBss[]): SsidIdentity {
  const first = members[0];
  if (!first || first.identity.ssid.status === 'redacted') return EMPTY_SSID;
  return first.identity.ssid.value;
}

function finishGroup(
  key: EssGroupKey,
  kind: EssKind,
  members: readonly ObservedBss[],
): EssGroup {
  const securityMix = uniqueSecurity(members);
  const { strongestBssid, strongestRssiDbm } = strongest(members);
  const bssids = members
    .map((m) => (m.identity.bssid.status === 'available' ? m.identity.bssid.value : null))
    .filter((b): b is Bssid => b != null);
  return {
    key,
    kind,
    ssid: groupSsid(members),
    bssids,
    members,
    bssCount: members.length,
    strongestBssid,
    strongestRssiDbm,
    bandMix: uniqueBands(members),
    securityMix,
    securityMixed: securityMix.length > 1,
    qualityBest: qualityBest(members),
  };
}

export function groupEss(bssRows: readonly ObservedBss[]): EssGroup[] {
  const buckets = new Map<string, { kind: EssKind; members: ObservedBss[] }>();
  const order: string[] = [];
  bssRows.forEach((bss, index) => {
    const { key, kind } = essKeyOf(bss, index);
    const existing = buckets.get(key);
    if (existing) {
      existing.members.push(bss);
      return;
    }
    buckets.set(key, { kind, members: [bss] });
    order.push(key);
  });
  return order.map((key) => {
    const bucket = buckets.get(key)!;
    return finishGroup(key as EssGroupKey, bucket.kind, bucket.members);
  });
}
