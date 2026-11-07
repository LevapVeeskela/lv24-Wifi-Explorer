import 'package:scan_domain/scan_domain.dart';

class MakeBssInput {
  const MakeBssInput({
    this.bssid,
    this.ssid,
    this.hidden,
    this.ibss,
    this.rssiDbm,
    this.noiseDbm,
    this.band,
    this.channel,
    this.widthMhz,
    this.security,
    this.presence,
    this.firstSeenAt,
    this.lastSeenAt,
    this.consecutiveMisses,
    this.capturedAt,
  });

  final String? bssid;
  final String? ssid;
  final bool? hidden;
  final bool? ibss;
  final double? rssiDbm;
  final double? noiseDbm;
  final WifiBand? band;
  final int? channel;
  final Object? widthMhz;
  final Object? security;
  final Presence? presence;
  final String? firstSeenAt;
  final String? lastSeenAt;
  final int? consecutiveMisses;
  final String? capturedAt;
}

({List<SecurityKind> flags, SecurityKind primary, bool isOpen, bool isSecure})
    _securityOf(Object? kind) {
  if (kind == null || kind == 'open') {
    return (
      flags: [SecurityKind.open],
      primary: SecurityKind.open,
      isOpen: true,
      isSecure: false,
    );
  }
  if (kind == 'secure') {
    return (
      flags: [SecurityKind.wpa2Personal],
      primary: SecurityKind.wpa2Personal,
      isOpen: false,
      isSecure: true,
    );
  }
  if (kind is SecurityKind) {
    return (
      flags: [kind],
      primary: kind,
      isOpen: false,
      isSecure: true,
    );
  }
  if (kind is String) {
    final parsed = securityKindFromString(kind);
    return (
      flags: [parsed],
      primary: parsed,
      isOpen: parsed == SecurityKind.open,
      isSecure: parsed != SecurityKind.open,
    );
  }
  return (
    flags: [SecurityKind.wpa2Personal],
    primary: SecurityKind.wpa2Personal,
    isOpen: false,
    isSecure: true,
  );
}

ObservedBss makeObservedBss([MakeBssInput input = const MakeBssInput()]) {
  final capturedAt = asIsoTime(
    input.capturedAt ?? input.lastSeenAt ?? '2026-09-17T19:00:00.000Z',
  );
  final firstSeenAt = asIsoTime(input.firstSeenAt ?? capturedAt);
  final lastSeenAt = asIsoTime(input.lastSeenAt ?? capturedAt);
  final bssidRaw = input.bssid ?? '00:11:22:33:44:55';
  final hidden = input.hidden == true || input.ssid == '';
  final ssidText = hidden ? '' : (input.ssid ?? 'TestNet');
  final octets = hidden ? <int>[] : ssidText.codeUnits;
  final octetHex = octetHexOf(octets);
  final band = input.band ?? WifiBand.ghz24;
  final channelNumber = input.channel ?? 6;
  final widthMhz = input.widthMhz ?? ChannelWidthMhz.mhz20;
  final rssiDbm = input.rssiDbm ?? -50.0;
  final noiseDbm = input.noiseDbm ?? -90.0;
  final signal = computeSignalView(rssiDbm, noiseDbm);
  final channel = computeChannelView(
    channelNumber,
    bandToCore(band),
    widthToCore(widthMhz),
  );
  final sec = _securityOf(input.security);
  final bssidNorm = normalizeBssid(bssidRaw);

  final lastRaw = CoreWlanNetworkRecord(
    ssid: hidden ? null : ssidText,
    ssidData: octets,
    bssid: bssidRaw,
    rssiDbm: rssiDbm,
    noiseDbm: noiseDbm,
    channelNumber: channelNumber,
    channelBand: bandToCore(band),
    channelWidth: widthToCore(widthMhz),
    countryCode: 'RU',
    beaconIntervalMs: 100,
    ibss: input.ibss == true,
    informationElementData: null,
    supportedSecurity: sec.flags,
    supportedPhyModes: const [PhyLetter.n],
  );

  return ObservedBss(
    identity: BssIdentity(
      bssid: bssidNorm != null
          ? LocationAvailable(asBssid(bssidNorm))
          : const LocationRedacted<Bssid>(),
      ssid: LocationAvailable(
        SsidIdentity(
          utf8: hidden ? '' : ssidText,
          octets: octets,
          octetHex: octetHex,
          hidden: hidden,
          displayName: hidden ? '<hidden>' : ssidText,
        ),
      ),
    ),
    ibss: input.ibss == true,
    countryCode: const LocationAvailable('RU'),
    beaconIntervalMs: 100,
    signal: signal,
    channel: channel,
    security: SecurityView(
      flags: sec.flags,
      primary: sec.primary,
      authClass: sec.isOpen ? SecurityAuthClass.open : SecurityAuthClass.personal,
      isOpen: sec.isOpen,
      isSecure: sec.isSecure,
      ieHint: RsnHint.none,
    ),
    phy: const PhyView(
      supported: [PhyLetter.n],
      highest: PhyLetter.n,
      display: 'n',
    ),
    maxRate: null,
    vendor: const VendorView(
      oui: null,
      locallyAdministered: false,
      multicast: false,
      organization: null,
      match: 'bssid-redacted',
    ),
    ie: const ShallowIeView(),
    presence: PresenceView(
      firstSeenAt: firstSeenAt,
      lastSeenAt: lastSeenAt,
      lastMissingAt: null,
      consecutiveMisses: input.consecutiveMisses ?? 0,
      presence: input.presence ?? Presence.current,
    ),
    rssiHistory: [
      RssiHistoryPoint(
        at: capturedAt,
        rssiDbm: signal.rssiDbm,
        noiseDbm: signal.noiseDbm,
        snrDb: signal.snrDb,
        channelNumber: channelNumber,
      ),
    ],
    lastRaw: lastRaw,
  );
}

