import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import 'windows_scan_payload.dart';

/// Reads Native Wifi snapshots from [WindowsScanBridge] (Windows only).
abstract class WindowsScanHost {
  bool get isSupported;

  Future<Map<String, dynamic>> getSnapshot();

  Future<String> requestLocationAuthorization();
}

/// Platform channel to `WindowsScanBridge` (Runner, Windows only).
class WindowsScanChannel implements WindowsScanHost {
  WindowsScanChannel({MethodChannel? channel})
      : _channel = channel ??
            const MethodChannel('dev.lv24.wifi_explorer/windows_scan');

  final MethodChannel _channel;

  @override
  bool get isSupported =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.windows;

  @override
  Future<Map<String, dynamic>> getSnapshot() async {
    final raw = await _channel.invokeMethod<Object?>('getSnapshot');
    return coerceWindowsScanPayload(raw);
  }

  @override
  Future<String> requestLocationAuthorization() async {
    if (!isSupported) return 'not-determined';
    final raw = await _channel.invokeMethod<Object?>(
      'requestLocationAuthorization',
    );
    if (raw is! String) {
      return 'not-determined';
    }
    return raw;
  }
}
