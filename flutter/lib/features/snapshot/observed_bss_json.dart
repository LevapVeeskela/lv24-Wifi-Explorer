import 'package:scan_domain/scan_domain.dart';

String? bssidOfNetwork(ObservedBss bss) {
  final gated = bss.identity.bssid;
  if (gated is! LocationAvailable<Bssid>) return null;
  final value = gated.value.trim();
  return value.isEmpty ? null : value;
}

Map<String, dynamic> locationGatedToJson<T>(LocationGated<T> gated, Object? Function(T) encode) {
  if (gated is LocationRedacted<T>) {
    return {'status': 'redacted', 'reason': gated.reason};
  }
  if (gated is LocationAvailable<T>) {
    return {'status': 'available', 'value': encode(gated.value)};
  }
  return const {'status': 'redacted', 'reason': 'location-required'};
}

LocationGated<T> locationGatedFromJson<T>(
  Object? raw,
  T Function(Object?) decode,
) {
  if (raw is! Map) return LocationRedacted<T>();
  final status = raw['status'];
  if (status == 'available') {
    return LocationAvailable(decode(raw['value']));
  }
  return LocationRedacted<T>(
    reason: raw['reason'] is String ? raw['reason'] as String : 'location-required',
  );
}

String securityKindToWire(SecurityKind kind) {
  return switch (kind) {
    SecurityKind.open => 'open',
    SecurityKind.wep => 'wep',
    SecurityKind.wpaPersonal => 'wpa-personal',
    SecurityKind.wpaPersonalMixed => 'wpa-personal-mixed',
    SecurityKind.wpa2Personal => 'wpa2-personal',
    SecurityKind.wpa3Personal => 'wpa3-personal',
    SecurityKind.wpa3Transition => 'wpa3-transition',
    SecurityKind.personalGeneric => 'personal-generic',
    SecurityKind.dynamicWep => 'dynamic-wep',
    SecurityKind.wpaEnterprise => 'wpa-enterprise',
    SecurityKind.wpaEnterpriseMixed => 'wpa-enterprise-mixed',
    SecurityKind.wpa2Enterprise => 'wpa2-enterprise',
    SecurityKind.wpa3Enterprise => 'wpa3-enterprise',
    SecurityKind.enterpriseGeneric => 'enterprise-generic',
    SecurityKind.owe => 'owe',
    SecurityKind.oweTransition => 'owe-transition',
    SecurityKind.unknown => 'unknown',
  };
}

String authClassToWire(SecurityAuthClass value) {
  return switch (value) {
    SecurityAuthClass.open => 'open',
    SecurityAuthClass.enhancedOpen => 'enhanced-open',
    SecurityAuthClass.personal => 'personal',
    SecurityAuthClass.enterprise => 'enterprise',
    SecurityAuthClass.unknown => 'unknown',
  };
}

SecurityAuthClass authClassFromWire(String? value) {
  return switch (value) {
    'open' => SecurityAuthClass.open,
    'enhanced-open' => SecurityAuthClass.enhancedOpen,
    'personal' => SecurityAuthClass.personal,
    'enterprise' => SecurityAuthClass.enterprise,
    _ => SecurityAuthClass.unknown,
  };
}

String rsnHintToWire(RsnHint value) {
  return switch (value) {
    RsnHint.none => 'none',
    RsnHint.wpaIe => 'wpa-ie',
    RsnHint.rsnIe => 'rsn-ie',
    RsnHint.both => 'both',
    RsnHint.unparsed => 'unparsed',
  };
}

RsnHint rsnHintFromWire(String? value) {
  return switch (value) {
    'wpa-ie' => RsnHint.wpaIe,
    'rsn-ie' => RsnHint.rsnIe,
    'both' => RsnHint.both,
    'unparsed' => RsnHint.unparsed,
    _ => RsnHint.none,
  };
}

String signalQualityToWire(SignalQuality q) => q.name;

SignalQuality signalQualityFromWire(String? value) {
  return SignalQuality.values.firstWhere(
    (e) => e.name == value,
    orElse: () => SignalQuality.unusable,
  );
}

String qualityBasisToWire(QualityBasis basis) {
  return switch (basis) {
    QualityBasis.snr => 'snr',
    QualityBasis.rssiFallback => 'rssi-fallback',
  };
}

