import 'events.dart';
import 'protocol/constants.dart';

/// Shared ScanCore client contract: start/stop and a stream of wire events.
abstract interface class ScanCoreClient {
  /// Parsed outbound lines (`hello`, snapshots, permissions, errors, …).
  Stream<ScanCoreEvent> get events;

  /// Whether the client is actively scanning or replaying fixtures.
  bool get isRunning;

  /// Begin scanning (live helper) or fixture replay (demo client).
  Future<void> start({ScanCoreStartOptions options = const ScanCoreStartOptions()});

  /// Stop scan loop and release resources (helper shutdown when applicable).
  Future<void> stop();

  /// Live helper only: adjust pacing floor (minimum 3000 ms in ScanCore).
  Future<void> setIntervalMs(int intervalMs);

  /// Request current Location authorization from the helper (no-op in demo replay).
  Future<void> queryPermissions();
}

class ScanCoreStartOptions {
  const ScanCoreStartOptions({
    this.includeHidden = true,
    this.intervalMs = scanCoreMinIntervalMs,
  });

  final bool includeHidden;
  final int intervalMs;
}
