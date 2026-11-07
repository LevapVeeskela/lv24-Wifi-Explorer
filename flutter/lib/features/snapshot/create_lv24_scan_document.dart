import 'dart:convert';

import 'package:scan_domain/scan_domain.dart';

import 'lv24_scan_constants.dart';
import 'lv24_scan_types.dart';
import 'observed_bss_json.dart';

List<RssiHistoryPoint> _cloneHistory(List<RssiHistoryPoint> points) {
  return points
      .map(
        (p) => RssiHistoryPoint(
          at: p.at,
          rssiDbm: p.rssiDbm,
          noiseDbm: p.noiseDbm,
          snrDb: p.snrDb,
          channelNumber: p.channelNumber,
        ),
      )
      .toList(growable: false);
}

Map<String, List<RssiHistoryPoint>> _historyByIdFrom(List<ObservedBss> networks) {
  final out = <String, List<RssiHistoryPoint>>{};
  for (final bss in networks) {
    final id = bssidOfNetwork(bss);
    if (id == null) continue;
    out[id] = _cloneHistory(bss.rssiHistory);
  }
  return out;
}

List<ObservedBss> _cloneNetworks(List<ObservedBss> networks) {
  return networks
      .map(
        (n) => observedBssFromJson(
          jsonDecode(jsonEncode(observedBssToJson(n))) as Map<String, dynamic>,
        ),
      )
      .toList(growable: false);
}

Lv24ScanDocument createLv24ScanDocument({
  required List<ObservedBss> networks,
  List<Lv24ScanAnnotation> annotations = const [],
  List<Lv24PinnedColor> pinnedColors = const [],
  required String appVersion,
  String? os,
  String? capturedAt,
  String? endedAt,
  String? interfaceName,
  int? scanIntervalMs,
  LocationAuthorization? location,
}) {
  final cloned = _cloneNetworks(networks);
  return Lv24ScanDocument(
    metadata: Lv24ScanMetadata(
      appName: lv24ScanAppName,
      appVersion: appVersion,
      os: os,
      capturedAt: capturedAt ?? DateTime.now().toUtc().toIso8601String(),
      endedAt: endedAt,
      interfaceName: interfaceName,
      scanIntervalMs: scanIntervalMs,
      location: location,
    ),
    networks: cloned,
    historyById: _historyByIdFrom(cloned),
    annotations: List<Lv24ScanAnnotation>.from(annotations),
    pinnedColors: List<Lv24PinnedColor>.from(pinnedColors),
  );
}
