import 'bss.dart';
import 'channel.dart';
import 'identity.dart';
import 'security.dart';
import 'signal.dart';
import 'timeseries.dart';

enum EssKind { infrastructure, ibss, hiddenSingleton }

class EssGroup {
  const EssGroup({
    required this.key,
    required this.kind,
    required this.ssid,
    required this.bssids,
    required this.members,
    required this.bssCount,
    required this.strongestBssid,
    required this.strongestRssiDbm,
    required this.bandMix,
    required this.securityMix,
    required this.securityMixed,
    required this.qualityBest,
  });

  final EssGroupKey key;
  final EssKind kind;
  final SsidIdentity ssid;
  final List<Bssid> bssids;
  final List<ObservedBss> members;
  final int bssCount;
  final Bssid? strongestBssid;
  final double? strongestRssiDbm;
  final List<WifiBand> bandMix;
  final List<SecurityKind> securityMix;
  final bool securityMixed;
  final SignalQuality? qualityBest;
}

const essGroupingRules = (
  mergeSameSsidAcrossBands: true,
  mergeSameSsidAcrossSecurity: true,
  mergeHiddenTogether: false,
  mergeIbssWithEss: false,
);

const _bandOrder = <WifiBand>[WifiBand.ghz24, WifiBand.ghz5, WifiBand.ghz6];

const _qualityRank = <SignalQuality, int>{
  SignalQuality.unusable: 0,
  SignalQuality.poor: 1,
  SignalQuality.fair: 2,
  SignalQuality.good: 3,
  SignalQuality.excellent: 4,
};

const _emptySsid = SsidIdentity(
  utf8: '',
  octets: [],
  octetHex: '',
  hidden: true,
  displayName: '<hidden>',
);

bool _isHiddenSsid(ObservedBss bss) {
  final ssid = bss.identity.ssid;
  if (ssid is LocationRedacted<SsidIdentity>) return true;
  if (ssid is LocationAvailable<SsidIdentity>) return ssid.value.hidden;
  return true;
}

String _ssidOctetHexOf(ObservedBss bss) {
  final ssid = bss.identity.ssid;
  if (ssid is LocationAvailable<SsidIdentity>) return ssid.value.octetHex;
  return octetHexOf(octetsFromSsidFields(
    bss.lastRaw.ssidData,
    bss.lastRaw.ssid,
  ));
}

String _bssidPartOf(ObservedBss bss, int index) {
  final bssid = bss.identity.bssid;
  if (bssid is LocationAvailable<Bssid>) return bssid.value;
  return bss.lastRaw.bssid ?? 'redacted:$index';
}

({EssGroupKey key, EssKind kind}) essGroupKeyOf(ObservedBss bss, [int index = 0]) {
  final bssidPart = _bssidPartOf(bss, index);
  final hex = _ssidOctetHexOf(bss);

  if (bss.ibss) {
    return (
      key: asEssGroupKey('ibss:$hex:$bssidPart'),
      kind: EssKind.ibss,
    );
  }
  if (_isHiddenSsid(bss)) {
    return (
      key: asEssGroupKey('hidden-bss:$bssidPart'),
      kind: EssKind.hiddenSingleton,
    );
  }
  return (key: asEssGroupKey('ess:$hex'), kind: EssKind.infrastructure);
}

List<WifiBand> _uniqueBands(List<ObservedBss> members) {
  final set = <WifiBand>{};
  for (final member in members) {
    final band = member.channel.band;
    if (band != null) set.add(band);
  }
  return _bandOrder.where(set.contains).toList();
}

List<SecurityKind> _uniqueSecurity(List<ObservedBss> members) {
  final set = <SecurityKind>{};
  for (final member in members) {
    set.add(member.security.primary);
  }
  return securityPrimaryRank.where(set.contains).toList();
}

List<ObservedBss> _visibleForStrength(List<ObservedBss> members) {
  final live =
      members.where((m) => m.presence.presence != Presence.disappeared).toList();
  return live.isNotEmpty ? live : List<ObservedBss>.from(members);
}

({Bssid? strongestBssid, double? strongestRssiDbm}) _strongest(
  List<ObservedBss> members,
) {
  final pool = _visibleForStrength(members);
  if (pool.isEmpty) return (strongestBssid: null, strongestRssiDbm: null);
  var best = pool.first;
  for (final member in pool) {
    if (member.signal.rssiDbm > best.signal.rssiDbm) best = member;
  }
  final strongestBssid = best.identity.bssid is LocationAvailable<Bssid>
      ? (best.identity.bssid as LocationAvailable<Bssid>).value
      : null;
  return (strongestBssid: strongestBssid, strongestRssiDbm: best.signal.rssiDbm);
}

SignalQuality? _qualityBest(List<ObservedBss> members) {
  final pool = _visibleForStrength(members);
  if (pool.isEmpty) return null;
  var best = pool.first.signal.quality;
  for (final member in pool) {
    final q = member.signal.quality;
    if (_qualityRank[q]! > _qualityRank[best]!) best = q;
  }
  return best;
}

SsidIdentity _groupSsid(List<ObservedBss> members) {
  final first = members.firstOrNull;
  if (first == null) return _emptySsid;
  final ssid = first.identity.ssid;
  if (ssid is LocationRedacted<SsidIdentity>) return _emptySsid;
  if (ssid is LocationAvailable<SsidIdentity>) return ssid.value;
  return _emptySsid;
}

EssGroup _finishGroup(
  EssGroupKey key,
  EssKind kind,
  List<ObservedBss> members,
) {
  final securityMix = _uniqueSecurity(members);
  final strength = _strongest(members);
  final bssids = members
      .map((member) => member.identity.bssid is LocationAvailable<Bssid>
          ? (member.identity.bssid as LocationAvailable<Bssid>).value
          : null)
      .whereType<Bssid>()
      .toList();
  return EssGroup(
    key: key,
    kind: kind,
    ssid: _groupSsid(members),
    bssids: bssids,
    members: members,
    bssCount: members.length,
    strongestBssid: strength.strongestBssid,
    strongestRssiDbm: strength.strongestRssiDbm,
    bandMix: _uniqueBands(members),
    securityMix: securityMix,
    securityMixed: securityMix.length > 1,
    qualityBest: _qualityBest(members),
  );
}

List<EssGroup> groupEss(List<ObservedBss> bssRows) {
  final buckets = <String, EssKind>{};
  final membersByKey = <String, List<ObservedBss>>{};
  final order = <String>[];

  for (var index = 0; index < bssRows.length; index++) {
    final bss = bssRows[index];
    final keyed = essGroupKeyOf(bss, index);
    if (!membersByKey.containsKey(keyed.key)) {
      buckets[keyed.key] = keyed.kind;
      membersByKey[keyed.key] = [];
      order.add(keyed.key);
    }
    membersByKey[keyed.key]!.add(bss);
  }

  return order.map((key) {
    return _finishGroup(key, buckets[key]!, membersByKey[key]!);
  }).toList();
}
