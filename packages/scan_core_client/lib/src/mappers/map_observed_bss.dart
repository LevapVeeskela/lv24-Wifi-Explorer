import 'dart:convert';

import 'package:scan_domain/scan_domain.dart';

const _phyDisplayOrder = <PhyLetter>[
  PhyLetter.a,
  PhyLetter.b,
  PhyLetter.g,
  PhyLetter.n,
  PhyLetter.ac,
  PhyLetter.ax,
  PhyLetter.be,
];

class MapObservedBssOptions {
  const MapObservedBssOptions({this.location});

  final LocationAuthorization? location;
}

bool locationFieldsAvailable(
  CoreWlanNetworkRecord raw,
  LocationAuthorization? location,
) {
  if (location == LocationAuthorization.denied ||
      location == LocationAuthorization.restricted) {
    return false;
  }
  if (location == LocationAuthorization.granted) return true;
  return raw.bssid != null ||
      raw.ssid != null ||
      raw.ssidData != null ||
      raw.countryCode != null;
}

LocationGated<T> gateValue<T>(bool available, T value) {
  if (!available) return LocationRedacted<T>();
  return LocationAvailable(value);
}

List<int> octetsFromRaw(CoreWlanNetworkRecord raw) {
  return octetsFromSsidFields(raw.ssidData, raw.ssid);
}

String? decodeSsidUtf8(List<int> octets) {
  if (octets.isEmpty) return '';
  try {
    return utf8.decode(octets, allowMalformed: false);
  } catch (_) {
    return null;
  }
}

String ssidDisplayName({
  required bool hidden,
  required String? utf8,
  required String octetHex,
}) {
  if (hidden) return '<hidden>';
  if (utf8 != null && utf8.isNotEmpty) return utf8;
  return 'hex:$octetHex';
}

SsidIdentity buildSsidIdentity(CoreWlanNetworkRecord raw) {
  final octets = octetsFromRaw(raw);
  final hidden = octets.isEmpty;
  final utf8 = decodeSsidUtf8(octets);
  final octetHex = octetHexOf(octets);
  return SsidIdentity(
    utf8: utf8,
    octets: octets,
    octetHex: octetHex,
    hidden: hidden,
    displayName: ssidDisplayName(hidden: hidden, utf8: utf8, octetHex: octetHex),
  );
}

String matchKeyFromRaw(CoreWlanNetworkRecord raw) {
  return bssMatchKeyFromRaw(
    bssid: raw.bssid,
    ssidData: raw.ssidData,
    ssid: raw.ssid,
    channelNumber: raw.channelNumber,
    channelBand: coreWlanChannelBandKey(raw.channelBand),
    ibss: raw.ibss,
  );
}

String bssMatchKey(ObservedBss bss) {
  return matchKeyFromRaw(bss.lastRaw);
}

// parseShallowIe is provided by scan_domain (public scan IEs only).

SecurityAuthClass authClassOf(SecurityKind primary) {
  return switch (primary) {
    SecurityKind.open => SecurityAuthClass.open,
    SecurityKind.owe || SecurityKind.oweTransition => SecurityAuthClass.enhancedOpen,
    SecurityKind.wep ||
    SecurityKind.dynamicWep ||
    SecurityKind.personalGeneric ||
    SecurityKind.wpaPersonal ||
    SecurityKind.wpaPersonalMixed ||
    SecurityKind.wpa2Personal ||
    SecurityKind.wpa3Personal ||
    SecurityKind.wpa3Transition =>
      SecurityAuthClass.personal,
    SecurityKind.enterpriseGeneric ||
    SecurityKind.wpaEnterprise ||
    SecurityKind.wpaEnterpriseMixed ||
    SecurityKind.wpa2Enterprise ||
    SecurityKind.wpa3Enterprise =>
      SecurityAuthClass.enterprise,
    _ => SecurityAuthClass.unknown,
  };
}

SecurityKind pickPrimarySecurity(List<SecurityKind> flags) {
  SecurityKind best = SecurityKind.unknown;
  var bestRank = -1;
  for (final flag in flags) {
    final rank = securityPrimaryRank.indexOf(flag);
    if (rank > bestRank) {
      best = flag;
      bestRank = rank;
    }
  }
  return best;
}

SecurityView computeSecurityView(List<SecurityKind> flags) {
  final unique = <SecurityKind>[];
  for (final flag in flags) {
    if (!unique.contains(flag)) unique.add(flag);
  }
  final primary =
      unique.isEmpty ? SecurityKind.unknown : pickPrimarySecurity(unique);
  final authClass = authClassOf(primary);
  final isOpen = primary == SecurityKind.open;
  final isSecure = authClass == SecurityAuthClass.personal ||
      authClass == SecurityAuthClass.enterprise ||
      authClass == SecurityAuthClass.enhancedOpen;
  return SecurityView(
    flags: unique,
    primary: primary,
    authClass: authClass,
    isOpen: isOpen,
    isSecure: isSecure,
    ieHint: RsnHint.none,
  );
}

