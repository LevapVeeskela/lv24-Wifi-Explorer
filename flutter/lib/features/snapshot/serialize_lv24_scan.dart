import 'dart:convert';

import 'package:scan_domain/scan_domain.dart';

import 'lv24_scan_constants.dart';
import 'lv24_scan_types.dart';
import 'observed_bss_json.dart';

String locationAuthorizationToWire(LocationAuthorization location) {
  return switch (location) {
    LocationAuthorization.granted => 'granted',
    LocationAuthorization.denied => 'denied',
    LocationAuthorization.notDetermined => 'not-determined',
    LocationAuthorization.restricted => 'restricted',
  };
}

LocationAuthorization? locationAuthorizationFromWire(Object? value) {
  return switch (value) {
    'granted' => LocationAuthorization.granted,
    'denied' => LocationAuthorization.denied,
    'not-determined' => LocationAuthorization.notDetermined,
    'restricted' => LocationAuthorization.restricted,
    _ => null,
  };
}

Map<String, dynamic> lv24ScanDocumentToJson(Lv24ScanDocument document) {
  final location = document.metadata.location;
  return {
    'kind': lv24ScanKind,
    'formatVersion': lv24ScanFormatVersion,
    'metadata': {
      'appName': document.metadata.appName,
      'appVersion': document.metadata.appVersion,
      'os': document.metadata.os,
      'capturedAt': document.metadata.capturedAt,
      'endedAt': document.metadata.endedAt,
      'interfaceName': document.metadata.interfaceName,
      'scanIntervalMs': document.metadata.scanIntervalMs,
      'location': location == null ? null : locationAuthorizationToWire(location),
    },
    'networks': document.networks.map(observedBssToJson).toList(),
    'historyById': document.historyById.map(
      (key, points) => MapEntry(key, points.map(rssiHistoryPointToJson).toList()),
    ),
    'annotations': document.annotations
        .map(
          (a) => {
            'id': a.id,
            'bssidPattern': a.bssidPattern,
            'text': a.text,
          },
        )
        .toList(),
    'pinnedColors': document.pinnedColors
        .map(
          (p) => {'bssid': p.bssid, 'color': p.color},
        )
        .toList(),
  };
}

/// Pretty-printed JSON for a `.lv24scan` file (UTF-8 when written to disk).
String serializeLv24Scan(Lv24ScanDocument document) {
  const encoder = JsonEncoder.withIndent('  ');
  return '${encoder.convert(lv24ScanDocumentToJson(document))}\n';
}
