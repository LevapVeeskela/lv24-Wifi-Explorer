import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_organize/organize_by.dart';
import 'package:lv24_wifi_explorer/features/scan_organize/group_scan_rows.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_networks.dart';

void main() {
  test('grouping by SSID preserves rows and first-appearance order', () {
    final rows = bundledDemoObservedBss();
    final groups = groupScanRows(rows, OrganizeByValue.ssid);
    expect(groups.expand((group) => group.rows).length, rows.length);
    expect(groups.map((group) => group.key).toSet().length, groups.length);
  });

  test('none returns a single group', () {
    final rows = bundledDemoObservedBss();
    final groups = groupScanRows(rows, OrganizeByValue.none);
    expect(groups, hasLength(1));
    expect(groups.single.rows.length, rows.length);
  });
}
