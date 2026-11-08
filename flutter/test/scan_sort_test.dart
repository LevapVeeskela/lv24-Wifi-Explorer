import 'package:scan_domain/scan_domain.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_networks.dart';
import 'package:lv24_wifi_explorer/features/scan_sort/scan_sort.dart';

void main() {
  test('default sort is RSSI descending with BSSID tiebreak', () {
    final rows = sortScanRows(
      bundledDemoObservedBss(),
      ScanSortState.defaults,
    );
    for (var i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1].signal.rssiDbm, greaterThanOrEqualTo(rows[i].signal.rssiDbm));
    }
  });

  test('SSID sort is stable and ascending', () {
    final rows = sortScanRows(
      bundledDemoObservedBss(),
      const ScanSortState(field: ScanSortField.ssid, ascending: true),
    );
    final names = rows.map((row) {
      final ssid = row.identity.ssid;
      return ssid is LocationAvailable<SsidIdentity> ? ssid.value.displayName.toLowerCase() : '';
    }).toList();
    final sorted = [...names]..sort();
    expect(names, sorted);
  });
}