IsoTime iso(String value) => asIsoTime(value);

String atOffset(String t0, int seconds) {
  return DateTime.fromMillisecondsSinceEpoch(
    DateTime.parse(t0).millisecondsSinceEpoch + seconds * 1000,
    isUtc: true,
  ).toIso8601String();
}

ScanIssueBss baseIssueBss([ScanIssueBss? overrides]) {
  const base = ScanIssueBss(
    channel: ScanIssueChannel(
      band: WifiBand.ghz24,
      number: 6,
      widthMhz: ChannelWidthMhz.mhz20,
    ),
    signal: ScanIssueSignal(rssiDbm: -55, snrDb: 40),
    security: ScanIssueSecurity(
      primary: SecurityKind.wpa2Personal,
      isOpen: false,
    ),
    hiddenSsid: false,
    phy: ScanIssuePhy(highest: PhyLetter.ac, supported: [PhyLetter.n, PhyLetter.ac]),
  );
  return overrides ?? base;
}

ScanIssueBss issueBssWith({
  ScanIssueChannel? channel,
  ScanIssueSignal? signal,
  ScanIssueSecurity? security,
  bool? hiddenSsid,
  ScanIssuePhy? phy,
  int? channelUtilPct,
  bool? isDfs,
  String? countryCode,
  bool? tkipOnly,
}) {
  final base = baseIssueBss();
  return ScanIssueBss(
    channel: channel ?? base.channel,
    signal: signal ?? base.signal,
    security: security ?? base.security,
    hiddenSsid: hiddenSsid ?? base.hiddenSsid,
    phy: phy ?? base.phy,
    channelUtilPct: channelUtilPct ?? base.channelUtilPct,
    isDfs: isDfs ?? base.isDfs,
    countryCode: countryCode ?? base.countryCode,
    tkipOnly: tkipOnly ?? base.tkipOnly,
  );
}

List<ScanIssueId> issueIds(ScanIssueBss bss, [List<ScanIssueBss> neighbors = const []]) {
  return evaluateIssues(bss, neighbors).map((f) => f.id).toList();
}
