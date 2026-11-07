import 'package:flutter/services.dart';

/// Deep-converts a MethodChannel map so nested Standard codec maps parse as
/// `Map<String, dynamic>` (required by `parseScanSnapshotPayload`).
Map<String, dynamic> coerceWindowsScanPayload(Object? raw) {
  if (raw is! Map) {
    throw PlatformException(
      code: 'INVALID_PAYLOAD',
      message: 'Expected Map snapshot from Windows WLAN bridge',
    );
  }
  return _coerceMap(raw);
}

Map<String, dynamic> _coerceMap(Map<dynamic, dynamic> raw) {
  return raw.map((key, value) => MapEntry(key.toString(), _coerce(value)));
}

Object? _coerce(Object? value) {
  if (value is Map) return _coerceMap(value);
  if (value is List) return value.map(_coerce).toList(growable: false);
  return value;
}
