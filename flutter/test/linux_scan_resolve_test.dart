import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/linux_scan/linux_scan.dart';
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

  ScanSnapshotDto parseNative({
    required List<Map<String, dynamic>> networks,
    Map<String, dynamic>? error,
    Map<String, dynamic>? associated,
    bool demo = false,
    String source = LinuxScanSource.networkManagerAccessPoints,
  }) {
    return parseScanSnapshotPayload({
      'capturedAt': '2026-09-17T20:00:00.000Z',
      'interfaceName': 'wlan0',
      'location': 'not-applicable',
      'locationAuthorized': true,
      'includeHiddenRequested': false,
      'source': source,
      'demo': demo,
      'scanDurationMs': 80,
      'networks': networks,
      'error': ?error,
      'associated': ?associated,
    });
  }

  ScanSnapshotDto demoFixture() {
    return parseScanSnapshotPayload({
      'capturedAt': '2026-09-17T19:00:00.000Z',
      'interfaceName': 'en0',
      'location': 'not-applicable',
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

  test('keeps NetworkManager access point rows', () {
    final native = parseNative(networks: [flatRow()]);
    final resolved =
        resolveLinuxScanSnapshot(native, demoFixture: demoFixture());
    expect(resolved.source, LinuxScanSource.networkManagerAccessPoints);
    expect(resolved.demo, isFalse);
    expect(resolved.networks.single.ssid, 'Cafe');
  });

  test('keeps connected-only snapshots', () {
    final native = parseNative(
      networks: [flatRow(ssid: 'HomeNet')],
      source: LinuxScanSource.connectedNetworkOnly,
      associated: {'ssid': 'HomeNet', 'bssid': '00:11:22:33:44:55'},
    );
    final resolved =
        resolveLinuxScanSnapshot(native, demoFixture: demoFixture());
    expect(resolved.demo, isFalse);
    expect(resolved.source, LinuxScanSource.connectedNetworkOnly);
  });

  test('demo fallback preserves ActiveConnection SSID on associated link', () {
    final native = parseNative(
      networks: [],
      demo: true,
      source: LinuxScanSource.demo,
      associated: {'ssid': 'Office-WiFi', 'bssid': null},
      error: {
        'code': 'NM_SCAN_LIMITED',
        'message': 'GetAccessPoints unavailable',
        'recoverable': true,
        'demoFallback': true,
      },
    );
    final resolved =
        resolveLinuxScanSnapshot(native, demoFixture: demoFixture());
    expect(resolved.demo, isTrue);
    expect(resolved.source, LinuxScanSource.demo);
    expect(resolved.networks.single.ssid, 'LV24-Lab');
    expect(resolved.associated?.ssid, 'Office-WiFi');
  });
}