QualityBasis qualityBasisFromWire(String? value) {
  return value == 'rssi-fallback' ? QualityBasis.rssiFallback : QualityBasis.snr;
}

String centerConfidenceToWire(ChannelCenterConfidence c) {
  return switch (c) {
    ChannelCenterConfidence.ieeePrimary20 => 'ieee-primary-20',
    ChannelCenterConfidence.ieOperation => 'ie-operation',
    ChannelCenterConfidence.standardLayoutGuess => 'standard-layout-guess',
  };
}

ChannelCenterConfidence centerConfidenceFromWire(String? value) {
  return switch (value) {
    'ie-operation' => ChannelCenterConfidence.ieOperation,
    'standard-layout-guess' => ChannelCenterConfidence.standardLayoutGuess,
    _ => ChannelCenterConfidence.ieeePrimary20,
  };
}

Object? channelWidthToJson(Object widthMhz) {
  if (widthMhz == unknownWidth) return unknownWidth;
  if (widthMhz is ChannelWidthMhz) return widthMhz.asInt;
  return unknownWidth;
}

Object? channelWidthFromJson(Object? raw) {
  if (raw == unknownWidth) return unknownWidth;
  if (raw is num) {
    return switch (raw.toInt()) {
      20 => ChannelWidthMhz.mhz20,
      40 => ChannelWidthMhz.mhz40,
      80 => ChannelWidthMhz.mhz80,
      160 => ChannelWidthMhz.mhz160,
      _ => unknownWidth,
    };
  }
  return unknownWidth;
}

Map<String, dynamic> rssiHistoryPointToJson(RssiHistoryPoint point) {
  return {
    'at': point.at,
    'rssiDbm': point.rssiDbm,
    if (point.noiseDbm != null) 'noiseDbm': point.noiseDbm,
    if (point.snrDb != null) 'snrDb': point.snrDb,
    if (point.channelNumber != null) 'channelNumber': point.channelNumber,
  };
}

RssiHistoryPoint? rssiHistoryPointFromJson(Object? raw) {
  if (raw is! Map) return null;
  if (raw['at'] is! String || raw['rssiDbm'] is! num) return null;
  return RssiHistoryPoint(
    at: raw['at'] as String,
    rssiDbm: (raw['rssiDbm'] as num).toDouble(),
    noiseDbm: raw['noiseDbm'] is num ? (raw['noiseDbm'] as num).toDouble() : null,
    snrDb: raw['snrDb'] is num ? (raw['snrDb'] as num).toDouble() : null,
    channelNumber: raw['channelNumber'] is num ? (raw['channelNumber'] as num).toInt() : null,
  );
}

Map<String, dynamic> coreWlanRecordToJson(CoreWlanNetworkRecord raw) {
  return {
    'ssid': raw.ssid,
    'ssidData': raw.ssidData,
    'bssid': raw.bssid,
    'rssiDbm': raw.rssiDbm,
    'noiseDbm': raw.noiseDbm,
    'channelNumber': raw.channelNumber,
    'channelBand': coreWlanChannelBandKey(raw.channelBand),
    'channelWidth': switch (raw.channelWidth) {
      CoreWlanChannelWidth.mhz20 => '20mhz',
      CoreWlanChannelWidth.mhz40 => '40mhz',
      CoreWlanChannelWidth.mhz80 => '80mhz',
      CoreWlanChannelWidth.mhz160 => '160mhz',
      CoreWlanChannelWidth.unknown => 'unknown',
    },
    'countryCode': raw.countryCode,
    'beaconIntervalMs': raw.beaconIntervalMs,
    'ibss': raw.ibss,
    'informationElementData': raw.informationElementData,
    'supportedSecurity': raw.supportedSecurity.map(securityKindToWire).toList(),
    'supportedPhyModes': raw.supportedPhyModes.map((p) => p.name).toList(),
  };
}

