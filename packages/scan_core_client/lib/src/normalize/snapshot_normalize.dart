import 'package:scan_domain/scan_domain.dart';

String mapBandWire(Object? value) {
  if (value == '2.4GHz' || value == '2ghz') return '2ghz';
  if (value == '5GHz' || value == '5ghz') return '5ghz';
  if (value == '6GHz' || value == '6ghz') return '6ghz';
  return 'unknown';
}

CoreWlanChannelBand mapBandWireToEnum(Object? value) {
  return switch (mapBandWire(value)) {
    '2ghz' => CoreWlanChannelBand.ghz2,
    '5ghz' => CoreWlanChannelBand.ghz5,
    '6ghz' => CoreWlanChannelBand.ghz6,
    _ => CoreWlanChannelBand.unknown,
  };
}

String mapWidthWire(Object? value) {
  switch (value) {
    case '20MHz':
    case '20mhz':
      return '20mhz';
    case '40MHz':
    case '40mhz':
      return '40mhz';
    case '80MHz':
    case '80+80MHz':
    case '80mhz':
      return '80mhz';
    case '160MHz':
    case '160mhz':
      return '160mhz';
    default:
      return 'unknown';
  }
}

CoreWlanChannelWidth mapWidthWireToEnum(Object? value) {
  return switch (mapWidthWire(value)) {
    '20mhz' => CoreWlanChannelWidth.mhz20,
    '40mhz' => CoreWlanChannelWidth.mhz40,
    '80mhz' => CoreWlanChannelWidth.mhz80,
    '160mhz' => CoreWlanChannelWidth.mhz160,
    _ => CoreWlanChannelWidth.unknown,
  };
}

const _phyLetters = {'a', 'b', 'g', 'n', 'ac', 'ax', 'be'};

List<String> mapPhyModesWire(Object? value) {
  if (value is! List) return const [];
  final out = <String>[];
  for (final item in value) {
    if (item is! String) continue;
    final lower = item.toLowerCase();
    if (_phyLetters.contains(lower)) {
      out.add(lower);
    } else if (lower == '802.11n') {
      out.add('n');
    } else if (lower == '802.11ac') {
      out.add('ac');
    } else if (lower == '802.11ax') {
      out.add('ax');
    }
  }
  return out;
}

List<PhyLetter> mapPhyLettersWire(Object? value) {
  return mapPhyModesWire(value)
      .map(phyLetterFromString)
      .whereType<PhyLetter>()
      .toList(growable: false);
}

String? mapSecurityNameWire(String name) {
  switch (name.toLowerCase()) {
    case 'none':
    case 'open':
      return 'open';
    case 'wep':
      return 'wep';
    case 'wpapersonal':
    case 'wpa-personal':
      return 'wpa-personal';
    case 'wpapersonalmixed':
    case 'wpa-personal-mixed':
      return 'wpa-personal-mixed';
    case 'wpa2personal':
    case 'wpa2-personal':
      return 'wpa2-personal';
    case 'wpa3personal':
    case 'wpa3-personal':
      return 'wpa3-personal';
    case 'wpa3transition':
    case 'wpa3-transition':
      return 'wpa3-transition';
    case 'wpaenterprise':
    case 'wpa-enterprise':
      return 'wpa-enterprise';
    case 'wpaenterprisemixed':
    case 'wpa-enterprise-mixed':
      return 'wpa-enterprise-mixed';
    case 'wpa2enterprise':
    case 'wpa2-enterprise':
      return 'wpa2-enterprise';
    case 'wpa3enterprise':
    case 'wpa3-enterprise':
      return 'wpa3-enterprise';
    case 'owe':
      return 'owe';
    case 'owetransition':
    case 'owe-transition':
      return 'owe-transition';
    default:
      return null;
  }
}

