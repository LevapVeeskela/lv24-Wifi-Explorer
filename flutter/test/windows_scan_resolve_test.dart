import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/windows_scan/windows_scan.dart';
import 'package:scan_core_client/scan_core_client.dart';

void main() {
  Map<String, dynamic> flatRow({
    String? ssid = 'Cafe',
    String? bssid = '00:11:22:33:44:55',
    int rssi = -50,
    int? channel,
    String band = 'unknown',
  }) {
    return {
      'ssid': ssid,
      'bssid': bssid,
      'rssiDbm': rssi,
      'noiseDbm': 0,
      'channelNumber': ?channel,
      'channelBand': band,
      'channelWidth': 'unknown',
      'supportedSecurity': ['wpa2-personal'],
      'supportedPhyModes': ['n'],
      'ibss': false,
    };
  }

  ScanSnapshotDto parseNative({
    required List<Map<String, dynamic>> networks,
    Map<String, dynamic>? error,
    Map<String, dynamic>? associated,
    bool demo = false,
    String source = WindowsScanSource.connectedNetworkOnly,
  }) {
    return parseScanSnapshotPayload({
      'capturedAt': '2026-09-17T20:00:00.000Z',
      'interfaceName': 'Wi-Fi',
      'location': 'granted',
      'locationAuthorized': true,
      'includeHiddenRequested': false,
      'source': source,
      'demo': demo,
      'scanDurationMs': 12,
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
        flatRow(
          ssid: 'LV24-Lab',
          bssid: '3c:5a:b4:10:01:01',
          channel: 36,
          band: '5GHz',
        ),
      ],
    });
  }

  test('keeps connected-only snapshots with associated identity', () {
    final native = parseNative(
      networks: [flatRow(ssid: 'HomeNet')],
      associated: {
        'ssid': 'HomeNet',
        'bssid': '00:11:22:33:44:55',
        'rssiDbm': -55,
      },
    );
    final resolved =
        resolveWindowsScanSnapshot(native, demoFixture: demoFixture());
    expect(resolved.demo, isFalse);
    expect(resolved.source, WindowsScanSource.connectedNetworkOnly);
    expect(resolved.networks.single.ssid, 'HomeNet');
    expect(hasWindowsConnectedNetworkIdentity(native), isTrue);
  });

  test('SSID-only available-network source is not treated as a BSS survey', () {
    final native = parseNative(
      networks: [
        flatRow(ssid: 'Visible-SSID', bssid: null),
        flatRow(ssid: 'Other', bssid: null),
      ],
      source: 'wlanAvailableNetworkList',
    );
    expect(hasWindowsConnectedNetworkIdentity(native), isFalse);
    final resolved =
        resolveWindowsScanSnapshot(native, demoFixture: demoFixture());
    expect(resolved.demo, isTrue);
    expect(resolved.source, WindowsScanSource.demo);
    expect(resolved.networks.single.ssid, 'LV24-Lab');
  });

  test('demoFallback preserves associated SSID from Native Wifi', () {
    final native = parseNative(
      networks: const [],
      demo: true,
      source: WindowsScanSource.demo,
      associated: {'ssid': 'Office-WiFi', 'bssid': null},
      error: {
        'code': 'WIFI_OFF',
        'message':
            'No association. WlanGetAvailableNetworkList has no BSSID/channel.',
        'recoverable': true,
        'demoFallback': true,
      },
    );
    final resolved =
        resolveWindowsScanSnapshot(native, demoFixture: demoFixture());
    expect(resolved.demo, isTrue);
    expect(resolved.source, WindowsScanSource.demo);
    expect(resolved.transportSource, WindowsScanSource.fixtures);
    expect(resolved.networks.single.ssid, 'LV24-Lab');
    expect(resolved.associated?.ssid, 'Office-WiFi');
    expect(resolved.error?.code, ScanErrorCode.wifiOff);
  });

  test('empty connected-only snapshot without identity uses fixtures', () {
    final native = parseNative(networks: const []);
    expect(hasWindowsConnectedNetworkIdentity(native), isFalse);
    final resolved =
        resolveWindowsScanSnapshot(native, demoFixture: demoFixture());
    expect(resolved.demo, isTrue);
    expect(resolved.networks.single.ssid, 'LV24-Lab');
  });
}
