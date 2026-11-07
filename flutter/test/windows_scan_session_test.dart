import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_degradation/scan_degradation.dart';
import 'package:lv24_wifi_explorer/features/scan_session/scan_workbench_session.dart';
import 'package:lv24_wifi_explorer/features/scan_session/windows_scan_workbench_session.dart';
import 'package:lv24_wifi_explorer/features/windows_scan/windows_scan.dart';
import 'package:lv24_wifi_explorer/pages/scan_workbench/scan_degradation_resolve.dart';
import 'package:scan_core_client/scan_core_client.dart';
import 'package:scan_domain/scan_domain.dart';

class _FakeHost implements WindowsScanHost {
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
}) {
  return {
    'ssid': ssid,
    'bssid': bssid,
    'rssiDbm': rssi,
    'noiseDbm': 0,
    'channelBand': 'unknown',
    'channelWidth': 'unknown',
    'supportedSecurity': ['wpa2-personal'],
    'supportedPhyModes': ['n'],
    'ibss': false,
  };
}

Map<String, dynamic> _connected({
  required String capturedAt,
  required List<Map<String, dynamic>> networks,
  Map<String, dynamic>? associated,
  Map<String, dynamic>? error,
}) {
  return {
    'capturedAt': capturedAt,
    'interfaceName': 'Wi-Fi',
    'location': 'granted',
    'locationAuthorized': true,
    'includeHiddenRequested': false,
    'source': 'connectedNetworkOnly',
    'demo': false,
    'scanDurationMs': 8,
    'networks': networks,
    'associated': ?associated,
    'error': ?error,
  };
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('createWindowsScanWorkbenchSession returns a workbench session', () {
    final session = createWindowsScanWorkbenchSession();
    expect(session, isA<ScanWorkbenchSession>());
    expect(session, isA<WindowsWorkbenchScanSession>());
    session!.dispose();
  });

  test('connected snapshots map to ObservedBss and keep associated BSSID',
      () async {
    final host = _FakeHost([
      _connected(
        capturedAt: '2026-09-17T20:00:00.000Z',
        networks: [_row(ssid: 'HomeNet', bssid: 'aa:bb:cc:dd:ee:01')],
        associated: {
          'ssid': 'HomeNet',
          'bssid': 'aa:bb:cc:dd:ee:01',
          'rssiDbm': -48,
        },
      ),
    ]);

    final session = WindowsWorkbenchScanSession(
      adapter: WindowsScanAdapter(host: host),
      pollInterval: const Duration(days: 1),
    );

    await session.start();
    expect(session.demo, isFalse);
    expect(session.mode, WindowsScanMode.connectedOnly);
    expect(session.rows, hasLength(1));
    expect(session.connectedBssid, 'aa:bb:cc:dd:ee:01');
    expect(session.location, LocationAuthorization.granted);
    expect(session.scanCoreError, isFalse);
    expect(session.rows.single.lastRaw.ssid, 'HomeNet');
    expect(
      scanDegradationForWorkbench(session: session, viewingSnapshot: false),
      ScanDegradation.windowsConnectedOnly,
    );

    await session.stop();
    session.dispose();
  });

  test('demoFallback native payload resolves to demo fixtures', () async {
    final host = _FakeHost([
      {
        'capturedAt': '2026-09-17T20:00:00.000Z',
        'interfaceName': 'Wi-Fi',
        'location': 'not-determined',
        'locationAuthorized': false,
        'includeHiddenRequested': false,
        'source': 'demo',
        'demo': true,
        'scanDurationMs': 4,
        'networks': <Map<String, dynamic>>[],
        'error': {
          'code': 'WIFI_OFF',
          'message': 'No Wi-Fi association detected.',
          'recoverable': true,
          'demoFallback': true,
        },
      },
    ]);

    final session = WindowsWorkbenchScanSession(
      adapter: WindowsScanAdapter(host: host),
      pollInterval: const Duration(days: 1),
    );

    await session.start();
    expect(session.demo, isTrue);
    expect(session.mode, WindowsScanMode.demo);
    expect(session.rows, isNotEmpty);
    expect(session.lastError?.code, ScanErrorCode.wifiOff);
    expect(session.scanCoreError, isFalse);
    expect(
      scanDegradationForWorkbench(session: session, viewingSnapshot: false),
      ScanDegradation.demoFallback,
    );

    await session.stop();
    session.dispose();
  });
}
