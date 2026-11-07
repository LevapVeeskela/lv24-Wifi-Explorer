import 'package:scan_core_client/scan_core_client.dart';

import 'android_scan_channel.dart';
import 'android_scan_dedupe.dart';
import 'android_scan_payload.dart';
import 'android_scan_resolve.dart';
import 'android_scan_throttle.dart';

/// Fetches Android `WifiManager` snapshots; fixtures only when the native
/// bridge is missing or explicitly marks `demoFallback`.
class AndroidScanAdapter {
  AndroidScanAdapter({
    AndroidScanHost? host,
    AndroidScanChannel? channel,
    FixtureLoader? fixtureLoader,
    String? repoRoot,
  })  : _host = host ?? channel ?? AndroidScanChannel(),
        _fixtureLoader = fixtureLoader ?? FixtureLoader(),
        _repoRoot = repoRoot;

  final AndroidScanHost _host;
  final FixtureLoader _fixtureLoader;
  final String? _repoRoot;
  int _consecutiveThrottle = 0;

  bool get isSupported => _host.isSupported;

  Future<String> requestLocationAuthorization() {
    return _host.requestLocationAuthorization();
  }

  Future<AndroidScanFetchResult> fetchSnapshot() async {
    if (!isSupported) {
      return AndroidScanFetchResult(
        snapshot: _loadDemoFixture(),
        mode: AndroidScanMode.demo,
        usedNativeBridge: false,
        suggestedInterval: androidScanMinInterval,
      );
    }

    try {
      final payload = await _host.getSnapshot();
      final native = _dedupeSnapshot(parseScanSnapshotPayload(payload));
      final throttled = readThrottled(payload) ||
          native.error?.code == ScanErrorCode.scanFailed;
      if (throttled) {
        _consecutiveThrottle += 1;
      } else if (isAndroidLiveSource(native)) {
        _consecutiveThrottle = 0;
      }
      final resolved = isAndroidLiveSource(native)
          ? native
          : resolveAndroidScanSnapshot(
              native,
              demoFixture: _loadDemoFixture(),
            );
      final mode = _modeFor(resolved, native, throttled: throttled);
      final suggested = _intervalFor(
        payload: payload,
        snapshot: resolved,
        throttled: throttled,
      );
      return AndroidScanFetchResult(
        snapshot: resolved,
        mode: mode,
        usedNativeBridge: true,
        native: native,
        suggestedInterval: suggested,
        throttled: throttled,
      );
    } catch (_) {
      return AndroidScanFetchResult(
        snapshot: _loadDemoFixture(),
        mode: AndroidScanMode.demo,
        usedNativeBridge: false,
        suggestedInterval: androidScanMinInterval,
      );
    }
  }

  ScanSnapshotDto _loadDemoFixture() {
    return _fixtureLoader.loadDemoSnapshot(repoRoot: _repoRoot);
  }

  ScanSnapshotDto _dedupeSnapshot(ScanSnapshotDto snapshot) {
    final networks = dedupeAndroidNetworkRecords(snapshot.networks);
    if (networks.length == snapshot.networks.length) return snapshot;
    return ScanSnapshotDto(
      snapshotId: snapshot.snapshotId,
      capturedAt: snapshot.capturedAt,
      interfaceName: snapshot.interfaceName,
      countryCode: snapshot.countryCode,
      scanDurationMs: snapshot.scanDurationMs,
      stale: snapshot.stale,
      locationAuthorized: snapshot.locationAuthorized,
      location: snapshot.location,
      networks: networks,
      results: snapshot.results,
      associated: snapshot.associated,
      includeHiddenRequested: snapshot.includeHiddenRequested,
      source: snapshot.source,
      error: snapshot.error,
      demo: snapshot.demo,
      transportSource: snapshot.transportSource,
    );
  }

  AndroidScanMode _modeFor(
    ScanSnapshotDto resolved,
    ScanSnapshotDto native, {
    required bool throttled,
  }) {
    if (resolved.demo ||
        resolved.transportSource == AndroidScanSourceWire.fixtures) {
      return AndroidScanMode.demo;
    }
    if (throttled || native.stale && native.error?.code == ScanErrorCode.scanFailed) {
      return AndroidScanMode.throttled;
    }
    if (isAndroidLiveSource(resolved)) {
      return AndroidScanMode.live;
    }
    return AndroidScanMode.demo;
  }

  Duration _intervalFor({
    required Map<String, dynamic> payload,
    required ScanSnapshotDto snapshot,
    required bool throttled,
  }) {
    final suggestedMs = readSuggestedIntervalMs(payload);
    if (suggestedMs != null && suggestedMs > 0) {
      return Duration(milliseconds: suggestedMs);
    }
    return androidScanBackoff(
      scanDurationMs: snapshot.scanDurationMs,
      throttled: throttled,
      consecutiveThrottle: _consecutiveThrottle,
    );
  }
}

enum AndroidScanMode { live, throttled, demo }

class AndroidScanFetchResult {
  const AndroidScanFetchResult({
    required this.snapshot,
    required this.mode,
    required this.usedNativeBridge,
    this.native,
    this.suggestedInterval,
    this.throttled = false,
  });

  final ScanSnapshotDto snapshot;
  final AndroidScanMode mode;
  final bool usedNativeBridge;
  final ScanSnapshotDto? native;
  final Duration? suggestedInterval;
  final bool throttled;
}
