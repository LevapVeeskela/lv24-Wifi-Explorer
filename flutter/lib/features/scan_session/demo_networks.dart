import 'package:scan_domain/scan_domain.dart';

List<int> _tlv(int id, List<int> payload) => [id, payload.length, ...payload];

List<int> _ssidIe(String ssid) => _tlv(0, ssid.codeUnits);

List<int> _dsIe(int channel) => _tlv(3, [channel]);

List<int> _timIe() => _tlv(5, [0, 1, 0x00]);

List<int> _countryIe(String code) =>
    _tlv(7, [code.codeUnitAt(0), code.codeUnitAt(1), 0x20]);

List<int> _powerConstraintIe([int db = 3]) => _tlv(32, [db]);

List<int> _rsnWpa2Psk() => _tlv(48, const [
      0x01, 0x00, 0x00, 0x0f, 0xac, 0x04, 0x01, 0x00, 0x00, 0x0f, 0xac, 0x04,
      0x01, 0x00, 0x00, 0x0f, 0xac, 0x02, 0x80, 0x00,
    ]);

List<int> _htCapIe(int nss) {
  final mcs = List<int>.filled(16, 0);
  for (var i = 0; i < nss; i += 1) {
    mcs[i] = 0xff;
  }
  return _tlv(45, [0x12, 0x00, 0x00, ...mcs]);
}

List<int> _htOpIe(int primary, int secondary) {
  final offsetBits = secondary == 1
      ? 1
      : secondary == -1
          ? 3
          : 0;
  return _tlv(61, [primary, offsetBits]);
}

List<int> _vhtCapIe(int nss) {
  var rx = 0;
  for (var i = 0; i < 8; i += 1) {
    rx |= (i < nss ? 2 : 3) << (i * 2);
  }
  return _tlv(191, [0, 0, 0, 0, rx & 0xff, (rx >> 8) & 0xff, 0, 0, 0, 0, 0, 0]);
}

List<int> _vhtOpIe(int ccfs0) => _tlv(192, [1, ccfs0, 0]);

List<int> _extCapIe() {
  final payload = List<int>.filled(4, 0);
  payload[0] = 1 << 4;
  return _tlv(127, payload);
}

List<int> _heCapIe(int nss) {
  final afterExt = List<int>.filled(19, 0);
  var rx = 0;
  for (var i = 0; i < 8; i += 1) {
    rx |= (i < nss ? 2 : 3) << (i * 2);
  }
  afterExt[17] = rx & 0xff;
  afterExt[18] = (rx >> 8) & 0xff;
  return _tlv(255, [35, ...afterExt]);
}

/// Bundled demo BSS records used when `resources/fixtures` cannot be read
/// (widget tests, unusual cwd). Original LV24 names — not a commercial dump.
List<CoreWlanNetworkRecord> bundledDemoRecords() {
  return [
    CoreWlanNetworkRecord(
      ssid: 'LV24-Lab',
      ssidData: const [76, 86, 50, 52, 45, 76, 97, 98],
      bssid: '3c:5a:b4:10:01:01',
      rssiDbm: -48,
      noiseDbm: -92,
      channelNumber: 36,
      channelBand: CoreWlanChannelBand.ghz5,
      channelWidth: CoreWlanChannelWidth.mhz80,
      countryCode: 'RU',
      beaconIntervalMs: 100,
      ibss: false,
      informationElementData: [
        ..._ssidIe('LV24-Lab'),
        ..._countryIe('RU'),
        ..._timIe(),
        ..._powerConstraintIe(3),
        ..._htCapIe(2),
        ..._rsnWpa2Psk(),
        ..._htOpIe(36, 1),
        ..._vhtCapIe(2),
        ..._vhtOpIe(42),
        ..._extCapIe(),
      ],
      supportedSecurity: const [SecurityKind.wpa2Personal],
      supportedPhyModes: const [PhyLetter.a, PhyLetter.n, PhyLetter.ac],
    ),
    CoreWlanNetworkRecord(
      ssid: 'Sunset-Guest',
      ssidData: const [83, 117, 110, 115, 101, 116, 45, 71, 117, 101, 115, 116],
      bssid: 'aa:10:20:30:40:01',
      rssiDbm: -67,
      noiseDbm: -90,
      channelNumber: 6,
      channelBand: CoreWlanChannelBand.ghz2,
      channelWidth: CoreWlanChannelWidth.mhz20,
      countryCode: 'RU',
      beaconIntervalMs: 100,
      ibss: false,
      informationElementData: [
        ..._ssidIe('Sunset-Guest'),
        ..._dsIe(6),
        ..._timIe(),
        ..._countryIe('RU'),
      ],
      supportedSecurity: const [SecurityKind.open],
      supportedPhyModes: const [PhyLetter.b, PhyLetter.g, PhyLetter.n],
    ),
    CoreWlanNetworkRecord(
      ssid: 'Harbor-IoT',
      ssidData: const [72, 97, 114, 98, 111, 114, 45, 73, 111, 84],
      bssid: 'b4:2e:99:08:22:10',
      rssiDbm: -74,
      noiseDbm: -95,
      channelNumber: 11,
      channelBand: CoreWlanChannelBand.ghz2,
      channelWidth: CoreWlanChannelWidth.mhz20,
      countryCode: 'FI',
      beaconIntervalMs: 100,
      ibss: false,
      informationElementData: [
        ..._ssidIe('Harbor-IoT'),
        ..._dsIe(11),
        ..._timIe(),
        ..._countryIe('FI'),
        ..._rsnWpa2Psk(),
        ..._htCapIe(1),
      ],
      supportedSecurity: const [SecurityKind.wpa2Personal],
      supportedPhyModes: const [PhyLetter.g, PhyLetter.n],
    ),
    CoreWlanNetworkRecord(
      ssid: 'Studio-6',
      ssidData: const [83, 116, 117, 100, 105, 111, 45, 54],
      bssid: '70:3a:cb:55:01:8c',
      rssiDbm: -55,
      noiseDbm: -91,
      channelNumber: 37,
      channelBand: CoreWlanChannelBand.ghz6,
      channelWidth: CoreWlanChannelWidth.mhz160,
      countryCode: 'DE',
      beaconIntervalMs: 100,
      ibss: false,
      informationElementData: [
        ..._ssidIe('Studio-6'),
        ..._countryIe('DE'),
        ..._rsnWpa2Psk(),
        ..._heCapIe(2),
        ..._tlv(255, [36, 0, 0, 0, 12, 0, 0]),
      ],
      supportedSecurity: const [SecurityKind.wpa3Personal],
      supportedPhyModes: const [PhyLetter.ax],
    ),
    CoreWlanNetworkRecord(
      ssid: null,
      ssidData: const [],
      bssid: '00:11:22:33:44:55',
      rssiDbm: -82,
      noiseDbm: -96,
      channelNumber: 149,
      channelBand: CoreWlanChannelBand.ghz5,
      channelWidth: CoreWlanChannelWidth.mhz40,
      countryCode: null,
      beaconIntervalMs: 100,
      ibss: false,
      informationElementData: [
        ..._tlv(0, const []),
        ..._timIe(),
        ..._rsnWpa2Psk(),
        ..._htCapIe(2),
        ..._htOpIe(149, 1),
      ],
      supportedSecurity: const [SecurityKind.wpa2Personal],
      supportedPhyModes: const [PhyLetter.n, PhyLetter.ac],
    ),
  ];
}

