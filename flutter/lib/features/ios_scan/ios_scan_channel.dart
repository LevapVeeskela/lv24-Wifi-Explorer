import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Platform channel to `IosScanBridge` (Runner, iOS only).
class IosScanChannel {
  IosScanChannel({MethodChannel? channel})
      : _channel = channel ??
            const MethodChannel('dev.lv24.wifi_explorer/ios_scan');

  final MethodChannel _channel;

  bool get isSupported => !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  Future<Map<String, dynamic>> getSnapshot() async {
    final raw = await _channel.invokeMethod<Object?>('getSnapshot');
    if (raw is! Map) {
      throw PlatformException(
        code: 'INVALID_PAYLOAD',
        message: 'Expected Map snapshot from iOS bridge',
      );
    }
    return Map<String, dynamic>.from(raw);
  }

  Future<String> requestLocationAuthorization() async {
    final raw = await _channel.invokeMethod<Object?>(
      'requestLocationAuthorization',
    );
    if (raw is! String) {
      return 'not-determined';
    }
    return raw;
  }
}
