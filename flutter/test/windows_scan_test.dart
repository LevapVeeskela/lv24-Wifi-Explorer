import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/windows_scan/windows_scan.dart';
import 'package:scan_core_client/scan_core_client.dart';
import 'package:scan_domain/scan_domain.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('deep-converts nested Standard codec maps for the snapshot parser', () {
    final payload = coerceWindowsScanPayload(<Object?, Object?>{
      'source': 'connectedNetworkOnly',
      'demo': false,
      'location': 'granted',
      'locationAuthorized': true,
      'capturedAt': '2026-09-17T12:00:00.000Z',
      'includeHiddenRequested': false,
      'networks': <Object?>[
        <Object?, Object?>{
          'ssid': 'HomeNet',
          'bssid': '02:11:24:00:00:01',
          'rssiDbm': -52,
          'channelBand': 'unknown',
          'supportedSecurity': <Object?>['wpa2-personal'],
        },
      ],
      'associated': <Object?, Object?>{
        'ssid': 'HomeNet',
        'bssid': '02:11:24:00:00:01',
        'rssiDbm': -52,
      },
      'error': <Object?, Object?>{
        'code': 'BSSID_UNAVAILABLE',
        'message': 'BSSID redacted.',
        'recoverable': true,
        'demoFallback': false,
      },
    });

    final snapshot = parseScanSnapshotPayload(payload);
    expect(snapshot.source, WindowsScanSource.connectedNetworkOnly);
    expect(snapshot.networks, hasLength(1));
    expect(snapshot.networks.first.ssid, 'HomeNet');
    expect(snapshot.associated?.bssid, '02:11:24:00:00:01');
    expect(snapshot.error?.code, ScanErrorCode.bssidUnavailable);

    final observed = ScanDomainMapper.observedNetworksFromSnapshot(snapshot);
    expect(observed, hasLength(1));
    expect(
      observed.first.identity.ssid,
      isA<LocationAvailable<SsidIdentity>>(),
    );
  });

  test('rejects a non-map payload', () {
    expect(
      () => coerceWindowsScanPayload('nope'),
      throwsA(isA<PlatformException>()),
    );
  });
}
