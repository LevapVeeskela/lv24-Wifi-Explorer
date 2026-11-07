import 'package:scan_domain/scan_domain.dart';

import 'scan_error_dto.dart';

class ScanResultRowDto {
  const ScanResultRowDto({
    required this.id,
    required this.ssid,
    required this.bssid,
    required this.rssiDbm,
    required this.noiseDbm,
    required this.snrDb,
    required this.channel,
    required this.channelWidth,
    required this.band,
    required this.phyMode,
    required this.phyModesSupported,
    required this.security,
    required this.securityRaw,
    required this.oui,
    required this.hidden,
    required this.lastSeenAt,
    required this.scanGeneration,
  });

  final String id;
  final String? ssid;
  final String? bssid;
  final int? rssiDbm;
  final int? noiseDbm;
  final int? snrDb;
  final int? channel;
  final String channelWidth;
  final String band;
  final String phyMode;
  final List<String> phyModesSupported;
  final String security;
  final List<String> securityRaw;
  final String? oui;
  final bool hidden;
  final String lastSeenAt;
  final int scanGeneration;

  factory ScanResultRowDto.fromJson(Map<String, dynamic> json) {
    return ScanResultRowDto(
      id: json['id'] as String? ?? '',
      ssid: json['ssid'] as String?,
      bssid: json['bssid'] as String?,
      rssiDbm: json['rssiDbm'] as int?,
      noiseDbm: json['noiseDbm'] as int?,
      snrDb: json['snrDb'] as int?,
      channel: json['channel'] as int?,
      channelWidth: json['channelWidth'] as String? ?? 'unknown',
      band: json['band'] as String? ?? 'unknown',
      phyMode: json['phyMode'] as String? ?? 'unknown',
      phyModesSupported: _stringList(json['phyModesSupported']),
      security: json['security'] as String? ?? 'Mixed/Unknown',
      securityRaw: _stringList(json['securityRaw']),
      oui: json['oui'] as String?,
      hidden: json['hidden'] as bool? ?? false,
      lastSeenAt: json['lastSeenAt'] as String? ?? '',
      scanGeneration: json['scanGeneration'] as int? ?? 1,
    );
  }
}

List<String> _stringList(Object? value) {
  if (value is! List) return const [];
  return value.whereType<String>().toList(growable: false);
}

class AssociatedLinkDto {
  const AssociatedLinkDto({
    required this.ssid,
    required this.bssid,
    required this.rssiDbm,
    required this.channelNumber,
    required this.channelBand,
  });

  final String? ssid;
  final String? bssid;
  final double? rssiDbm;
  final int? channelNumber;
  final String? channelBand;
}

class ScanSnapshotDto {
  const ScanSnapshotDto({
    required this.capturedAt,
    required this.interfaceName,
    required this.location,
    required this.locationAuthorized,
    required this.networks,
    required this.includeHiddenRequested,
    this.snapshotId,
    this.countryCode,
    this.scanDurationMs,
    this.stale = false,
    this.source,
    this.results,
    this.associated,
    this.error,
    this.demo = false,
    this.transportSource,
  });

  final String? snapshotId;
  final String capturedAt;
  final String? interfaceName;
  final String? countryCode;
  final int? scanDurationMs;
  final bool stale;
  final bool locationAuthorized;
  final String location;
  final List<CoreWlanNetworkRecord> networks;
  final List<ScanResultRowDto>? results;
  final AssociatedLinkDto? associated;
  final bool includeHiddenRequested;
  final String? source;
  final ScanErrorDto? error;
  final bool demo;

  /// Electron-only enrichment (`scancore` | `fixtures`), not ScanCore `source`.
  final String? transportSource;

  ScanSnapshotDto copyWith({
    String? capturedAt,
    bool? demo,
    String? transportSource,
  }) {
    return ScanSnapshotDto(
      snapshotId: snapshotId,
      capturedAt: capturedAt ?? this.capturedAt,
      interfaceName: interfaceName,
      countryCode: countryCode,
      scanDurationMs: scanDurationMs,
      stale: stale,
      locationAuthorized: locationAuthorized,
      location: location,
      networks: networks,
      results: results,
      associated: associated,
      includeHiddenRequested: includeHiddenRequested,
      source: source,
      error: error,
      demo: demo ?? this.demo,
      transportSource: transportSource ?? this.transportSource,
    );
  }
}