CoreWlanNetworkRecord coreWlanRecordFromJson(Map<String, dynamic> raw) {
  final securityRaw = raw['supportedSecurity'];
  final phyRaw = raw['supportedPhyModes'];
  return CoreWlanNetworkRecord(
    ssid: raw['ssid'] as String?,
    ssidData: (raw['ssidData'] as List?)?.map((e) => (e as num).toInt()).toList(),
    bssid: raw['bssid'] as String?,
    rssiDbm: (raw['rssiDbm'] as num?)?.toDouble() ?? 0,
    noiseDbm: (raw['noiseDbm'] as num?)?.toDouble() ?? 0,
    channelNumber: (raw['channelNumber'] as num?)?.toInt(),
    channelBand: mapBandWireToEnum(raw['channelBand']),
    channelWidth: mapWidthWireToEnum(raw['channelWidth']),
    countryCode: raw['countryCode'] as String?,
    beaconIntervalMs: (raw['beaconIntervalMs'] as num?)?.toInt() ?? 100,
    ibss: raw['ibss'] == true,
    informationElementData:
        (raw['informationElementData'] as List?)?.map((e) => (e as num).toInt()).toList(),
    supportedSecurity: securityRaw is List
        ? securityRaw
            .whereType<String>()
            .map(securityKindFromString)
            .toList(growable: false)
        : const [SecurityKind.unknown],
    supportedPhyModes: phyRaw is List
        ? phyRaw
            .whereType<String>()
            .map(phyLetterFromString)
            .whereType<PhyLetter>()
            .toList(growable: false)
        : const [],
  );
}

Map<String, dynamic> observedBssToJson(ObservedBss bss) {
  final span = bss.channel.occupyingSpanMhz;
  return {
    'identity': {
      'bssid': locationGatedToJson(bss.identity.bssid, (v) => v),
      'ssid': locationGatedToJson(bss.identity.ssid, (ssid) => {
            'utf8': ssid.utf8,
            'octets': ssid.octets,
            'octetHex': ssid.octetHex,
            'hidden': ssid.hidden,
            'displayName': ssid.displayName,
          }),
    },
    'ibss': bss.ibss,
    'countryCode': locationGatedToJson(bss.countryCode, (v) => v),
    'beaconIntervalMs': bss.beaconIntervalMs,
    'signal': {
      'rssiDbm': bss.signal.rssiDbm,
      'noiseDbm': bss.signal.noiseDbm,
      'snrDb': bss.signal.snrDb,
      'quality': signalQualityToWire(bss.signal.quality),
      'qualityBasis': qualityBasisToWire(bss.signal.qualityBasis),
    },
    'channel': {
      'number': bss.channel.number,
      'band': bss.channel.band?.asDouble,
      'widthMhz': channelWidthToJson(bss.channel.widthMhz),
      'primaryCenterMhz': bss.channel.primaryCenterMhz,
      'occupyingCenterMhz': bss.channel.occupyingCenterMhz,
      if (span != null)
        'occupyingSpanMhz': {'from': span.from, 'to': span.to},
      'centerConfidence': centerConfidenceToWire(bss.channel.centerConfidence),
    },
    'security': {
      'flags': bss.security.flags.map(securityKindToWire).toList(),
      'primary': securityKindToWire(bss.security.primary),
      'authClass': authClassToWire(bss.security.authClass),
      'isOpen': bss.security.isOpen,
      'isSecure': bss.security.isSecure,
      'ieHint': rsnHintToWire(bss.security.ieHint),
    },
    'phy': {
      'supported': bss.phy.supported.map((p) => p.name).toList(),
      'highest': bss.phy.highest?.name,
      'display': bss.phy.display,
      'source': bss.phy.source,
    },
    'maxRate': bss.maxRate,
    'vendor': {
      'oui': bss.vendor.oui,
      'locallyAdministered': bss.vendor.locallyAdministered,
      'multicast': bss.vendor.multicast,
      'organization': bss.vendor.organization,
      'match': bss.vendor.match,
      'registryFile': bss.vendor.registryFile,
    },
    'ie': shallowIeToJson(
      bss.ie,
      informationElementData: bss.lastRaw.informationElementData,
    ),
    'presence': {
      'firstSeenAt': bss.presence.firstSeenAt,
      'lastSeenAt': bss.presence.lastSeenAt,
      'lastMissingAt': bss.presence.lastMissingAt,
      'consecutiveMisses': bss.presence.consecutiveMisses,
      'presence': bss.presence.presence.name,
    },
    'rssiHistory': bss.rssiHistory.map(rssiHistoryPointToJson).toList(),
    'lastRaw': coreWlanRecordToJson(bss.lastRaw),
  };
}

