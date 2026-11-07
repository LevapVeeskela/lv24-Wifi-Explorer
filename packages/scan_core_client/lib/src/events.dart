import 'models/scan_error_dto.dart';
import 'models/scan_snapshot_dto.dart';
import 'package:scan_domain/src/identity.dart';

/// Origin of a snapshot event (Electron transport vs ScanCore process).
enum ScanSnapshotOrigin {
  scancore,
  fixtures,
}

sealed class ScanCoreEvent {
  const ScanCoreEvent();
}

final class ScanCoreHello extends ScanCoreEvent {
  const ScanCoreHello({
    required this.protocolVersion,
    required this.version,
    required this.helper,
    required this.transport,
    this.path,
    this.port,
    this.tokenRequired = false,
  });

  final int protocolVersion;
  final String version;
  final String helper;
  final String transport;
  final String? path;
  final int? port;
  final bool tokenRequired;
}

final class ScanCorePermissionsStatus extends ScanCoreEvent {
  const ScanCorePermissionsStatus({
    required this.location,
    required this.authorized,
    this.demoMode = false,
  });

  final LocationAuthorization location;
  final bool authorized;
  final bool demoMode;
}

final class ScanCoreHelperStatus extends ScanCoreEvent {
  const ScanCoreHelperStatus({
    required this.running,
    required this.version,
    required this.scanning,
  });

  final bool running;
  final String version;
  final bool scanning;
}

final class ScanCoreSnapshotEvent extends ScanCoreEvent {
  const ScanCoreSnapshotEvent({
    required this.snapshot,
    required this.origin,
    this.demo = false,
  });

  final ScanSnapshotDto snapshot;
  final ScanSnapshotOrigin origin;
  final bool demo;
}

final class ScanCoreErrorEvent extends ScanCoreEvent {
  const ScanCoreErrorEvent({required this.error});

  final ScanErrorDto error;
}

final class ScanCoreProcessExit extends ScanCoreEvent {
  const ScanCoreProcessExit({required this.exitCode});

  final int? exitCode;
}

final class ScanCoreParseWarning extends ScanCoreEvent {
  const ScanCoreParseWarning({required this.rawLine, this.message});

  final String rawLine;
  final String? message;
}
