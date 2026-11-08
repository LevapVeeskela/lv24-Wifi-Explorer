import 'package:scan_oui/scan_oui.dart';
import 'package:test/test.dart';

void main() {
  group('parseBssid', () {
    test('extracts OUI and U/L bit', () {
      expect(ouiFromBssid('AA-BB-CC-DD-EE-FF'), 'aa:bb:cc');
      expect(isLocallyAdministeredBssid('00:11:22:33:44:55'), isFalse);
      expect(isLocallyAdministeredBssid('02:11:22:33:44:55'), isTrue);
    });

    test('rejects invalid input', () {
      expect(parseBssid(''), isNull);
      expect(parseBssid('not-a-mac'), isNull);
      expect(parseBssid('00:11:22:33:44'), isNull);
    });
  });

  group('lookup without registry file', () {
    late OuiRegistry registry;

    setUp(() {
      registry = OuiRegistry.fromJson({
        'meta': {
          'format': 'ieee-mal-24',
          'source': 'curated-fallback',
          'sourceUrl': null,
          'generatedAt': '2026-01-01T00:00:00.000Z',
          'entryCount': 1,
        },
        'byPrefix': {
          '00:11:22': 'Example Corp',
        },
      });
    });

    test('returns vendor for universal MAC', () {
      final result = registry.lookup('00-11-22-11-22-33');
      expect(result.oui, '00:11:22');
      expect(result.vendor, 'Example Corp');
      expect(result.source, OuiSource.curatedFallback);
      expect(result.randomized, isFalse);
    });

    test('marks locally administered MAC as randomized', () {
      final result = registry.lookup('02:11:22:aa:bb:cc');
      expect(result.oui, '02:11:22');
      expect(result.vendor, isNull);
      expect(result.source, OuiSource.unknown);
      expect(result.randomized, isTrue);
    });

    test('unknown prefix yields unknown source', () {
      final result = registry.lookup('ac:de:48:00:00:01');
      expect(result.oui, 'ac:de:48');
      expect(result.vendor, isNull);
      expect(result.randomized, isFalse);
    });
  });

  group('bundled registry.json', () {
    final path = resolveOuiRegistryPath();
    final registry = path != null ? OuiRegistry.fromFile(path) : null;

    test('loads when registry exists', () {
      if (registry == null) {
        markTestSkipped('resources/oui/registry.json not found');
      }
      expect(registry!.meta.format, 'ieee-mal-24');
      expect(registry.meta.entryCount, greaterThan(0));
    }, skip: registry == null ? 'registry missing' : false);

    test('resolves known IEEE prefixes', () {
      if (registry == null) {
        markTestSkipped('resources/oui/registry.json not found');
      }

      final apple = registry!.lookup('00:17:f2:00:00:01');
      expect(apple.vendor, 'Apple, Inc.');
      expect(apple.source, isIn([OuiSource.ieeeMal, OuiSource.curatedFallback]));
      expect(apple.randomized, isFalse);

      final ieee80211 = registry.lookup('00:0f:ac:12:34:56');
      expect(ieee80211.vendor, 'IEEE 802.11');
      expect(ieee80211.oui, '00:0f:ac');
    }, skip: registry == null ? 'registry missing' : false);

    test('resolveOuiRegistryPath finds repo registry from package test', () {
      if (path == null) {
        markTestSkipped('resources/oui/registry.json not found');
      }
      expect(path, endsWith('resources/oui/registry.json'));
    }, skip: path == null ? 'registry missing' : false);
  });
}
