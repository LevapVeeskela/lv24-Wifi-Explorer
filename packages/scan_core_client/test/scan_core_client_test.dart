import 'package:scan_core_client/scan_core_client.dart';
import 'package:scan_domain/scan_domain.dart';
import 'package:test/test.dart';

void main() {
  group('decodeScanCoreLine', () {
    test('parses hello', () {
      final event = decodeScanCoreLine({
        'type': 'hello',
        'protocolVersion': 1,
        'version': '1.0.0',
        'helper': 'lv24-wifi-scancore',
        'transport': 'stdio',
      });
      expect(event, isA<ScanCoreHello>());
      final hello = event! as ScanCoreHello;
      expect(hello.protocolVersion, 1);
      expect(hello.helper, 'lv24-wifi-scancore');
    });

    test('parses permissions and locationAuthorized', () {
      final a = decodeScanCoreLine({
        'type': 'permissions:status',
        'protocolVersion': 1,
        'payload': {'location': 'granted', 'authorized': true},
      }) as ScanCorePermissionsStatus;
      expect(a.location, LocationAuthorization.granted);
      expect(a.authorized, isTrue);

      final b = decodeScanCoreLine({
        'type': 'locationAuthorized',
        'protocolVersion': 1,
        'payload': {'location': 'denied', 'authorized': false},
      }) as ScanCorePermissionsStatus;
      expect(b.location, LocationAuthorization.denied);
    });

    test('normalizes v1 results into networks', () {
      final event = decodeScanCoreLine({
        'type': 'scan:snapshot',
        'protocolVersion': 1,
        'payload': {
          'snapshotId': 'demo',
          'capturedAt': '2026-09-17T12:00:00.000Z',
          'interfaceName': 'en0',
          'countryCode': null,
          'scanDurationMs': 12,
          'stale': false,
          'locationAuthorized': true,
          'location': 'granted',
          'results': [
            {
              'id': '02:11:24:00:00:01',
              'ssid': 'LV24-Lab-2G',
              'bssid': '02:11:24:00:00:01',
              'rssiDbm': -48,
              'noiseDbm': -92,
              'snrDb': 44,
              'channel': 6,
              'channelWidth': '20MHz',
              'band': '2.4GHz',
              'phyMode': '802.11n',
              'phyModesSupported': ['802.11b', '802.11g', '802.11n'],
              'security': 'WPA2 Personal',
              'securityRaw': ['wpa2Personal'],
              'oui': '02:11:24',
              'hidden': false,
              'lastSeenAt': '2026-09-17T12:00:00.000Z',
              'scanGeneration': 1,
            },
          ],
        },
      }) as ScanCoreSnapshotEvent;

      expect(event.snapshot.networks, hasLength(1));
      expect(event.snapshot.networks.first.ssid, 'LV24-Lab-2G');
      expect(
        event.snapshot.networks.first.channelBand,
        CoreWlanChannelBand.ghz2,
      );

      final observed = ScanDomainMapper.observedNetworksFromSnapshot(
        event.snapshot,
      );
      expect(observed, hasLength(1));
      expect(observed.first.identity.ssid, isA<LocationAvailable<SsidIdentity>>());
      final ssid =
          (observed.first.identity.ssid as LocationAvailable<SsidIdentity>).value;
      expect(ssid.utf8, 'LV24-Lab-2G');
    });
  });

  group('FixtureLoader', () {
    test('loads repo fixtures when available', () {
      final repoRoot = _repoRoot();
      if (repoRoot == null) {
        markTestSkipped('Run tests from lv24-Wifi-Explorer checkout');
      }
      final loader = FixtureLoader();
      final snapshot = loader.loadDemoSnapshot(repoRoot: repoRoot);
      expect(snapshot.networks, isNotEmpty);
      final names = snapshot.networks.map((n) => n.ssid).whereType<String>().toSet();
      expect(
        names.any((s) => s.contains('Meridia') || s.contains('LV24')),
        isTrue,
        reason: 'fixtures must use original Meridia/LV24 names',
      );
    });
  });
}

String? _repoRoot() {
  return FixtureLoader.resolveFixturePath(
    repoRoot: null,
  )?.replaceAll('/resources/fixtures/scan-snapshot.json', '');
}
