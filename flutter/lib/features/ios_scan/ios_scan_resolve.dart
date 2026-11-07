import 'package:scan_core_client/scan_core_client.dart';

/// Chooses live connected-network snapshots vs bundled demo fixtures.
ScanSnapshotDto resolveIosScanSnapshot(
  ScanSnapshotDto native, {
  required ScanSnapshotDto demoFixture,
}) {
  if (native.demo || native.source == IosScanSourceWire.demo) {
    return _demoWithNativeContext(native, demoFixture);
  }

  if (hasConnectedNetworkIdentity(native)) {
    return native;
  }

  if (native.error?.demoFallback == true) {
    return _demoWithNativeContext(native, demoFixture);
  }

  return _demoWithNativeContext(native, demoFixture);
}

/// Visible for tests in this library.
bool hasConnectedNetworkIdentity(ScanSnapshotDto snapshot) {
  if (snapshot.source == IosScanSourceWire.connectedNetworkOnly) {
    final associated = snapshot.associated;
    if (_nonEmpty(associated?.ssid) || _nonEmpty(associated?.bssid)) {
      return true;
    }
    for (final row in snapshot.networks) {
      if (_nonEmpty(row.ssid) || _nonEmpty(row.bssid)) {
        return true;
      }
    }
  }
  return false;
}

ScanSnapshotDto _demoWithNativeContext(
  ScanSnapshotDto native,
  ScanSnapshotDto demoFixture,
) {
  final authorized = native.location == 'granted' || native.locationAuthorized;
  return ScanSnapshotDto(
    snapshotId: demoFixture.snapshotId,
    capturedAt: demoFixture.capturedAt,
    interfaceName: demoFixture.interfaceName,
    countryCode: demoFixture.countryCode,
    scanDurationMs: native.scanDurationMs ?? demoFixture.scanDurationMs,
    stale: demoFixture.stale,
    locationAuthorized: authorized,
    location: native.location,
    networks: demoFixture.networks,
    results: demoFixture.results,
    associated: demoFixture.associated,
    includeHiddenRequested: demoFixture.includeHiddenRequested,
    source: IosScanSourceWire.demo,
    error: native.error ?? demoFixture.error,
    demo: true,
    transportSource:
        demoFixture.transportSource ?? IosScanSourceWire.fixtures,
  );
}

/// Mirrors [IosScanSource] without importing feature barrel into tests.
abstract final class IosScanSourceWire {
  static const connectedNetworkOnly = 'connectedNetworkOnly';
  static const demo = 'demo';
  static const fixtures = 'fixtures';
}

bool _nonEmpty(String? value) {
  if (value == null) return false;
  return value.trim().isNotEmpty;
}
