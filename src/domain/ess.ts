/**
 * Группировка BSS → ESS/SSID.
 *
 * Одинаковый SSID, разные BSSID = одна логическая сеть (роуминг/mesh/band).
 * Агрегаты — только по видимым членам группы. Скрытые и IBSS не смешивать
 * с инфраструктурным ESS того же имени.
 */

import type { BandGhz } from './channel';
import type { ObservedBss } from './bss';
import {
  asEssGroupKey,
  asSsidOctetHex,
  octetHexOf,
  octetsFromSsidFields,
  type Bssid,
  type EssGroupKey,
  type SsidIdentity,
} from './identity';
import type { SecurityKind } from './security';
import { SECURITY_PRIMARY_RANK } from './security';
import type { SignalQuality } from './signal';

export type EssKind = 'infrastructure' | 'ibss' | 'hidden-singleton';

export interface EssGroup {
  key: EssGroupKey;
  kind: EssKind;
  ssid: SsidIdentity;
  bssids: readonly Bssid[];
  members: readonly ObservedBss[];
  bssCount: number;
  /** BSSID с наибольшим RSSI среди current/stale. */
  strongestBssid: Bssid | null;
  strongestRssiDbm: number | null;
  bandMix: readonly BandGhz[];
  securityMix: readonly SecurityKind[];
  /** true, если в группе больше одного primary security. */
  securityMixed: boolean;
  qualityBest: SignalQuality | null;
}

/**
 * Правила ключа (спека, не код):
 * 1. hidden → `hidden-bss:<bssid>` — один BSS = одна «группа».
 * 2. ibss → `ibss:<octetHex>:<bssid>`.
 * 3. иначе → `ess:<octetHex>` независимо от канала/безопасности.
 *
 * Не группировать по «похожим» именам. Не сливать Open+WPA3 в разные ESS:
 * это один SSID с securityMix=true.
 */
export const ESS_GROUPING_RULES = {
  mergeSameSsidAcrossBands: true,
  mergeSameSsidAcrossSecurity: true,
  mergeHiddenTogether: false,
  mergeIbssWithEss: false,
} as const;

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
  octetHex: asSsidOctetHex(''),
  hidden: true,
  displayName: '<hidden>',
};

function isHiddenSsid(bss: ObservedBss): boolean {
  if (bss.identity.ssid.status === 'redacted') return true;
  return bss.identity.ssid.value.hidden;
}

function ssidOctetHexOf(bss: ObservedBss): string {
  if (bss.identity.ssid.status === 'available') return bss.identity.ssid.value.octetHex;
  return octetHexOf(octetsFromSsidFields(bss.lastRaw.ssidData, bss.lastRaw.ssid));
}

function bssidPartOf(bss: ObservedBss, index: number): string {
  if (bss.identity.bssid.status === 'available') return bss.identity.bssid.value;
  const raw = bss.lastRaw.bssid;
  return raw ?? `redacted:${index}`;
}

/**
 * Ключ ESS: по ssidData (octetHex).
 * Скрытые и IBSS не сливаются с инфраструктурным ESS.
 */
export function essGroupKeyOf(bss: ObservedBss, index = 0): {
  key: EssGroupKey;
  kind: EssKind;
} {
  const bssidPart = bssidPartOf(bss, index);
  const hex = ssidOctetHexOf(bss);

  if (bss.ibss) {
    return { key: asEssGroupKey(`ibss:${hex}:${bssidPart}`), kind: 'ibss' };
  }
  if (isHiddenSsid(bss)) {
    return { key: asEssGroupKey(`hidden-bss:${bssidPart}`), kind: 'hidden-singleton' };
  }
  return { key: asEssGroupKey(`ess:${hex}`), kind: 'infrastructure' };
}

function uniqueBands(members: readonly ObservedBss[]): BandGhz[] {
  const set = new Set<BandGhz>();
  for (const member of members) {
    if (member.channel.band !== 'unknown') set.add(member.channel.band);
  }
  return BAND_ORDER.filter((item) => set.has(item));
}

function uniqueSecurity(members: readonly ObservedBss[]): SecurityKind[] {
  const set = new Set<SecurityKind>();
  for (const member of members) set.add(member.security.primary);
  return SECURITY_PRIMARY_RANK.filter((kind) => set.has(kind));
}

function visibleForStrength(members: readonly ObservedBss[]): ObservedBss[] {
  const live = members.filter((member) => member.presence.presence !== 'disappeared');
  return live.length > 0 ? live : [...members];
}

function strongest(members: readonly ObservedBss[]): {
  strongestBssid: Bssid | null;
  strongestRssiDbm: number | null;
} {
  const pool = visibleForStrength(members);
  if (pool.length === 0) return { strongestBssid: null, strongestRssiDbm: null };
  let best = pool[0];
  for (const member of pool) {
    if (member.signal.rssiDbm > best.signal.rssiDbm) best = member;
  }
  const strongestBssid =
    best.identity.bssid.status === 'available' ? best.identity.bssid.value : null;
  return { strongestBssid, strongestRssiDbm: best.signal.rssiDbm };
}

function qualityBest(members: readonly ObservedBss[]): SignalQuality | null {
  const pool = visibleForStrength(members);
  if (pool.length === 0) return null;
  let best = pool[0].signal.quality;
  for (const member of pool) {
    if (QUALITY_RANK[member.signal.quality] > QUALITY_RANK[best]) {
      best = member.signal.quality;
    }
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
    .map((member) =>
      member.identity.bssid.status === 'available' ? member.identity.bssid.value : null,
    )
    .filter((item): item is Bssid => item != null);
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

/**
 * Сгруппировать BSS по ssidData.
 * Hidden и IBSS — отдельные синглтоны, не смешивать с infrastructure ESS.
 */
export function groupEss(bssRows: readonly ObservedBss[]): EssGroup[] {
  const buckets = new Map<string, { kind: EssKind; members: ObservedBss[] }>();
  const order: string[] = [];
  bssRows.forEach((bss, index) => {
    const { key, kind } = essGroupKeyOf(bss, index);
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
