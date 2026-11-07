import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Platform channel to `linux_scan_bridge` (Runner, Linux only).
class LinuxScanChannel {
  LinuxScanChannel({MethodChannel? channel})
      : _channel = channel ??
            const MethodChannel('dev.lv24.wifi_explorer/linux_scan');

  final MethodChannel _channel;

  bool get isSupported =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.linux;

  Future<Map<String, dynamic>> getSnapshot() async {
    final raw = await _channel.invokeMethod<Object?>('getSnapshot');
    if (raw is! Map) {
      throw PlatformException(
        code: 'INVALID_PAYLOAD',
        message: 'Expected Map snapshot from Linux bridge',
      );
    }
    return Map<String, dynamic>.from(raw);
  }

  Future<String> requestLocationAuthorization() async {
    final raw = await _channel.invokeMethod<Object?>(
      'requestLocationAuthorization',
    );
    if (raw is! String) {
      return 'not-applicable';
    }
    return raw;
  }
}
