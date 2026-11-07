import 'package:scan_core_client/scan_core_client.dart';

import 'windows_scan_channel.dart';
import 'windows_scan_resolve.dart';

/// Fetches the Windows associated-link snapshot and falls back to demo fixtures.
class WindowsScanAdapter {
  WindowsScanAdapter({
    WindowsScanHost? host,
    WindowsScanChannel? channel,
    FixtureLoader? fixtureLoader,
    String? repoRoot,
  })  : _host = host ?? channel ?? WindowsScanChannel(),
        _fixtureLoader = fixtureLoader ?? FixtureLoader(),
        _repoRoot = repoRoot;

  final WindowsScanHost _host;
  final FixtureLoader _fixtureLoader;
  final String? _repoRoot;

  bool get isSupported => _host.isSupported;

  Future<String> requestLocationAuthorization() {
    return _host.requestLocationAuthorization();
  }

  Future<WindowsScanFetchResult> fetchSnapshot() async {
    if (!isSupported) {
      return WindowsScanFetchResult(
        snapshot: _loadDemoFixture(),
        mode: WindowsScanMode.demo,
        usedNativeBridge: false,
      );
    }

    try {
      final payload = await _host.getSnapshot();
      final native = parseScanSnapshotPayload(payload);
      if (hasWindowsConnectedNetworkIdentity(native)) {
        return WindowsScanFetchResult(
          snapshot: native,
          mode: WindowsScanMode.connectedOnly,
          usedNativeBridge: true,
          native: native,
        );
      }
      final resolved = resolveWindowsScanSnapshot(
        native,
        demoFixture: _loadDemoFixture(),
      );
      final mode = _modeFor(resolved, native);
      return WindowsScanFetchResult(
        snapshot: resolved,
        mode: mode,
        usedNativeBridge: true,
        native: native,
      );
    } catch (_) {
      return WindowsScanFetchResult(
        snapshot: _loadDemoFixture(),
        mode: WindowsScanMode.demo,
        usedNativeBridge: false,
      );
    }
  }

  ScanSnapshotDto _loadDemoFixture() {
    return _fixtureLoader.loadDemoSnapshot(repoRoot: _repoRoot);
  }

  WindowsScanMode _modeFor(ScanSnapshotDto resolved, ScanSnapshotDto native) {
    if (resolved.demo ||
        resolved.transportSource == WindowsScanSourceWire.fixtures) {
      return WindowsScanMode.demo;
    }
    if (hasWindowsConnectedNetworkIdentity(native)) {
      return WindowsScanMode.connectedOnly;
    }
    return WindowsScanMode.demo;
  }
}

enum WindowsScanMode { connectedOnly, demo }

class WindowsScanFetchResult {
  const WindowsScanFetchResult({
    required this.snapshot,
    required this.mode,
    required this.usedNativeBridge,
    this.native,
  });

  final ScanSnapshotDto snapshot;
  final WindowsScanMode mode;
  final bool usedNativeBridge;
  final ScanSnapshotDto? native;
}
