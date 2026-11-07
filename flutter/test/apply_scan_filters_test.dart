import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_filters/scan_filters.dart';
import 'package:lv24_wifi_explorer/features/scan_search/scan_search.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_networks.dart';
import 'package:scan_domain/scan_domain.dart';

void main() {
  late List<ObservedBss> networks;

  setUp(() {
    networks = bundledDemoObservedBss();
  });

  test('defaults pass through all demo rows', () {
    final out = applyScanFilters(networks, ScanWorkbenchFilters.defaults);
    expect(out.length, networks.length);
  });

  test('band filter keeps only matching GHz', () {
    final ghz24 = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(band: BandFilterValue.ghz24),
    );
    expect(ghz24.map((r) => r.lastRaw.ssid).toList(), ['Sunset-Guest', 'Harbor-IoT']);

    final ghz5 = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(band: BandFilterValue.ghz5),
    );
    expect(ghz5.length, 2);
    expect(ghz5.any((r) => r.lastRaw.ssid == 'LV24-Lab'), isTrue);
    expect(ghz5.any((r) => r.lastRaw.ssid == null), isTrue);

    final ghz6 = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(band: BandFilterValue.ghz6),
    );
    expect(ghz6.single.lastRaw.ssid, 'Studio-6');
  });

  test('security filter open vs secure', () {
    final openOnly = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(security: [SecurityFilterValue.open]),
    );
    expect(openOnly.length, 1);
    expect(openOnly.single.security.isOpen, isTrue);

    final secureOnly = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(security: [SecurityFilterValue.secure]),
    );
    expect(secureOnly.every((r) => !r.security.isOpen), isTrue);
    expect(secureOnly.length, networks.length - 1);
  });

  test('min RSSI excludes weaker signals', () {
    final strong = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(minRssiDbm: -60),
    );
    expect(strong.length, 2);
    expect(strong.every((r) => r.signal.rssiDbm >= -60), isTrue);
  });

  test('search matches SSID substring and bssid: prefix', () {
    final lab = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(searchQuery: 'LV24'),
    );
    expect(lab.length, 1);
    expect(lab.single.lastRaw.ssid, 'LV24-Lab');

    final byMac = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(searchQuery: 'bssid:3c:5a:b4'),
    );
    expect(byMac.length, 1);
    expect(byMac.single.lastRaw.ssid, 'LV24-Lab');
  });

  test('search DSL AND/OR filters the visible BSS list', () {
    final both = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(searchQuery: 'open OR ssid:LV24-Lab'),
    );
    expect(both.map((r) => r.lastRaw.ssid).toSet(), {'LV24-Lab', 'Sunset-Guest'});

    final andQuery = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(searchQuery: 'ssid:LV24 AND 5ghz'),
    );
    expect(andQuery.single.lastRaw.ssid, 'LV24-Lab');
  });

  test('search keyword matches annotation context', () {
    final out = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(searchQuery: 'lab-ap'),
      searchContext: (row) {
        if (row.lastRaw.ssid == 'LV24-Lab') {
          return const ScanSearchMatchContext(annotation: 'lab-ap-01');
        }
        return const ScanSearchMatchContext();
      },
    );
    expect(out.single.lastRaw.ssid, 'LV24-Lab');
  });

  test('search hidden token matches hidden SSID row', () {
    final hidden = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(searchQuery: '<hidden>'),
    );
    expect(hidden.length, 1);
    expect(hidden.single.lastRaw.ssid, isNull);
  });

  test('includeHiddenSsid false drops hidden SSID rows', () {
    final out = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(includeHiddenSsid: false),
    );
    expect(out.length, networks.length - 1);
    expect(out.every((r) => r.lastRaw.ssid != null), isTrue);
  });

  test('includeHiddenSsid true keeps hidden SSID rows', () {
    final out = applyScanFilters(
      networks,
      const ScanWorkbenchFilters(includeHiddenSsid: true),
    );
    expect(out.any((r) => r.lastRaw.ssid == null), isTrue);
  });

  test('hasActiveFilters reflects non-default state', () {
    expect(hasActiveFilters(ScanWorkbenchFilters.defaults), isFalse);
    expect(
      hasActiveFilters(const ScanWorkbenchFilters(band: BandFilterValue.ghz5)),
      isTrue,
    );
    expect(
      hasActiveFilters(const ScanWorkbenchFilters(security: [SecurityFilterValue.open])),
      isTrue,
    );
    expect(
      hasActiveFilters(const ScanWorkbenchFilters(searchQuery: 'x')),
      isTrue,
    );
    expect(
      hasActiveFilters(const ScanWorkbenchFilters(minRssiDbm: -80)),
      isTrue,
    );
  });

  test('bandFilterToGhz maps enum to GHz or null', () {
    expect(bandFilterToGhz(BandFilterValue.all), isNull);
    expect(bandFilterToGhz(BandFilterValue.ghz24), 2.4);
    expect(bandFilterToGhz(BandFilterValue.ghz5), 5);
    expect(bandFilterToGhz(BandFilterValue.ghz6), 6);
  });
}
