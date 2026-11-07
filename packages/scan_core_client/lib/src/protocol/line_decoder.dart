import 'dart:convert';

import '../events.dart';
import '../mappers/scan_domain_mapper.dart';
import '../models/scan_error_dto.dart';
import '../protocol/constants.dart';
import '../protocol/snapshot_parser.dart';

ScanCoreEvent? decodeScanCoreLine(Map<String, dynamic> line) {
  final type = line['type'] as String?;
  if (type == null) return null;

  switch (type) {
    case 'hello':
      return ScanCoreHello(
        protocolVersion:
            line['protocolVersion'] as int? ?? scanCoreProtocolVersion,
        version: line['version'] as String? ?? '',
        helper: line['helper'] as String? ?? scanCoreHelperName,
        transport: line['transport'] as String? ?? 'stdio',
        path: line['path'] as String?,
        port: line['port'] as int?,
        tokenRequired: line['tokenRequired'] as bool? ?? false,
      );
    case 'locationAuthorized':
    case 'permissions:status':
      final payload = line['payload'];
      if (payload is! Map<String, dynamic>) return null;
      final locationWire = payload['location'] as String?;
      final authorized = payload['authorized'] as bool? ??
          locationWire == 'granted';
      return ScanCorePermissionsStatus(
        location: locationAuthorizationFromWire(locationWire),
        authorized: authorized,
      );
    case 'helper:status':
      final payload = line['payload'];
      if (payload is! Map<String, dynamic>) return null;
      return ScanCoreHelperStatus(
        running: payload['running'] as bool? ?? false,
        version: payload['version'] as String? ?? '',
        scanning: payload['scanning'] as bool? ?? false,
      );
    case 'scan:snapshot':
      final payload = line['payload'];
      if (payload is! Map<String, dynamic>) return null;
      return ScanCoreSnapshotEvent(
        snapshot: parseScanSnapshotPayload(payload),
        origin: ScanSnapshotOrigin.scancore,
      );
    case 'error':
      final payload = line['payload'];
      if (payload is! Map<String, dynamic>) return null;
      return ScanCoreErrorEvent(error: ScanErrorDto.fromJson(payload));
    default:
      return null;
  }
}

Map<String, dynamic>? parseJsonLine(String raw) {
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return null;
  try {
    final decoded = jsonDecode(trimmed);
    if (decoded is Map<String, dynamic>) return decoded;
  } catch (_) {
    return null;
  }
  return null;
}

String encodeJsonLine(Map<String, dynamic> command) {
  return jsonEncode(command);
}
