import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import 'android_scan_payload.dart';

/// Reads WifiManager snapshots from [AndroidScanBridge] (Android only).
abstract class AndroidScanHost {
  bool get isSupported;

  Future<Map<String, dynamic>> getSnapshot();

  Future<String> requestLocationAuthorization();
}

/// Platform channel to `AndroidScanBridge` (Android only).
class AndroidScanChannel implements AndroidScanHost {
  AndroidScanChannel({MethodChannel? channel})
      : _channel = channel ??
            const MethodChannel('dev.lv24.wifi_explorer/android_scan');

  final MethodChannel _channel;

  @override
  bool get isSupported =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  @override
  Future<Map<String, dynamic>> getSnapshot() async {
    final raw = await _channel.invokeMethod<Object?>('getSnapshot');
    return coerceMethodChannelMap(raw);
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
