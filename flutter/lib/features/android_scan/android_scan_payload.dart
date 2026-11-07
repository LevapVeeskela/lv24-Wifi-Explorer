import 'package:flutter/services.dart';

/// Deep-converts a MethodChannel map so nested Android HashMaps parse as
/// `Map<String, dynamic>` (required by `parseScanSnapshotPayload`).
Map<String, dynamic> coerceStringKeyMap(Object? raw) =>
    coerceMethodChannelMap(raw);

Map<String, dynamic> coerceMethodChannelMap(Object? raw) {
  if (raw is! Map) {
    throw PlatformException(
      code: 'INVALID_PAYLOAD',
      message: 'Expected Map snapshot from Android bridge',
    );
  }
  return _coerceMap(raw);
}

int? readSuggestedIntervalMs(Map<String, dynamic> payload) {
  final value = payload['suggestedIntervalMs'];
  if (value is int) return value;
  if (value is num) return value.round();
  return null;
}

bool readThrottled(Map<String, dynamic> payload) {
  return payload['throttled'] == true;
}

Map<String, dynamic> _coerceMap(Map<dynamic, dynamic> raw) {
  return raw.map((key, value) => MapEntry(key.toString(), _coerce(value)));
}

Object? _coerce(Object? value) {
  if (value is Map) return _coerceMap(value);
  if (value is List) return value.map(_coerce).toList(growable: false);
  return value;
}
