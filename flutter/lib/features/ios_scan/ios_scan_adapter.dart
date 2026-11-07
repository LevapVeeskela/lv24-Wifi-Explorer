import 'package:scan_core_client/scan_core_client.dart';

import 'ios_scan_channel.dart';
import 'ios_scan_resolve.dart';

/// Fetches iOS connected-network snapshots and falls back to LV24 demo fixtures.
class IosScanAdapter {
  IosScanAdapter({
    IosScanChannel? channel,
    FixtureLoader? fixtureLoader,
    String? repoRoot,
  })  : _channel = channel ?? IosScanChannel(),
        _fixtureLoader = fixtureLoader ?? FixtureLoader(),
        _repoRoot = repoRoot;

  final IosScanChannel _channel;
  final FixtureLoader _fixtureLoader;
  final String? _repoRoot;

  bool get isSupported => _channel.isSupported;

  Future<String> requestLocationAuthorization() {
    return _channel.requestLocationAuthorization();
  }

  Future<IosScanFetchResult> fetchSnapshot() async {
    if (!isSupported) {
      return IosScanFetchResult(
        snapshot: _loadDemoFixture(),
        mode: IosScanMode.demo,
        usedNativeBridge: false,
      );
    }

    try {
      final payload = await _channel.getSnapshot();
      final native = parseScanSnapshotPayload(payload);
      final resolved = resolveIosScanSnapshot(
        native,
        demoFixture: _loadDemoFixture(),
      );
      final mode = _modeFor(resolved, native);
      return IosScanFetchResult(
        snapshot: resolved,
        mode: mode,
        usedNativeBridge: true,
        native: native,
      );
    } catch (_) {
      return IosScanFetchResult(
        snapshot: _loadDemoFixture(),
        mode: IosScanMode.demo,
        usedNativeBridge: false,
      );
    }
  }

  ScanSnapshotDto _loadDemoFixture() {
    return _fixtureLoader.loadDemoSnapshot(repoRoot: _repoRoot);
  }

  IosScanMode _modeFor(ScanSnapshotDto resolved, ScanSnapshotDto native) {
    if (resolved.demo ||
        resolved.transportSource == IosScanSourceWire.fixtures) {
      return IosScanMode.demo;
    }
    if (hasConnectedNetworkIdentity(native)) {
      return IosScanMode.connectedOnly;
    }
    return IosScanMode.demo;
  }
}

enum IosScanMode { connectedOnly, demo }

class IosScanFetchResult {
  const IosScanFetchResult({
    required this.snapshot,
    required this.mode,
    required this.usedNativeBridge,
    this.native,
  });

  final ScanSnapshotDto snapshot;
  final IosScanMode mode;
  final bool usedNativeBridge;
  final ScanSnapshotDto? native;
}
