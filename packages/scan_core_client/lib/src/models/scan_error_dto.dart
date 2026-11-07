enum ScanErrorCode {
  helperUnavailable('HELPER_UNAVAILABLE'),
  bssidUnavailable('BSSID_UNAVAILABLE'),
  noInterface('NO_INTERFACE'),
  wifiOff('WIFI_OFF'),
  scanFailed('SCAN_FAILED'),
  timeout('TIMEOUT'),
  locationDenied('LOCATION_DENIED'),
  locationRestricted('LOCATION_RESTRICTED'),
  unknown('UNKNOWN');

  const ScanErrorCode(this.wireName);
  final String wireName;

  static ScanErrorCode parse(String? raw) {
    if (raw == null) return ScanErrorCode.unknown;
    for (final value in ScanErrorCode.values) {
      if (value.wireName == raw) return value;
    }
    return ScanErrorCode.unknown;
  }
}

class ScanErrorDto {
  const ScanErrorDto({
    required this.code,
    required this.message,
    required this.recoverable,
    this.demoFallback,
  });

  final ScanErrorCode code;
  final String message;
  final bool recoverable;
  final bool? demoFallback;

  factory ScanErrorDto.fromJson(Map<String, dynamic> json) {
    return ScanErrorDto(
      code: ScanErrorCode.parse(json['code'] as String?),
      message: json['message'] as String? ?? '',
      recoverable: json['recoverable'] as bool? ?? false,
      demoFallback: json['demoFallback'] as bool?,
    );
  }
}