String? mapSecurityLabelWire(String label) {
  switch (label) {
    case 'Open':
    case 'open':
      return 'open';
    case 'WEP':
    case 'wep':
      return 'wep';
    case 'WPA Personal':
    case 'wpa-personal':
      return 'wpa-personal';
    case 'WPA2 Personal':
    case 'wpa2-personal':
      return 'wpa2-personal';
    case 'WPA3 Personal':
    case 'wpa3-personal':
      return 'wpa3-personal';
    case 'Mixed/Unknown':
      return 'open';
    default:
      return mapSecurityNameWire(label);
  }
}

List<String> mapSecurityKindsWire(Object? securityRaw, Object? label) {
  final fromRaw = <String>[];
  if (securityRaw is List) {
    for (final name in securityRaw) {
      if (name is! String) continue;
      final mapped = mapSecurityNameWire(name);
      if (mapped != null) fromRaw.add(mapped);
    }
  }
  if (fromRaw.isNotEmpty) return fromRaw;
  if (label is String) {
    final mapped = mapSecurityLabelWire(label);
    if (mapped != null) return [mapped];
  }
  return const ['open'];
}

List<SecurityKind> mapSecurityKindsToDomain(
  Object? securityRaw,
  Object? label,
) {
  return mapSecurityKindsWire(securityRaw, label)
      .map(securityKindFromString)
      .toList(growable: false);
}

CoreWlanNetworkRecord resultRowToCoreRecord(Map<String, dynamic> row) {
  final ssid = row['ssid'];
  final rssi = row['rssiDbm'];
  final noise = row['noiseDbm'];
  return CoreWlanNetworkRecord(
    ssid: ssid is String ? ssid : null,
    ssidData: ssid is String ? ssid.codeUnits : null,
    bssid: row['bssid'] is String ? row['bssid'] as String : null,
    rssiDbm: rssi is num ? rssi.toDouble() : 0,
    noiseDbm: noise is num ? noise.toDouble() : 0,
    channelNumber: row['channel'] is int ? row['channel'] as int : null,
    channelBand: mapBandWireToEnum(row['band']),
    channelWidth: mapWidthWireToEnum(row['channelWidth']),
    countryCode: null,
    beaconIntervalMs: 100,
    ibss: false,
    informationElementData: null,
    supportedSecurity: mapSecurityKindsToDomain(
      row['securityRaw'],
      row['security'],
    ),
    supportedPhyModes: mapPhyLettersWire(row['phyModesSupported']),
  );
}

bool isCoreLikeNetworkRow(Object? value) {
  if (value is! Map<String, dynamic>) return false;
  return value['rssiDbm'] is num &&
      value['channelBand'] is String &&
      value['supportedSecurity'] is List;
}

List<SecurityKind> _securityListFromWire(List<Object?>? raw) {
  if (raw == null) return const [SecurityKind.open];
  final out = <SecurityKind>[];
  for (final item in raw) {
    if (item is! String) continue;
    final mapped = mapSecurityNameWire(item);
    out.add(securityKindFromString(mapped ?? item));
  }
  return out.isEmpty ? const [SecurityKind.open] : out;
}

CoreWlanNetworkRecord parseFlatNetworkRow(Map<String, dynamic> row) {
  return CoreWlanNetworkRecord(
    ssid: row['ssid'] as String?,
    ssidData: (row['ssidData'] as List?)
        ?.whereType<num>()
        .map((n) => n.toInt())
        .toList(growable: false),
    bssid: row['bssid'] as String?,
    rssiDbm: (row['rssiDbm'] as num?)?.toDouble() ?? 0,
    noiseDbm: (row['noiseDbm'] as num?)?.toDouble() ?? 0,
    channelNumber: row['channelNumber'] as int?,
    channelBand: mapBandWireToEnum(row['channelBand']),
    channelWidth: mapWidthWireToEnum(row['channelWidth']),
    countryCode: row['countryCode'] as String?,
    beaconIntervalMs: row['beaconIntervalMs'] as int? ?? 100,
    ibss: row['ibss'] as bool? ?? false,
    informationElementData: (row['informationElementData'] as List?)
        ?.whereType<num>()
        .map((n) => n.toInt())
        .toList(growable: false),
    supportedSecurity: _securityListFromWire(row['supportedSecurity'] as List?),
    supportedPhyModes: mapPhyLettersWire(row['supportedPhyModes']),
  );
}

