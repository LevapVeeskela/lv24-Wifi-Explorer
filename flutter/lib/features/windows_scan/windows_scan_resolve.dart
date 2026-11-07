import 'package:scan_core_client/scan_core_client.dart';

/// Chooses the associated-link snapshot vs bundled demo fixtures.
///
/// `WlanGetAvailableNetworkList` cannot populate BSS rows (no BSSID/channel/IEs).
/// Live data is **connected-network-only**; everything else is demo.
ScanSnapshotDto resolveWindowsScanSnapshot(
  ScanSnapshotDto native, {
  required ScanSnapshotDto demoFixture,
}) {
  if (native.demo ||
      native.source == WindowsScanSourceWire.demo ||
      native.error?.demoFallback == true) {
    return _demoWithNativeContext(native, demoFixture);
  }

  if (hasWindowsConnectedNetworkIdentity(native)) {
    return native;
  }

  return _demoWithNativeContext(native, demoFixture);
}

/// Visible for tests in this library.
bool hasWindowsConnectedNetworkIdentity(ScanSnapshotDto snapshot) {
  if (snapshot.demo) return false;
  if (snapshot.source != WindowsScanSourceWire.connectedNetworkOnly) {
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
  final authorized = native.location == 'granted' || native.locationAuthorized;
  final associated = _associatedForDemoFallback(native, demoFixture);
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
    associated: associated,
    includeHiddenRequested: demoFixture.includeHiddenRequested,
    source: WindowsScanSourceWire.demo,
    error: native.error ?? demoFixture.error,
    demo: true,
    transportSource:
        demoFixture.transportSource ?? WindowsScanSourceWire.fixtures,
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

/// Mirrors [WindowsScanSource] without importing the feature barrel into tests.
abstract final class WindowsScanSourceWire {
  static const connectedNetworkOnly = 'connectedNetworkOnly';
  static const demo = 'demo';
  static const fixtures = 'fixtures';
}

bool _nonEmpty(String? value) {
  if (value == null) return false;
  return value.trim().isNotEmpty;
}
