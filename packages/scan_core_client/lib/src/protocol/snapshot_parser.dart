import '../models/scan_error_dto.dart';
import '../models/scan_snapshot_dto.dart';
import '../normalize/snapshot_normalize.dart';

ScanSnapshotDto parseScanSnapshotPayload(Map<String, dynamic> payload) {
  final resultsRaw = payload['results'];
  List<ScanResultRowDto>? results;
  if (resultsRaw is List) {
    results = resultsRaw
        .whereType<Map<String, dynamic>>()
        .map(ScanResultRowDto.fromJson)
        .toList(growable: false);
  }

  AssociatedLinkDto? associated;
  final associatedRaw = payload['associated'];
  if (associatedRaw is Map<String, dynamic>) {
    associated = AssociatedLinkDto(
      ssid: _associatedString(associatedRaw['ssid']),
      bssid: _associatedString(associatedRaw['bssid']),
      rssiDbm: (associatedRaw['rssiDbm'] as num?)?.toDouble(),
      channelNumber: associatedRaw['channelNumber'] as int?,
      channelBand: associatedRaw['channelBand'] as String?,
    );
  }

  ScanErrorDto? error;
  final errorRaw = payload['error'];
  if (errorRaw is Map<String, dynamic>) {
    error = ScanErrorDto.fromJson(errorRaw);
  }

  final locationAuthorized = payload['locationAuthorized'] as bool? ??
      (payload['location'] == 'granted');

  return ScanSnapshotDto(
    snapshotId: payload['snapshotId'] as String?,
    capturedAt: payload['capturedAt'] as String? ??
        DateTime.now().toUtc().toIso8601String(),
    interfaceName: payload['interfaceName'] as String?,
    countryCode: payload['countryCode'] as String?,
    scanDurationMs: payload['scanDurationMs'] as int?,
    stale: payload['stale'] as bool? ?? false,
    locationAuthorized: locationAuthorized,
    location: payload['location'] as String? ??
        (locationAuthorized ? 'granted' : 'not-determined'),
    networks: ensureSnapshotNetworks(payload),
    results: results,
    associated: associated,
    includeHiddenRequested:
        payload['includeHiddenRequested'] as bool? ?? true,
    source: payload['source'] as String?,
    error: error,
    demo: payload['demo'] as bool? ?? false,
    transportSource: payload['transportSource'] as String?,
  );
}

String? _associatedString(Object? raw) {
  if (raw is String) {
    final trimmed = raw.trim();
    return trimmed.isEmpty ? null : trimmed;
  }
  return readGatedString(raw);
}
