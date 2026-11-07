import 'package:scan_core_client/scan_core_client.dart';

import 'android_scan_dedupe.dart';

/// Chooses live `WifiManager` snapshots vs bundled demo fixtures.
///
/// Live permission / throttle errors stay live (`source: wifiManagerScanResults`)
/// so the UI does not pretend Meridia fixtures were scanned on device.
ScanSnapshotDto resolveAndroidScanSnapshot(
  ScanSnapshotDto native, {
  required ScanSnapshotDto demoFixture,
}) {
  final deduped = _withDedupedNetworks(native);
  if (deduped.source == AndroidScanSourceWire.wifiManagerScanResults &&
      !deduped.demo) {
    return deduped;
  }

  if (hasLiveWifiManagerRows(deduped) && !deduped.demo) {
    return deduped;
  }

  if (deduped.demo ||
      deduped.source == AndroidScanSourceWire.demo ||
      deduped.error?.demoFallback == true) {
    return _demoWithNativeContext(deduped, demoFixture);
  }

  return deduped;
}

/// Visible for tests in this library.
bool hasLiveWifiManagerRows(ScanSnapshotDto snapshot) {
  if (snapshot.networks.isNotEmpty) return true;
  final associated = snapshot.associated;
  return _nonEmpty(associated?.ssid) || _nonEmpty(associated?.bssid);
}

bool isAndroidLiveSource(ScanSnapshotDto snapshot) {
  return snapshot.source == AndroidScanSourceWire.wifiManagerScanResults &&
      !snapshot.demo;
}

ScanSnapshotDto _withDedupedNetworks(ScanSnapshotDto native) {
  if (native.networks.length < 2) return native;
  final deduped = dedupeAndroidNetworkRecords(native.networks);
  if (deduped.length == native.networks.length) return native;
  return ScanSnapshotDto(
    snapshotId: native.snapshotId,
    capturedAt: native.capturedAt,
    interfaceName: native.interfaceName,
    countryCode: native.countryCode,
    scanDurationMs: native.scanDurationMs,
    stale: native.stale,
    locationAuthorized: native.locationAuthorized,
    location: native.location,
    networks: deduped,
    results: native.results,
    associated: native.associated,
    includeHiddenRequested: native.includeHiddenRequested,
    source: native.source,
    error: native.error,
    demo: native.demo,
    transportSource: native.transportSource,
  );
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
    source: AndroidScanSourceWire.demo,
    error: native.error ?? demoFixture.error,
    demo: true,
    transportSource:
        demoFixture.transportSource ?? AndroidScanSourceWire.fixtures,
  );
}

/// Mirrors [AndroidScanSource] without importing the feature barrel into tests.
abstract final class AndroidScanSourceWire {
  static const wifiManagerScanResults = 'wifiManagerScanResults';
  static const demo = 'demo';
  static const fixtures = 'fixtures';
}

bool _nonEmpty(String? value) {
  if (value == null) return false;
  return value.trim().isNotEmpty;
}
