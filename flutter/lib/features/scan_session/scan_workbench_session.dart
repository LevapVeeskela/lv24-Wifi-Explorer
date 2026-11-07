import 'package:flutter/foundation.dart';
import 'package:scan_domain/scan_domain.dart';

/// Shared workbench contract for demo, iOS, and optional Android sessions.
abstract interface class ScanWorkbenchSession implements ChangeNotifier {
  List<ObservedBss> get rows;

  String? get connectedBssid;

  ObservedBss? get selected;

  bool get isRunning;

  bool get demo;

  LocationAuthorization get location;

  DateTime? get lastSnapshotAt;

  /// True when live ScanCore reported an error (ignored in demo mode).
  bool get scanCoreError;

  /// Max `presence.lastSeenAt` across [rows] (Electron `baseRows` fallback).
  DateTime? get latestRowLastSeenAt;

  Future<void> start();

  Future<void> stop();

  /// Platform permission prep (no-op on desktop demo).
  Future<void> requestLocation();

  void select(ObservedBss? row);
}

/// Max `presence.lastSeenAt` across [rows] (Electron status bar fallback).
DateTime? maxLastSeenAtForRows(Iterable<ObservedBss> rows) {
  DateTime? latest;
  for (final row in rows) {
    final at = DateTime.tryParse(row.presence.lastSeenAt);
    if (at != null && (latest == null || at.isAfter(latest))) {
      latest = at;
    }
  }
  return latest;
}
