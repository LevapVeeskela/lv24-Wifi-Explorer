import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/android_scan/android_scan.dart';
import 'package:lv24_wifi_explorer/features/scan_session/android_scan_workbench_session.dart';
import 'package:lv24_wifi_explorer/features/scan_session/scan_workbench_session.dart';
import 'package:scan_core_client/scan_core_client.dart';
import 'package:scan_domain/scan_domain.dart';

class _FakeHost implements AndroidScanHost {
  _FakeHost(this.payloads);

  final List<Map<String, dynamic>> payloads;
  int _index = 0;

  @override
  bool get isSupported => true;

  @override
  Future<Map<String, dynamic>> getSnapshot() async {
    final index = _index < payloads.length ? _index : payloads.length - 1;
    _index += 1;
    return payloads[index];
  }

  @override
  Future<String> requestLocationAuthorization() async => 'granted';
}

Map<String, dynamic> _row({
  required String ssid,
  required String bssid,
  int rssi = -50,
  int channel = 6,
}) {
  return {
    'ssid': ssid,
    'bssid': bssid,
    'rssiDbm': rssi,
    'noiseDbm': 0,
    'channelNumber': channel,
    'channelBand': '2.4GHz',
    'channelWidth': '20MHz',
    'supportedSecurity': ['wpa2-personal'],
    'supportedPhyModes': ['n'],
    'ibss': false,
  };
}

Map<String, dynamic> _live({
  required String capturedAt,
  required List<Map<String, dynamic>> networks,
  Map<String, dynamic>? associated,
  Map<String, dynamic>? error,
}) {
  return {
    'capturedAt': capturedAt,
    'interfaceName': 'wlan0',
    'location': 'granted',
    'locationAuthorized': true,
    'includeHiddenRequested': false,
    'source': 'wifiManagerScanResults',
    'demo': false,
    'scanDurationMs': 80,
    'networks': networks,
    'associated': ?associated,
    'error': ?error,
  };
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('createAndroidScanWorkbenchSession returns a workbench session', () {
    final session = createAndroidScanWorkbenchSession();
    expect(session, isA<ScanWorkbenchSession>());
    expect(session, isA<AndroidWorkbenchScanSession>());
    session!.dispose();
  });

  test('live snapshots map to ObservedBss and merge missCount', () async {
    final cafe = _row(ssid: 'Cafe', bssid: '00:11:22:0e:00:01');
    final campus = _row(ssid: 'Campus', bssid: '00:11:22:0e:00:02', channel: 11);
    final host = _FakeHost([
      _live(
        capturedAt: '2026-09-17T20:00:00.000Z',
        networks: [cafe, campus],
        associated: {
          'ssid': 'Campus',
          'bssid': '00:11:22:0e:00:02',
          'rssiDbm': -40,
          'channelNumber': 11,
          'channelBand': '2.4GHz',
        },
      ),
      _live(
        capturedAt: '2026-09-17T20:00:08.000Z',
        networks: [campus],
      ),
      _live(
        capturedAt: '2026-09-17T20:00:16.000Z',
        networks: [campus],
        error: {
          'code': 'SCAN_FAILED',
          'message': 'Scan limited by Android.',
          'recoverable': true,
          'demoFallback': false,
        },
      ),
    ]);

    final session = AndroidWorkbenchScanSession(
      adapter: AndroidScanAdapter(host: host),
      pollInterval: const Duration(days: 1),
    );

    await session.start();
    expect(session.demo, isFalse);
    expect(session.rows, hasLength(2));
    expect(session.connectedBssid, '00:11:22:0e:00:02');
    expect(session.location, LocationAuthorization.granted);
    expect(session.scanCoreError, isFalse);

    await session.refresh();
    expect(session.rows, hasLength(2));
    final missed = session.rows.firstWhere((row) => row.lastRaw.ssid == 'Cafe');
    expect(missed.presence.consecutiveMisses, 1);
    expect(missed.presence.presence, Presence.current);

    await session.refresh();
    final stale = session.rows.firstWhere((row) => row.lastRaw.ssid == 'Cafe');
    expect(stale.presence.consecutiveMisses, 2);
    expect(stale.presence.presence, Presence.stale);
    expect(session.lastError?.code, ScanErrorCode.scanFailed);
    expect(session.scanCoreError, isTrue);
    expect(session.demo, isFalse);

    await session.stop();
    session.dispose();
  });

  test('deep-coerces MethodChannel nested maps for the snapshot parser', () {
    final raw = <Object?, Object?>{
      'capturedAt': '2026-09-17T20:00:00.000Z',
      'networks': <Object?>[
        <Object?, Object?>{
          'ssid': 'Cafe',
          'bssid': '00:11:22:33:44:55',
          'rssiDbm': -50,
          'channelBand': '2.4GHz',
          'supportedSecurity': <Object?>['wpa2-personal'],
        },
      ],
      'error': <Object?, Object?>{
        'code': 'SCAN_FAILED',
        'message': 'Scan limited by Android.',
        'recoverable': true,
        'demoFallback': false,
      },
    };
    final coerced = coerceStringKeyMap(raw);
    expect(coerced['networks'], isA<List<dynamic>>());
    expect((coerced['networks'] as List).first, isA<Map<String, dynamic>>());
    expect(coerced['error'], isA<Map<String, dynamic>>());
    final snapshot = parseScanSnapshotPayload(coerced);
    expect(snapshot.networks, hasLength(1));
    expect(snapshot.error?.code, ScanErrorCode.scanFailed);
  });
}