List<ObservedBss> bundledDemoObservedBss({
  String capturedAt = '2026-09-17T20:00:00.000Z',
}) {
  return mapFallback(bundledDemoRecords(), capturedAt);
}

List<ObservedBss> mapFallback(
  List<CoreWlanNetworkRecord> records,
  String capturedAt,
) {
  return records
      .map(
        (raw) => _one(raw, capturedAt),
      )
      .toList(growable: false);
}

ObservedBss _one(CoreWlanNetworkRecord raw, String capturedAt) {
  final signal = computeSignalView(raw.rssiDbm, raw.noiseDbm);
  final ie = parseShallowIe(raw.informationElementData);
  final channel = computeChannelView(
    raw.channelNumber,
    raw.channelBand,
    raw.channelWidth,
    htSecondaryOffset: ie.htSecondaryOffset,
    ccfs0: ie.ccfs0,
  );
  final octets = octetsFromSsidFields(raw.ssidData, raw.ssid);
  final hidden = octets.isEmpty;
  final hex = octetHexOf(octets);
  final ssid = SsidIdentity(
    utf8: raw.ssid,
    octets: octets,
    octetHex: hex,
    hidden: hidden,
    displayName: hidden ? '<hidden>' : (raw.ssid ?? 'hex:$hex'),
  );
  final bssid = raw.bssid == null
      ? const LocationRedacted<Bssid>()
      : LocationAvailable<Bssid>(asBssid(raw.bssid!));
  final primary = raw.supportedSecurity.isEmpty
      ? SecurityKind.unknown
      : raw.supportedSecurity.first;
  final isOpen = primary == SecurityKind.open;
  return ObservedBss(
    identity: BssIdentity(
      bssid: bssid,
      ssid: LocationAvailable(ssid),
    ),
    ibss: raw.ibss,
    countryCode: LocationAvailable(raw.countryCode),
    beaconIntervalMs: raw.beaconIntervalMs,
    signal: signal,
    channel: channel,
    security: SecurityView(
      flags: raw.supportedSecurity,
      primary: primary,
      authClass: isOpen ? SecurityAuthClass.open : SecurityAuthClass.personal,
      isOpen: isOpen,
      isSecure: !isOpen,
      ieHint: RsnHint.none,
    ),
    phy: PhyView(
      supported: raw.supportedPhyModes,
      highest: raw.supportedPhyModes.isEmpty ? null : raw.supportedPhyModes.last,
      display: raw.supportedPhyModes.map((p) => p.name).join('/'),
    ),
    maxRate: null,
    vendor: const VendorView(
      oui: null,
      locallyAdministered: false,
      multicast: false,
      organization: null,
      match: 'demo',
    ),
    ie: ie,
    presence: PresenceView(
      firstSeenAt: capturedAt,
      lastSeenAt: capturedAt,
      lastMissingAt: null,
      consecutiveMisses: 0,
      presence: Presence.current,
    ),
    rssiHistory: [
      RssiHistoryPoint(
        at: capturedAt,
        rssiDbm: signal.rssiDbm,
        noiseDbm: signal.noiseDbm,
        snrDb: signal.snrDb,
        channelNumber: raw.channelNumber,
      ),
    ],
    lastRaw: raw,
  );
}