String? readGatedString(Object? gated) {
  if (gated is! Map<String, dynamic>) return null;
  if (gated['status'] != 'available') return null;
  final value = gated['value'];
  return value is String ? value : null;
}

CoreWlanNetworkRecord parseRichNetworkRow(Map<String, dynamic> row) {
  final identity = row['identity'] as Map<String, dynamic>?;
  final ssidBlock = identity?['ssid'] as Map<String, dynamic>?;
  final ssidValue = ssidBlock?['value'] as Map<String, dynamic>?;
  final ssidUtf8 = ssidValue?['utf8'] as String?;
  final octets = (ssidValue?['octets'] as List?)
      ?.whereType<num>()
      .map((n) => n.toInt())
      .toList(growable: false);
  final bssid = readGatedString(identity?['bssid']);
  final signal = row['signal'] as Map<String, dynamic>?;
  final channel = row['channel'] as Map<String, dynamic>?;
  final security = row['security'] as Map<String, dynamic>?;
  final phy = row['phy'] as Map<String, dynamic>?;
  final country = row['countryCode'];

  final bandWire = channel?['band'] as num? ?? 0;
  CoreWlanChannelBand channelBand = CoreWlanChannelBand.unknown;
  if (bandWire == 2.4) channelBand = CoreWlanChannelBand.ghz2;
  if (bandWire == 5) channelBand = CoreWlanChannelBand.ghz5;
  if (bandWire == 6) channelBand = CoreWlanChannelBand.ghz6;

  final width = channel?['widthMhz'];
  CoreWlanChannelWidth channelWidth = CoreWlanChannelWidth.unknown;
  if (width == 20) channelWidth = CoreWlanChannelWidth.mhz20;
  if (width == 40) channelWidth = CoreWlanChannelWidth.mhz40;
  if (width == 80) channelWidth = CoreWlanChannelWidth.mhz80;
  if (width == 160) channelWidth = CoreWlanChannelWidth.mhz160;

  final flags = (security?['flags'] as List?)?.whereType<String>().toList();
  final supportedSecurity = _securityListFromWire(flags);
  final supportedPhy = mapPhyLettersWire(phy?['supported']);

  return CoreWlanNetworkRecord(
    ssid: ssidUtf8,
    ssidData: octets,
    bssid: bssid,
    rssiDbm: (signal?['rssiDbm'] as num?)?.toDouble() ?? 0,
    noiseDbm: (signal?['noiseDbm'] as num?)?.toDouble() ?? 0,
    channelNumber: channel?['number'] as int?,
    channelBand: channelBand,
    channelWidth: channelWidth,
    countryCode: readGatedString(country),
    beaconIntervalMs: row['beaconIntervalMs'] as int? ?? 100,
    ibss: row['ibss'] as bool? ?? false,
    informationElementData: null,
    supportedSecurity: supportedSecurity,
    supportedPhyModes: supportedPhy,
  );
}

List<CoreWlanNetworkRecord> ensureSnapshotNetworks(
  Map<String, dynamic> payload,
) {
  final networks = payload['networks'];
  if (networks is List && networks.isNotEmpty) {
    final first = networks.first;
    if (first is Map<String, dynamic>) {
      if (first.containsKey('identity')) {
        return networks
            .whereType<Map<String, dynamic>>()
            .map(parseRichNetworkRow)
            .toList(growable: false);
      }
      if (isCoreLikeNetworkRow(first)) {
        return networks
            .whereType<Map<String, dynamic>>()
            .map(parseFlatNetworkRow)
            .toList(growable: false);
      }
    }
  }

  final results = payload['results'];
  if (results is List && results.isNotEmpty) {
    return results
        .whereType<Map<String, dynamic>>()
        .map(resultRowToCoreRecord)
        .toList(growable: false);
  }

  if (networks is List) {
    return networks
        .whereType<Map<String, dynamic>>()
        .map(parseFlatNetworkRow)
        .toList(growable: false);
  }

  return const [];
}
