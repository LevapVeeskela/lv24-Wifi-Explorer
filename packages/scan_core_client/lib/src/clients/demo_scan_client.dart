import 'dart:async';

import '../scan_core_client.dart';
import '../events.dart';
import '../fixtures/fixture_loader.dart';
import '../protocol/constants.dart';
import 'package:scan_domain/src/identity.dart';

/// Replays `resources/fixtures/` on a timer (Electron demo fallback).
class DemoScanClient implements ScanCoreClient {
  DemoScanClient({
    this.repoRoot,
    FixtureLoader? loader,
    this.intervalMs = scanCoreMinIntervalMs,
  }) : _loader = loader ?? FixtureLoader();

  final String? repoRoot;
  final FixtureLoader _loader;
  final int intervalMs;

  final StreamController<ScanCoreEvent> _events =
      StreamController<ScanCoreEvent>.broadcast();
  Timer? _timer;
  bool _running = false;

  @override
  Stream<ScanCoreEvent> get events => _events.stream;

  @override
  bool get isRunning => _running;

  @override
  Future<void> start({ScanCoreStartOptions options = const ScanCoreStartOptions()}) async {
    if (_running) return;
    _running = true;

    _events.add(
      const ScanCorePermissionsStatus(
        location: LocationAuthorization.restricted,
        authorized: false,
        demoMode: true,
      ),
    );

    _emitSnapshot();
    final ms = options.intervalMs < scanCoreMinIntervalMs
        ? scanCoreMinIntervalMs
        : options.intervalMs;
    _timer = Timer.periodic(Duration(milliseconds: ms), (_) => _emitSnapshot());
  }

  @override
  Future<void> stop() async {
    _timer?.cancel();
    _timer = null;
    _running = false;
  }

  @override
  Future<void> setIntervalMs(int intervalMs) async {
    if (!_running) return;
    final ms = intervalMs < scanCoreMinIntervalMs ? scanCoreMinIntervalMs : intervalMs;
    _timer?.cancel();
    _timer = Timer.periodic(Duration(milliseconds: ms), (_) => _emitSnapshot());
  }

  @override
  Future<void> queryPermissions() async {
    _events.add(
      const ScanCorePermissionsStatus(
        location: LocationAuthorization.restricted,
        authorized: false,
        demoMode: true,
      ),
    );
  }

  void _emitSnapshot() {
    final payload = _loader.buildDemoSnapshotPayload(repoRoot: repoRoot);
    final snapshot = _loader.loadDemoSnapshot(repoRoot: repoRoot);
    _events.add(
      ScanCoreSnapshotEvent(
        snapshot: snapshot.copyWith(
          capturedAt: payload['capturedAt'] as String? ?? snapshot.capturedAt,
          demo: true,
          transportSource: 'fixtures',
        ),
        origin: ScanSnapshotOrigin.fixtures,
        demo: true,
      ),
    );
  }

  void dispose() {
    _timer?.cancel();
    _events.close();
  }
}