ObservedBss observedBssFromJson(Map<String, dynamic> raw) {
  final identityRaw = raw['identity'];
  final signalRaw = raw['signal'] as Map?;
  final channelRaw = raw['channel'] as Map?;
  final securityRaw = raw['security'] as Map?;
  final phyRaw = raw['phy'] as Map?;
  final vendorRaw = raw['vendor'] as Map?;
  final ieRaw = raw['ie'] as Map?;
  final presenceRaw = raw['presence'] as Map?;
  final historyRaw = raw['rssiHistory'];
  final lastRawMap = raw['lastRaw'];

  final identity = identityRaw is Map
      ? BssIdentity(
          bssid: locationGatedFromJson<Bssid>(
            identityRaw['bssid'],
            (v) => asBssid(v as String),
          ),
          ssid: locationGatedFromJson<SsidIdentity>(
            identityRaw['ssid'],
            (v) {
              final m = v as Map;
              return SsidIdentity(
                utf8: m['utf8'] as String?,
                octets: (m['octets'] as List?)?.map((e) => (e as num).toInt()).toList() ??
                    const [],
                octetHex: asSsidOctetHex(m['octetHex'] as String? ?? ''),
                hidden: m['hidden'] == true,
                displayName: m['displayName'] as String? ?? '<unknown>',
              );
            },
          ),
        )
      : BssIdentity(
          bssid: const LocationRedacted<Bssid>(),
          ssid: const LocationRedacted<SsidIdentity>(),
        );

  final width = channelWidthFromJson(channelRaw?['widthMhz']);
  final spanRaw = channelRaw?['occupyingSpanMhz'];
  FrequencySpanMhz? span;
  if (spanRaw is Map) {
    final from = spanRaw['from'];
    final to = spanRaw['to'];
    if (from is num && to is num) {
      span = FrequencySpanMhz(from: from.toDouble(), to: to.toDouble());
    }
  }

  final signal = signalRaw != null
      ? SignalView(
          rssiDbm: (signalRaw['rssiDbm'] as num?)?.toDouble() ?? 0,
          noiseDbm: signalRaw['noiseDbm'] is num
              ? (signalRaw['noiseDbm'] as num).toDouble()
              : null,
          snrDb: signalRaw['snrDb'] is num ? (signalRaw['snrDb'] as num).toDouble() : null,
          quality: signalQualityFromWire(signalRaw['quality'] as String?),
          qualityBasis: qualityBasisFromWire(signalRaw['qualityBasis'] as String?),
        )
      : computeSignalView(0, 0);

  final flags = securityRaw?['flags'] is List
      ? (securityRaw!['flags'] as List)
          .whereType<String>()
          .map(securityKindFromString)
          .toList(growable: false)
      : const <SecurityKind>[];

  final history = historyRaw is List
      ? historyRaw.map(rssiHistoryPointFromJson).whereType<RssiHistoryPoint>().toList()
      : <RssiHistoryPoint>[];

  var lastRaw = lastRawMap is Map<String, dynamic>
      ? coreWlanRecordFromJson(lastRawMap)
      : lastRawMap is Map
          ? coreWlanRecordFromJson(Map<String, dynamic>.from(lastRawMap))
          : const CoreWlanNetworkRecord(
              ssid: null,
              ssidData: null,
              bssid: null,
              rssiDbm: 0,
              noiseDbm: 0,
              channelNumber: null,
              channelBand: CoreWlanChannelBand.unknown,
              channelWidth: CoreWlanChannelWidth.unknown,
              countryCode: null,
              beaconIntervalMs: 100,
              ibss: false,
              informationElementData: null,
              supportedSecurity: [],
              supportedPhyModes: [],
            );

  final ieBytes = _intList(ieRaw?['informationElementData']) ??
      lastRaw.informationElementData;
  if (!_hasIeBytes(lastRaw.informationElementData) && _hasIeBytes(ieBytes)) {
    lastRaw = coreWlanRecordWithIeBytes(lastRaw, ieBytes);
  }

  return ObservedBss(
    identity: identity,
    ibss: raw['ibss'] == true,
    countryCode: locationGatedFromJson<String?>(
      raw['countryCode'],
      (v) => v as String?,
    ),
    beaconIntervalMs: (raw['beaconIntervalMs'] as num?)?.toInt() ?? 100,
    signal: signal,
    channel: ChannelView(
      number: (channelRaw?['number'] as num?)?.toInt() ?? 0,
      band: channelRaw?['band'] is num
          ? switch ((channelRaw!['band'] as num).toDouble()) {
              2.4 => WifiBand.ghz24,
              5.0 => WifiBand.ghz5,
              6.0 => WifiBand.ghz6,
              _ => null,
            }
          : null,
      widthMhz: width ?? unknownWidth,
      primaryCenterMhz: (channelRaw?['primaryCenterMhz'] as num?)?.toDouble(),
      occupyingCenterMhz: (channelRaw?['occupyingCenterMhz'] as num?)?.toDouble(),
      occupyingSpanMhz: span,
      centerConfidence: centerConfidenceFromWire(
        channelRaw?['centerConfidence'] as String?,
      ),
    ),
    security: SecurityView(
      flags: flags,
      primary: securityKindFromString(securityRaw?['primary'] as String? ?? 'unknown'),
      authClass: authClassFromWire(securityRaw?['authClass'] as String?),
      isOpen: securityRaw?['isOpen'] == true,
      isSecure: securityRaw?['isSecure'] != false,
      ieHint: rsnHintFromWire(securityRaw?['ieHint'] as String?),
    ),
    phy: PhyView(
      supported: phyRaw?['supported'] is List
          ? (phyRaw!['supported'] as List)
              .whereType<String>()
              .map(phyLetterFromString)
              .whereType<PhyLetter>()
              .toList(growable: false)
          : const [],
      highest: phyLetterFromString(phyRaw?['highest'] as String? ?? ''),
      display: phyRaw?['display'] as String? ?? '',
      source: phyRaw?['source'] as String? ?? 'api-supportsPHYMode',
    ),
    maxRate: raw['maxRate'],
    vendor: VendorView(
      oui: vendorRaw?['oui'] as String?,
      locallyAdministered: vendorRaw?['locallyAdministered'] == true,
      multicast: vendorRaw?['multicast'] == true,
      organization: vendorRaw?['organization'] as String?,
      match: vendorRaw?['match'] as String? ?? 'unknown',
      registryFile: vendorRaw?['registryFile'] as String?,
    ),
    ie: shallowIeFromJson(ieRaw, ieBytes),
    presence: PresenceView(
      firstSeenAt: presenceRaw?['firstSeenAt'] as String? ?? '1970-01-01T00:00:00.000Z',
      lastSeenAt: presenceRaw?['lastSeenAt'] as String? ?? '1970-01-01T00:00:00.000Z',
      lastMissingAt: presenceRaw?['lastMissingAt'] as String?,
      consecutiveMisses: (presenceRaw?['consecutiveMisses'] as num?)?.toInt() ?? 0,
      presence: Presence.values.firstWhere(
        (p) => p.name == presenceRaw?['presence'],
        orElse: () => Presence.current,
      ),
    ),
    rssiHistory: history,
    lastRaw: lastRaw,
  );
}

