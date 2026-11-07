import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/android_scan/android_scan.dart';
import 'package:scan_core_client/scan_core_client.dart';
import 'package:scan_domain/scan_domain.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('coerceMethodChannelMap', () {
    test('deep-converts nested Android maps for the snapshot parser', () {
      final payload = coerceMethodChannelMap(<Object?, Object?>{
        'source': 'wifiManagerScanResults',
        'demo': false,
        'location': 'granted',
        'locationAuthorized': true,
        'capturedAt': '2026-09-17T12:00:00.000Z',
        'includeHiddenRequested': true,
        'suggestedIntervalMs': 30000,
        'throttled': true,
        'networks': <Object?>[
          <Object?, Object?>{
            'ssid': 'LV24-Lab-2G',
            'bssid': '02:11:24:00:00:01',
            'rssiDbm': -48,
            'channelNumber': 6,
            'channelBand': '2.4GHz',
            'channelWidth': '20MHz',
            'supportedSecurity': <Object?>['wpa2-personal'],
            'supportedPhyModes': <Object?>['n'],
            'ibss': false,
          },
        ],
      });

      expect(readSuggestedIntervalMs(payload), 30000);
      expect(readThrottled(payload), isTrue);

      final snapshot = parseScanSnapshotPayload(payload);
      expect(snapshot.source, AndroidScanSource.wifiManagerScanResults);
      expect(snapshot.networks, hasLength(1));
      expect(snapshot.networks.first.ssid, 'LV24-Lab-2G');
      expect(snapshot.networks.first.channelBand, CoreWlanChannelBand.ghz2);

      final observed = ScanDomainMapper.observedNetworksFromSnapshot(snapshot);
      expect(observed, hasLength(1));
      expect(observed.first.identity.ssid, isA<LocationAvailable<SsidIdentity>>());
    });

    test('rejects a non-map payload', () {
      expect(
        () => coerceMethodChannelMap('nope'),
        throwsA(isA<PlatformException>()),
      );
    });
  });

  group('androidScanBackoff', () {
    test('uses the 10s Android floor (slower than ScanCore 3s)', () {
      expect(
        androidScanBackoff(scanDurationMs: 100, throttled: false),
        androidScanMinInterval,
      );
    });

    test('stretches by duration * 1.1 when a scan is slow', () {
      expect(
        androidScanBackoff(scanDurationMs: 20000, throttled: false),
        const Duration(milliseconds: 22000),
      );
    });

    test('throttled scans use at least 30s and grow with failures', () {
      expect(
        androidScanBackoff(scanDurationMs: 100, throttled: true),
        androidScanThrottledMinInterval,
      );
      expect(
        androidScanBackoff(
          scanDurationMs: 100,
          throttled: true,
          consecutiveThrottle: 2,
        ),
        const Duration(seconds: 90),
      );
    });
  });

  group('resolveAndroidScanSnapshot', () {
    test('keeps live WifiManager rows (does not swap in demo fixtures)', () {
      final live = _snapshot(
        source: AndroidScanSourceWire.wifiManagerScanResults,
        demo: false,
        location: 'granted',
        networks: [
          _record(ssid: 'Office', bssid: '02:11:24:00:00:01'),
        ],
        error: const ScanErrorDto(
          code: ScanErrorCode.scanFailed,
          message: 'scan limited by Android',
          recoverable: true,
        ),
      );
      final demo = _snapshot(
        source: AndroidScanSourceWire.demo,
        demo: true,
        location: 'granted',
        networks: [_record(ssid: 'Meridia-Demo', bssid: '02:00:00:00:00:01')],
      );

      final resolved = resolveAndroidScanSnapshot(live, demoFixture: demo);
      expect(resolved.source, AndroidScanSourceWire.wifiManagerScanResults);
      expect(resolved.demo, isFalse);
      expect(resolved.networks.single.ssid, 'Office');
      expect(resolved.error?.message, 'scan limited by Android');
    });

    test('permission-denied empty live snapshots stay live', () {
      final native = _snapshot(
        source: AndroidScanSourceWire.wifiManagerScanResults,
        demo: false,
        location: 'denied',
        locationAuthorized: false,
        networks: const [],
        error: const ScanErrorDto(
          code: ScanErrorCode.locationDenied,
          message: 'Location or Nearby Wi‑Fi permission is required',
          recoverable: true,
          demoFallback: false,
        ),
      );
      final demo = _snapshot(
        source: AndroidScanSourceWire.demo,
        demo: true,
        location: 'granted',
        networks: [_record(ssid: 'Meridia-Demo', bssid: '02:00:00:00:00:01')],
      );

      final resolved = resolveAndroidScanSnapshot(native, demoFixture: demo);
      expect(isAndroidLiveSource(resolved), isTrue);
      expect(resolved.networks, isEmpty);
      expect(resolved.location, 'denied');
    });

    test('demoFallback without WifiManager uses fixtures and native location', () {
      final native = _snapshot(
        source: AndroidScanSourceWire.demo,
        demo: true,
        location: 'denied',
        locationAuthorized: false,
        networks: const [],
        error: const ScanErrorDto(
          code: ScanErrorCode.noInterface,
          message: 'WifiManager is not available on this device.',
          recoverable: true,
          demoFallback: true,
        ),
      );
      final demo = _snapshot(
        source: AndroidScanSourceWire.fixtures,
        demo: true,
        location: 'granted',
        networks: [_record(ssid: 'Meridia-Demo', bssid: '02:00:00:00:00:01')],
      );

      final resolved = resolveAndroidScanSnapshot(native, demoFixture: demo);
      expect(resolved.demo, isTrue);
      expect(resolved.source, AndroidScanSourceWire.demo);
      expect(resolved.location, 'denied');
      expect(resolved.networks.single.ssid, 'Meridia-Demo');
    });
  });

  group('dedupeAndroidNetworkRecords', () {
    test('keeps the stronger RSSI for the same BSSID + channel', () {
      final weaker = _record(
        ssid: 'Office',
        bssid: '02:11:24:00:00:01',
        rssi: -80,
      );
      final stronger = _record(
        ssid: 'Office',
        bssid: '02:11:24:00:00:01',
        rssi: -40,
      );
      final otherChannel = _record(
        ssid: 'Office',
        bssid: '02:11:24:00:00:01',
        rssi: -55,
        channel: 11,
      );
      final deduped = dedupeAndroidNetworkRecords([weaker, stronger, otherChannel]);
      expect(deduped, hasLength(2));
      expect(
        deduped.map((row) => row.rssiDbm).toSet(),
        containsAll(<double>[-40, -55]),
      );
    });
  });

  group('AndroidScanAdapter', () {
    test('maps a live host snapshot without loading fixtures', () async {
      final host = _FakeAndroidHost(
        payload: <String, dynamic>{
          'source': AndroidScanSource.wifiManagerScanResults,
          'demo': false,
          'location': 'granted',
          'locationAuthorized': true,
          'capturedAt': '2026-09-17T12:00:00.000Z',
          'includeHiddenRequested': true,
          'throttled': false,
          'suggestedIntervalMs': 30000,
          'networks': [
            {
              'ssid': 'Office',
              'bssid': '02:11:24:00:00:01',
              'rssiDbm': -48,
              'channelNumber': 6,
              'channelBand': '2.4GHz',
              'channelWidth': '20MHz',
              'supportedSecurity': ['wpa2-personal'],
              'supportedPhyModes': ['n'],
              'ibss': false,
            },
          ],
        },
      );
      final result = await AndroidScanAdapter(host: host).fetchSnapshot();
      expect(result.mode, AndroidScanMode.live);
      expect(result.usedNativeBridge, isTrue);
      expect(result.suggestedInterval, const Duration(seconds: 30));
      expect(result.snapshot.networks.single.ssid, 'Office');
      expect(isAndroidLiveSource(result.snapshot), isTrue);
    });

    test('surfaces SCAN_FAILED as throttled live data', () async {
      final host = _FakeAndroidHost(
        payload: <String, dynamic>{
          'source': AndroidScanSource.wifiManagerScanResults,
          'demo': false,
          'location': 'granted',
          'locationAuthorized': true,
          'capturedAt': '2026-09-17T12:00:00.000Z',
          'includeHiddenRequested': true,
          'throttled': true,
          'stale': true,
          'suggestedIntervalMs': 30000,
          'error': {
            'code': 'SCAN_FAILED',
            'message': 'scan limited by Android',
            'recoverable': true,
            'demoFallback': false,
          },
          'networks': [
            {
              'ssid': 'Office',
              'bssid': '02:11:24:00:00:01',
              'rssiDbm': -48,
              'channelNumber': 6,
              'channelBand': '2.4GHz',
              'channelWidth': '20MHz',
              'supportedSecurity': ['wpa2-personal'],
              'supportedPhyModes': ['n'],
              'ibss': false,
            },
          ],
        },
      );
      final result = await AndroidScanAdapter(host: host).fetchSnapshot();
      expect(result.mode, AndroidScanMode.throttled);
      expect(result.throttled, isTrue);
      expect(result.snapshot.demo, isFalse);
      expect(result.snapshot.error?.code, ScanErrorCode.scanFailed);
      expect(result.snapshot.networks, isNotEmpty);
    });
  });

  group('mergeObservedBssRows (Android presence policy)', () {
    test('stales then drops a BSSID after consecutive misses', () {
      final first = ScanDomainMapper.observedNetworksFromSnapshot(
        _snapshot(
          source: AndroidScanSourceWire.wifiManagerScanResults,
          capturedAt: '2026-09-17T12:00:00.000Z',
          networks: [_record(ssid: 'Office', bssid: '02:11:24:00:00:01')],
        ),
      );
      final missed = mergeObservedBssRows(
        first,
        const [],
        '2026-09-17T12:00:03.000Z',
      );
      expect(missed.single.presence.consecutiveMisses, 1);
      expect(missed.single.presence.presence, Presence.current);

      final stale = mergeObservedBssRows(
        missed,
        const [],
        '2026-09-17T12:00:06.000Z',
      );
      expect(stale.single.presence.presence, Presence.stale);

      final gone = mergeObservedBssRows(
        stale,
        const [],
        '2026-09-17T12:00:09.000Z',
      );
      expect(gone.single.presence.presence, Presence.disappeared);
    });
  });
}

