import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/android_scan/android_scan.dart';
import 'package:scan_core_client/scan_core_client.dart';

void main() {
  Map<String, dynamic> flatRow({
    String? ssid = 'Cafe',
    String? bssid = '00:11:22:33:44:55',
    int rssi = -50,
    int channel = 6,
    String band = '2.4GHz',
  }) {
    return {
      'ssid': ssid,
      'bssid': bssid,
      'rssiDbm': rssi,
      'noiseDbm': 0,
      'channelNumber': channel,
      'channelBand': band,
      'channelWidth': '20MHz',
      'supportedSecurity': ['wpa2-personal'],
      'supportedPhyModes': ['n'],
      'ibss': false,
    };
  }

  ScanSnapshotDto parseLive({
    required List<Map<String, dynamic>> networks,
    Map<String, dynamic>? error,
    Map<String, dynamic>? associated,
    bool demo = false,
    String source = 'wifiManagerScanResults',
  }) {
    return parseScanSnapshotPayload({
      'capturedAt': '2026-09-17T20:00:00.000Z',
      'interfaceName': 'wlan0',
      'location': 'granted',
      'locationAuthorized': true,
      'includeHiddenRequested': false,
      'source': source,
      'demo': demo,
      'scanDurationMs': 120,
      'networks': networks,
      'error': ?error,
      'associated': ?associated,
    });
  }

  ScanSnapshotDto demoFixture() {
    return parseScanSnapshotPayload({
      'capturedAt': '2026-09-17T19:00:00.000Z',
      'interfaceName': 'en0',
      'location': 'granted',
      'locationAuthorized': true,
      'includeHiddenRequested': true,
      'source': 'fixtures',
      'demo': true,
      'transportSource': 'fixtures',
      'networks': [
        flatRow(ssid: 'LV24-Lab', bssid: '3c:5a:b4:10:01:01', channel: 36, band: '5GHz'),
      ],
    });
  }

  test('keeps live WifiManager rows and source', () {
    final native = parseLive(networks: [flatRow()]);
    final resolved = resolveAndroidScanSnapshot(native, demoFixture: demoFixture());
    expect(resolved.source, AndroidScanSource.wifiManagerScanResults);
    expect(resolved.demo, isFalse);
    expect(resolved.networks, hasLength(1));
    expect(resolved.networks.single.ssid, 'Cafe');
  });

  test('dedupes same BSSID + channel keeping stronger RSSI', () {
    final native = parseLive(
      networks: [
        flatRow(rssi: -70),
        flatRow(rssi: -40),
        flatRow(bssid: 'aa:bb:cc:dd:ee:ff', channel: 11, rssi: -60),
      ],
    );
    final resolved = resolveAndroidScanSnapshot(native, demoFixture: demoFixture());
    expect(resolved.networks, hasLength(2));
    final cafe = resolved.networks.firstWhere((row) => row.bssid == '00:11:22:33:44:55');
    expect(cafe.rssiDbm, -40);
  });

  test('keeps empty live snapshot when throttled (no demoFallback)', () {
    final native = parseLive(
      networks: const [],
      error: {
        'code': 'SCAN_FAILED',
        'message': 'Scan limited by Android.',
        'recoverable': true,
        'demoFallback': false,
      },
    );
    final resolved = resolveAndroidScanSnapshot(native, demoFixture: demoFixture());
    expect(resolved.source, AndroidScanSource.wifiManagerScanResults);
    expect(resolved.demo, isFalse);
    expect(resolved.networks, isEmpty);
    expect(resolved.error?.code, ScanErrorCode.scanFailed);
    expect(hasLiveWifiManagerRows(native), isFalse);
  });

  test('falls back to fixtures when permission error sets demoFallback', () {
    final native = parseLive(
      networks: const [],
      demo: true,
      source: 'demo',
      error: {
        'code': 'LOCATION_DENIED',
        'message': 'Location permission is required.',
        'recoverable': true,
        'demoFallback': true,
      },
    );
    final resolved = resolveAndroidScanSnapshot(
      native,
      demoFixture: demoFixture(),
    );
    expect(resolved.demo, isTrue);
    expect(resolved.source, AndroidScanSource.demo);
    expect(resolved.transportSource, AndroidScanSource.fixtures);
    expect(resolved.networks.single.ssid, 'LV24-Lab');
    expect(resolved.error?.code, ScanErrorCode.locationDenied);
    expect(resolved.location, 'granted');
  });

  test('associated-only snapshot is live', () {
    final native = parseLive(
      networks: const [],
      associated: {
        'ssid': 'Home',
        'bssid': 'aa:bb:cc:dd:ee:00',
        'rssiDbm': -45,
        'channelNumber': 36,
        'channelBand': '5GHz',
      },
    );
    expect(hasLiveWifiManagerRows(native), isTrue);
    final resolved = resolveAndroidScanSnapshot(native, demoFixture: demoFixture());
    expect(resolved.demo, isFalse);
    expect(resolved.associated?.bssid, 'aa:bb:cc:dd:ee:00');
  });
}
