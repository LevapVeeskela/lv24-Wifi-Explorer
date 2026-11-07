import 'package:scan_domain/scan_domain.dart';

import 'lv24_scan_constants.dart';

class Lv24PinnedColor {
  const Lv24PinnedColor({required this.bssid, required this.color});

  final String bssid;
  final String color;
}

class Lv24ScanAnnotation {
  const Lv24ScanAnnotation({
    required this.id,
    required this.bssidPattern,
    required this.text,
  });

  final String id;
  final String bssidPattern;
  final String text;
}

class Lv24ScanMetadata {
  const Lv24ScanMetadata({
    required this.appName,
    required this.appVersion,
    required this.os,
    required this.capturedAt,
    required this.endedAt,
    required this.interfaceName,
    required this.scanIntervalMs,
    required this.location,
  });

  final String appName;
  final String appVersion;
  final String? os;
  final String capturedAt;
  final String? endedAt;
  final String? interfaceName;
  final int? scanIntervalMs;
  final LocationAuthorization? location;
}

class Lv24ScanDocument {
  const Lv24ScanDocument({
    required this.metadata,
    required this.networks,
    required this.historyById,
    required this.annotations,
    required this.pinnedColors,
  });

  final Lv24ScanMetadata metadata;
  final List<ObservedBss> networks;
  final Map<String, List<RssiHistoryPoint>> historyById;
  final List<Lv24ScanAnnotation> annotations;
  final List<Lv24PinnedColor> pinnedColors;

  String get kind => lv24ScanKind;
  int get formatVersion => lv24ScanFormatVersion;
}

enum Lv24ScanParseCode {
  invalidJson,
  foreignFormat,
  unsupportedFormat,
  invalidDocument,
}

sealed class Lv24ScanParseResult {
  const Lv24ScanParseResult();
}

final class Lv24ScanParseOk extends Lv24ScanParseResult {
  const Lv24ScanParseOk(this.document);
  final Lv24ScanDocument document;
}

final class Lv24ScanParseError extends Lv24ScanParseResult {
  const Lv24ScanParseError({
    required this.error,
    required this.code,
  });

  final String error;
  final Lv24ScanParseCode code;
}
