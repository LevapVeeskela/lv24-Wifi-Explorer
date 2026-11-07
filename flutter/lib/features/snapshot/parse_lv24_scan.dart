import 'dart:convert';

import 'package:scan_domain/scan_domain.dart';

import 'lv24_scan_constants.dart';
import 'lv24_scan_file_name.dart';
import 'lv24_scan_types.dart';
import 'observed_bss_json.dart';
import 'serialize_lv24_scan.dart';

bool _isRecord(Object? value) {
  return value != null && value is Map && value is! List;
}

bool _looksForeign(Map<dynamic, dynamic> value) {
  final tokens = [
    value['kind'],
    value['format'],
    value['uti'],
    value['extension'],
    value['type'],
  ].whereType<String>().map((t) => t.toLowerCase());
  return tokens.any((t) => t.contains('wifiexplorer'));
}

List<ObservedBss> _stitchHistory(
  List<ObservedBss> networks,
  Map<String, List<RssiHistoryPoint>> historyById,
) {
  return networks.map((bss) {
    final id = bssidOfNetwork(bss);
    if (id == null) return bss;
    if (bss.rssiHistory.isNotEmpty) return bss;
    final hist = historyById[id];
    if (hist == null || hist.isEmpty) return bss;
    return ObservedBss(
      identity: bss.identity,
      ibss: bss.ibss,
      countryCode: bss.countryCode,
      beaconIntervalMs: bss.beaconIntervalMs,
      signal: bss.signal,
      channel: bss.channel,
      security: bss.security,
      phy: bss.phy,
      maxRate: bss.maxRate,
      vendor: bss.vendor,
      ie: bss.ie,
      presence: bss.presence,
      rssiHistory: hist,
      lastRaw: bss.lastRaw,
    );
  }).toList(growable: false);
}

Lv24ScanMetadata? _parseMetadata(Object? value) {
  if (!_isRecord(value)) return null;
  final map = Map<String, dynamic>.from(value as Map);
  if (map['appVersion'] is! String) return null;
  return Lv24ScanMetadata(
    appName: lv24ScanAppName,
    appVersion: map['appVersion'] as String,
    os: map['os'] as String?,
    capturedAt: map['capturedAt'] is String
        ? map['capturedAt'] as String
        : DateTime.fromMillisecondsSinceEpoch(0).toUtc().toIso8601String(),
    endedAt: map['endedAt'] as String?,
    interfaceName: map['interfaceName'] as String?,
    scanIntervalMs: map['scanIntervalMs'] is num ? (map['scanIntervalMs'] as num).toInt() : null,
    location: locationAuthorizationFromWire(map['location']),
  );
}

Lv24ScanParseResult parseLv24Scan(String text, {String? fileName}) {
  if (fileName != null && isForeignScanFileName(fileName)) {
    return const Lv24ScanParseError(
      code: Lv24ScanParseCode.foreignFormat,
      error: 'This file uses a third-party scan format. Open a .lv24scan snapshot.',
    );
  }

  Object? parsed;
  try {
    parsed = jsonDecode(text);
  } catch (_) {
    return const Lv24ScanParseError(
      code: Lv24ScanParseCode.invalidJson,
      error: 'Snapshot is not valid JSON.',
    );
  }

  if (!_isRecord(parsed)) {
    return const Lv24ScanParseError(
      code: Lv24ScanParseCode.invalidDocument,
      error: 'Snapshot root must be an object.',
    );
  }

  final root = Map<String, dynamic>.from(parsed as Map);

  if (_looksForeign(root)) {
    return const Lv24ScanParseError(
      code: Lv24ScanParseCode.foreignFormat,
      error: 'This file uses a third-party scan format. Open a .lv24scan snapshot.',
    );
  }

  if (root['kind'] != lv24ScanKind) {
    return const Lv24ScanParseError(
      code: Lv24ScanParseCode.unsupportedFormat,
      error: 'Not an LV24 scan snapshot (missing kind lv24.wifi-explorer.scan).',
    );
  }

  if (root['formatVersion'] != lv24ScanFormatVersion) {
    return Lv24ScanParseError(
      code: Lv24ScanParseCode.unsupportedFormat,
      error: 'Unsupported .lv24scan formatVersion (${root['formatVersion']}).',
    );
  }

  final metadata = _parseMetadata(root['metadata']);
  if (metadata == null) {
    return const Lv24ScanParseError(
      code: Lv24ScanParseCode.invalidDocument,
      error: 'Snapshot metadata is incomplete.',
    );
  }

  if (root['networks'] is! List) {
    return const Lv24ScanParseError(
      code: Lv24ScanParseCode.invalidDocument,
      error: 'Snapshot networks must be an array.',
    );
  }

  final networks = (root['networks'] as List)
      .whereType<Map>()
      .map((e) => observedBssFromJson(Map<String, dynamic>.from(e)))
      .toList(growable: false);

  final historyById = <String, List<RssiHistoryPoint>>{};
  if (_isRecord(root['historyById'])) {
    for (final entry in (root['historyById'] as Map).entries) {
      if (entry.value is! List) continue;
      historyById['${entry.key}'] = (entry.value as List)
          .map(rssiHistoryPointFromJson)
          .whereType<RssiHistoryPoint>()
          .toList(growable: false);
    }
  }

  final annotations = root['annotations'] is List
      ? (root['annotations'] as List)
          .whereType<Map>()
          .map((raw) {
            final map = Map<String, dynamic>.from(raw);
            if (map['bssidPattern'] is! String) return null;
            return Lv24ScanAnnotation(
              id: map['id'] is String ? map['id'] as String : 'ann-${map['bssidPattern']}',
              bssidPattern: map['bssidPattern'] as String,
              text: map['text'] is String ? map['text'] as String : '',
            );
          })
          .whereType<Lv24ScanAnnotation>()
          .toList(growable: false)
      : <Lv24ScanAnnotation>[];

  final pinnedColors = root['pinnedColors'] is List
      ? (root['pinnedColors'] as List)
          .whereType<Map>()
          .map((raw) {
            final map = Map<String, dynamic>.from(raw);
            if (map['bssid'] is! String || map['color'] is! String) return null;
            return Lv24PinnedColor(
              bssid: map['bssid'] as String,
              color: map['color'] as String,
            );
          })
          .whereType<Lv24PinnedColor>()
          .toList(growable: false)
      : <Lv24PinnedColor>[];

  return Lv24ScanParseOk(
    Lv24ScanDocument(
      metadata: metadata,
      networks: _stitchHistory(networks, historyById),
      historyById: historyById,
      annotations: annotations,
      pinnedColors: pinnedColors,
    ),
  );
}