ScanSnapshotDto _snapshot({
  required String source,
  required List<CoreWlanNetworkRecord> networks,
  bool demo = false,
  String location = 'granted',
  bool locationAuthorized = true,
  String capturedAt = '2026-09-17T12:00:00.000Z',
  ScanErrorDto? error,
}) {
  return ScanSnapshotDto(
    capturedAt: capturedAt,
    interfaceName: 'wlan0',
    location: location,
    locationAuthorized: locationAuthorized,
    networks: networks,
    includeHiddenRequested: true,
    source: source,
    demo: demo,
    error: error,
  );
}

class _FakeAndroidHost implements AndroidScanHost {
  _FakeAndroidHost({required this.payload});

  final Map<String, dynamic> payload;

  @override
  bool get isSupported => true;

  @override
  Future<Map<String, dynamic>> getSnapshot() async => payload;

  @override
  Future<String> requestLocationAuthorization() async => 'granted';
}

CoreWlanNetworkRecord _record({
  required String ssid,
  required String bssid,
  double rssi = -50,
  int channel = 6,
}) {
  return CoreWlanNetworkRecord(
    ssid: ssid,
    ssidData: ssid.codeUnits,
    bssid: bssid,
    rssiDbm: rssi,
    noiseDbm: 0,
    channelNumber: channel,
    channelBand: CoreWlanChannelBand.ghz2,
    channelWidth: CoreWlanChannelWidth.mhz20,
    countryCode: null,
    beaconIntervalMs: 100,
    ibss: false,
    informationElementData: null,
    supportedSecurity: const [SecurityKind.wpa2Personal],
    supportedPhyModes: const [PhyLetter.n],
  );
}
