import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_issues/compute_issue_keys.dart';
import 'package:lv24_wifi_explorer/features/scan_issues/from_observed_bss.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_networks.dart';

void main() {
  test('issue keys use scan.issue.* message ids', () {
    final networks = bundledDemoObservedBss();
    for (final row in networks) {
      for (final key in computeIssueKeys(row, networks)) {
        expect(key, startsWith('scan.issue.'));
      }
    }
  });

  test('open demo network includes weakSecurity', () {
    final networks = bundledDemoObservedBss();
    final guest = networks.firstWhere((n) => n.lastRaw.ssid == 'Sunset-Guest');
    expect(computeIssueKeys(guest, networks), contains('scan.issue.weakSecurity'));
  });

  test('weak RSSI demo row includes lowSignal', () {
    final networks = bundledDemoObservedBss();
    final harbor = networks.firstWhere((n) => n.lastRaw.ssid == 'Harbor-IoT');
    expect(computeIssueKeys(harbor, networks), contains('scan.issue.lowSignal'));
  });

  test('hidden SSID demo row includes hiddenSsid', () {
    final networks = bundledDemoObservedBss();
    final hidden = networks.firstWhere((n) => n.lastRaw.ssid == null);
    final keys = computeIssueKeys(hidden, networks);
    expect(keys, contains('scan.issue.hiddenSsid'));
    expect(keys, contains('scan.issue.lowSignal'));
  });

  test('scanIssueBssFromObserved maps hidden flag from identity', () {
    final networks = bundledDemoObservedBss();
    final hidden = networks.firstWhere((n) => n.lastRaw.ssid == null);
    final mapped = scanIssueBssFromObserved(hidden);
    expect(mapped.hiddenSsid, isTrue);

    final lab = networks.firstWhere((n) => n.lastRaw.ssid == 'LV24-Lab');
    expect(scanIssueBssFromObserved(lab).hiddenSsid, isFalse);
  });
}
