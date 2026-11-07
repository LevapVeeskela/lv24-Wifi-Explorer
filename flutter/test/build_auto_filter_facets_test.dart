import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_filters/scan_workbench_filters.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_networks.dart';
import 'package:lv24_wifi_explorer/widgets/filter_sidebar/build_auto_filter_facets.dart';

void main() {
  group('buildAutoFilterFacets', () {
    test('aggregates band, security, and vendor counts from demo rows', () {
      final rows = bundledDemoObservedBss();
      final facets = buildAutoFilterFacets(rows);

      final bandTotal = facets.bands.fold<int>(0, (sum, f) => sum + f.count);
      expect(bandTotal, lessThanOrEqualTo(rows.length));
      expect(facets.bands.map((f) => f.id), contains(BandFilterValue.ghz24));
      expect(facets.bands.map((f) => f.id), contains(BandFilterValue.ghz5));
      expect(facets.bands.map((f) => f.id), contains(BandFilterValue.ghz6));

      final securityTotal =
          facets.security.fold<int>(0, (sum, f) => sum + f.count);
      expect(securityTotal, rows.length);
      expect(
        facets.security.map((f) => f.id),
        containsAll([SecurityFilterValue.open, SecurityFilterValue.secure]),
      );

      expect(facets.vendors, isNotEmpty);
      final vendorTotal =
          facets.vendors.fold<int>(0, (sum, f) => sum + f.count);
      expect(vendorTotal, lessThanOrEqualTo(rows.length));
    });
  });

  group('vendorQueryMatchesLabel', () {
    test('matches case-insensitively', () {
      expect(vendorQueryMatchesLabel('Acme Corp', 'Acme Corp'), isTrue);
      expect(vendorQueryMatchesLabel('acme corp', 'Acme Corp'), isTrue);
      expect(vendorQueryMatchesLabel('other', 'Acme Corp'), isFalse);
    });
  });
}