/// Electron `.lv24scan` `ObservedBss.ie` plus raw TLV bytes for IE-tree rebuild.
Map<String, dynamic> shallowIeToJson(
  ShallowIeView ie, {
  List<int>? informationElementData,
}) {
  return {
    'level': ie.level,
    'byteLength': ie.byteLength,
    'presentIds': ie.presentIds,
    'wpaVendorIe': ie.wpaVendorIe,
    'rsnIe': ie.rsnIe,
    'htCapabilities': ie.htCapabilities,
    'vhtCapabilities': ie.vhtCapabilities,
    'heCapabilities': ie.heCapabilities,
    'ehtCapabilities': ie.ehtCapabilities,
    'countryFromIe': ie.countryFromIe,
    'nssHint': ie.nssHint,
    'htPrimaryChannel': ie.htPrimaryChannel,
    'htSecondaryOffset': ie.htSecondaryOffset,
    'ccfs0': ie.ccfs0,
    if (_hasIeBytes(informationElementData))
      'informationElementData': informationElementData,
  };
}

ShallowIeView shallowIeFromJson(Map? ieRaw, List<int>? informationElementData) {
  final parsed = _hasIeBytes(informationElementData)
      ? parseShallowIe(informationElementData)
      : null;
  return ShallowIeView(
    level: ieRaw?['level'] as String? ?? parsed?.level ?? 'absent',
    byteLength: (ieRaw?['byteLength'] as num?)?.toInt() ?? parsed?.byteLength ?? 0,
    presentIds: _intList(ieRaw?['presentIds']) ?? parsed?.presentIds ?? const [],
    wpaVendorIe: _optionalBool(ieRaw, 'wpaVendorIe') ?? parsed?.wpaVendorIe,
    rsnIe: _optionalBool(ieRaw, 'rsnIe') ?? parsed?.rsnIe,
    htCapabilities: _optionalBool(ieRaw, 'htCapabilities') ?? parsed?.htCapabilities,
    vhtCapabilities: _optionalBool(ieRaw, 'vhtCapabilities') ?? parsed?.vhtCapabilities,
    heCapabilities: _optionalBool(ieRaw, 'heCapabilities') ?? parsed?.heCapabilities,
    ehtCapabilities: _optionalBool(ieRaw, 'ehtCapabilities') ?? parsed?.ehtCapabilities,
    countryFromIe: ieRaw?['countryFromIe'] as String? ?? parsed?.countryFromIe,
    nssHint: (ieRaw?['nssHint'] as num?)?.toInt() ?? parsed?.nssHint,
    htPrimaryChannel: (ieRaw?['htPrimaryChannel'] as num?)?.toInt() ??
        parsed?.htPrimaryChannel,
    htSecondaryOffset: (ieRaw?['htSecondaryOffset'] as num?)?.toInt() ??
        parsed?.htSecondaryOffset,
    ccfs0: (ieRaw?['ccfs0'] as num?)?.toInt() ?? parsed?.ccfs0,
  );
}

