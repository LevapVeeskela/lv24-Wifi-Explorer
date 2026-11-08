import 'package:scan_core_client/scan_core_client.dart';

import 'linux_scan_source.dart';

/// Chooses NetworkManager snapshots vs bundled demo fixtures.
ScanSnapshotDto resolveLinuxScanSnapshot(
  ScanSnapshotDto native, {
  required ScanSnapshotDto demoFixture,
}) {
  if (isLinuxLiveAccessPointSource(native)) {
    return native;
  }

  if (native.demo ||
      native.source == LinuxScanSourceWire.demo ||
      native.error?.demoFallback == true) {
    return _demoWithNativeContext(native, demoFixture);
  }

  if (hasLinuxConnectedNetworkIdentity(native)) {
    return native;
  }

  return _demoWithNativeContext(native, demoFixture);
}

/// Visible for tests in this library.
bool isLinuxLiveAccessPointSource(ScanSnapshotDto snapshot) {
  return snapshot.source == LinuxScanSourceWire.networkManagerAccessPoints &&
      !snapshot.demo &&
      snapshot.networks.isNotEmpty;
}

bool hasLinuxConnectedNetworkIdentity(ScanSnapshotDto snapshot) {
  if (snapshot.source != LinuxScanSourceWire.connectedNetworkOnly ||
      snapshot.demo) {
    return false;
  }
  final associated = snapshot.associated;
  if (_nonEmpty(associated?.ssid) || _nonEmpty(associated?.bssid)) {
    return true;
  }
  for (final row in snapshot.networks) {
    if (_nonEmpty(row.ssid) || _nonEmpty(row.bssid)) {
      return true;
    }
  }
  return false;
}

ScanSnapshotDto _demoWithNativeContext(
  ScanSnapshotDto native,
  ScanSnapshotDto demoFixture,
) {
  final associated = _associatedForDemoFallback(native, demoFixture);
  return ScanSnapshotDto(
    snapshotId: demoFixture.snapshotId,
    capturedAt: demoFixture.capturedAt,
    interfaceName: demoFixture.interfaceName,
    countryCode: demoFixture.countryCode,
    scanDurationMs: native.scanDurationMs ?? demoFixture.scanDurationMs,
    stale: demoFixture.stale,
    locationAuthorized: true,
    location: native.location,
    networks: demoFixture.networks,
    results: demoFixture.results,
    associated: associated,
    includeHiddenRequested: demoFixture.includeHiddenRequested,
    source: LinuxScanSourceWire.demo,
    error: native.error ?? demoFixture.error,
    demo: true,
    transportSource:
        demoFixture.transportSource ?? LinuxScanSourceWire.fixtures,
  );
}

AssociatedLinkDto? _associatedForDemoFallback(
  ScanSnapshotDto native,
  ScanSnapshotDto demoFixture,
) {
  final fromNative = native.associated;
  if (_nonEmpty(fromNative?.ssid) || _nonEmpty(fromNative?.bssid)) {
    return fromNative;
  }
  return demoFixture.associated;
}

/// Mirrors [LinuxScanSource] without importing the feature barrel into tests.
abstract final class LinuxScanSourceWire {
  static const networkManagerAccessPoints = 'networkManagerAccessPoints';
  static const connectedNetworkOnly = 'connectedNetworkOnly';
  static const demo = 'demo';
  static const fixtures = 'fixtures';
}

bool _nonEmpty(String? value) {
  if (value == null) return false;
  return value.trim().isNotEmpty;
}
