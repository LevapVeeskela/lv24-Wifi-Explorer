import 'package:scan_core_client/scan_core_client.dart';

import 'linux_scan_channel.dart';
import 'linux_scan_resolve.dart';

/// Fetches Linux NetworkManager snapshots; demo fallback when scan is limited.
class LinuxScanAdapter {
  LinuxScanAdapter({
    LinuxScanChannel? channel,
    FixtureLoader? fixtureLoader,
    String? repoRoot,
  })  : _channel = channel ?? LinuxScanChannel(),
        _fixtureLoader = fixtureLoader ?? FixtureLoader(),
        _repoRoot = repoRoot;

  final LinuxScanChannel _channel;
  final FixtureLoader _fixtureLoader;
  final String? _repoRoot;

  bool get isSupported => _channel.isSupported;

  Future<String> requestLocationAuthorization() {
    return _channel.requestLocationAuthorization();
  }

  Future<LinuxScanFetchResult> fetchSnapshot() async {
    if (!isSupported) {
      return LinuxScanFetchResult(
        snapshot: _loadDemoFixture(),
        mode: LinuxScanMode.demo,
        usedNativeBridge: false,
      );
    }

    try {
      final payload = await _channel.getSnapshot();
      final native = parseScanSnapshotPayload(payload);
      final resolved = resolveLinuxScanSnapshot(
        native,
        demoFixture: _loadDemoFixture(),
      );
      final mode = _modeFor(resolved, native);
      return LinuxScanFetchResult(
        snapshot: resolved,
        mode: mode,
        usedNativeBridge: true,
        native: native,
      );
    } catch (_) {
      return LinuxScanFetchResult(
        snapshot: _loadDemoFixture(),
        mode: LinuxScanMode.demo,
        usedNativeBridge: false,
      );
    }
  }

  ScanSnapshotDto _loadDemoFixture() {
    return _fixtureLoader.loadDemoSnapshot(repoRoot: _repoRoot);
  }

  LinuxScanMode _modeFor(ScanSnapshotDto resolved, ScanSnapshotDto native) {
    if (resolved.demo ||
        resolved.transportSource == LinuxScanSourceWire.fixtures) {
      return LinuxScanMode.demo;
    }
    if (isLinuxLiveAccessPointSource(resolved)) {
      return LinuxScanMode.live;
    }
    if (hasLinuxConnectedNetworkIdentity(native)) {
      return LinuxScanMode.connectedOnly;
    }
    return LinuxScanMode.demo;
  }
}

enum LinuxScanMode { live, connectedOnly, demo }

class LinuxScanFetchResult {
  const LinuxScanFetchResult({
    required this.snapshot,
    required this.mode,
    required this.usedNativeBridge,
    this.native,
  });

  final ScanSnapshotDto snapshot;
  final LinuxScanMode mode;
  final bool usedNativeBridge;
  final ScanSnapshotDto? native;
}