PhyView computePhyView(List<PhyLetter> supportedRaw) {
  final supported = _phyDisplayOrder
      .where(supportedRaw.contains)
      .toList(growable: false);
  final highest = supported.isEmpty ? null : supported.last;
  final display = supported.map((l) => l.name).join('/');
  return PhyView(
    supported: supported,
    highest: highest,
    display: display,
  );
}

VendorView resolveVendorView(LocationGated<Bssid> bssid) {
  if (bssid is LocationRedacted<Bssid>) {
    return const VendorView(
      oui: null,
      locallyAdministered: false,
      multicast: false,
      organization: null,
      match: 'bssid-redacted',
    );
  }
  final value = (bssid as LocationAvailable<Bssid>).value;
  final oui = value.length >= 8 ? value.substring(0, 8) : null;
  final first = int.tryParse(value.substring(0, 2), radix: 16) ?? 0;
  final locallyAdministered = (first & 0x02) != 0;
  final multicast = (first & 0x01) != 0;
  if (locallyAdministered) {
    return VendorView(
      oui: oui,
      locallyAdministered: true,
      multicast: multicast,
      organization: null,
      match: 'randomized',
    );
  }
  return VendorView(
    oui: oui,
    locallyAdministered: false,
    multicast: multicast,
    organization: null,
    match: 'oui-unresolved',
  );
}

PresenceView presenceOnSeen(ObservedBss? prev, IsoTime capturedAt) {
  return PresenceView(
    firstSeenAt: prev?.presence.firstSeenAt ?? capturedAt,
    lastSeenAt: capturedAt,
    lastMissingAt: prev?.presence.lastMissingAt,
    consecutiveMisses: 0,
    presence: Presence.current,
  );
}

ObservedBss mapCoreWlanRecordToObservedBss(
  CoreWlanNetworkRecord raw,
  ObservedBss? prev,
  IsoTime capturedAt, {
  MapObservedBssOptions options = const MapObservedBssOptions(),
}) {
  final at = asIsoTime(capturedAt);
  final locOk = locationFieldsAvailable(raw, options.location);
  final bssidNorm = normalizeBssid(raw.bssid);
  final ssidIdentity = buildSsidIdentity(raw);
  final ie = parseShallowIe(raw.informationElementData);
  final signal = computeSignalView(raw.rssiDbm, raw.noiseDbm);
  final channel = computeChannelView(
    raw.channelNumber,
    raw.channelBand,
    raw.channelWidth,
    htSecondaryOffset: ie.htSecondaryOffset,
    ccfs0: ie.ccfs0,
  );
  final phy = computePhyView(raw.supportedPhyModes);
  final security = computeSecurityView(raw.supportedSecurity);
  final identity = BssIdentity(
    bssid: locOk && bssidNorm != null
        ? LocationAvailable(asBssid(bssidNorm))
        : const LocationRedacted<Bssid>(),
    ssid: gateValue(locOk, ssidIdentity),
  );

  final point = RssiHistoryPoint(
    at: at,
    rssiDbm: signal.rssiDbm,
    noiseDbm: signal.noiseDbm,
    snrDb: signal.snrDb,
    channelNumber: raw.channelNumber,
  );
  final rssiHistory = stitchRssiHistory(
    prev?.rssiHistory ?? const [],
    [point],
    at,
  );

  return ObservedBss(
    identity: identity,
    ibss: raw.ibss,
    countryCode: gateValue(locOk, raw.countryCode),
    beaconIntervalMs: raw.beaconIntervalMs,
    signal: signal,
    channel: channel,
    security: security,
    phy: phy,
    maxRate: null,
    vendor: resolveVendorView(identity.bssid),
    ie: ie,
    presence: presenceOnSeen(prev, at),
    rssiHistory: rssiHistory,
    lastRaw: raw,
  );
}

List<ObservedBss> mapCoreWlanRecordsToObservedBss(
  List<CoreWlanNetworkRecord> records,
  List<ObservedBss>? prevRows,
  IsoTime capturedAt, {
  MapObservedBssOptions options = const MapObservedBssOptions(),
}) {
  final prevMap = <String, ObservedBss>{};
  if (prevRows != null) {
    for (final row in prevRows) {
      prevMap[bssMatchKey(row)] = row;
    }
  }
  return records
      .map(
        (raw) => mapCoreWlanRecordToObservedBss(
          raw,
          prevMap[matchKeyFromRaw(raw)],
          capturedAt,
          options: options,
        ),
      )
      .toList(growable: false);
}