CoreWlanNetworkRecord coreWlanRecordWithIeBytes(
  CoreWlanNetworkRecord raw,
  List<int>? informationElementData,
) {
  return CoreWlanNetworkRecord(
    ssid: raw.ssid,
    ssidData: raw.ssidData,
    bssid: raw.bssid,
    rssiDbm: raw.rssiDbm,
    noiseDbm: raw.noiseDbm,
    channelNumber: raw.channelNumber,
    channelBand: raw.channelBand,
    channelWidth: raw.channelWidth,
    countryCode: raw.countryCode,
    beaconIntervalMs: raw.beaconIntervalMs,
    ibss: raw.ibss,
    informationElementData: informationElementData,
    supportedSecurity: raw.supportedSecurity,
    supportedPhyModes: raw.supportedPhyModes,
  );
}

bool _hasIeBytes(List<int>? data) => data != null && data.isNotEmpty;

List<int>? _intList(Object? raw) {
  if (raw is! List) return null;
  return raw.map((e) => (e as num).toInt()).toList(growable: false);
}

bool? _optionalBool(Map? raw, String key) {
  if (raw == null || !raw.containsKey(key)) return null;
  final value = raw[key];
  return value is bool ? value : null;
}

/// Wire helpers shared with [scan_core_client] normalize (duplicate import avoided).
CoreWlanChannelBand mapBandWireToEnum(Object? value) {
  final wire = _mapBandWire(value);
  return switch (wire) {
    '2ghz' => CoreWlanChannelBand.ghz2,
    '5ghz' => CoreWlanChannelBand.ghz5,
    '6ghz' => CoreWlanChannelBand.ghz6,
    _ => CoreWlanChannelBand.unknown,
  };
}

String _mapBandWire(Object? value) {
  if (value == '2.4GHz' || value == '2ghz') return '2ghz';
  if (value == '5GHz' || value == '5ghz') return '5ghz';
  if (value == '6GHz' || value == '6ghz') return '6ghz';
  return 'unknown';
}

CoreWlanChannelWidth mapWidthWireToEnum(Object? value) {
  return switch (_mapWidthWire(value)) {
    '20mhz' => CoreWlanChannelWidth.mhz20,
    '40mhz' => CoreWlanChannelWidth.mhz40,
    '80mhz' => CoreWlanChannelWidth.mhz80,
    '160mhz' => CoreWlanChannelWidth.mhz160,
    _ => CoreWlanChannelWidth.unknown,
  };
}

String _mapWidthWire(Object? value) {
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
