import 'package:scan_domain/scan_domain.dart';

import '../scan_session/bss_display.dart';
import 'scan_sort_state.dart';

/// Issue count per row (precomputed by the caller to avoid O(n² log n)).
typedef ScanIssueCount = int Function(ObservedBss row);

/// Deterministic BSSID key used as the stable tiebreak for every sort.
String bssidSortKey(ObservedBss row) {
  final gated = row.identity.bssid;
  if (gated is LocationAvailable<Bssid>) {
    return normalizeBssid(gated.value) ?? gated.value.toLowerCase();
  }
  return rowKey(row);
}

String _ssidSortKey(ObservedBss row) {
  final gated = row.identity.ssid;
  if (gated is LocationAvailable<SsidIdentity>) {
    if (gated.value.hidden) return '';
    return gated.value.displayName.toLowerCase();
  }
  return '';
}

int _bandOrder(WifiBand? band) {
  return switch (band) {
    WifiBand.ghz24 => 0,
    WifiBand.ghz5 => 1,
    WifiBand.ghz6 => 2,
    null => -1,
  };
}

int compareScanRows(
  ObservedBss a,
  ObservedBss b,
  ScanSortState sort, {
  ScanIssueCount? issueCountFor,
}) {
  final primary = switch (sort.field) {
    ScanSortField.ssid => _ssidSortKey(a).compareTo(_ssidSortKey(b)),
    ScanSortField.bssid => bssidSortKey(a).compareTo(bssidSortKey(b)),
    ScanSortField.rssi => a.signal.rssiDbm.compareTo(b.signal.rssiDbm),
    ScanSortField.channel => a.channel.number.compareTo(b.channel.number),
    ScanSortField.band => _bandOrder(a.channel.band)
        .compareTo(_bandOrder(b.channel.band)),
    ScanSortField.vendor => (a.vendor.organization ?? '')
        .toLowerCase()
        .compareTo((b.vendor.organization ?? '').toLowerCase()),
    ScanSortField.security => displaySecurity(a.security.primary)
        .compareTo(displaySecurity(b.security.primary)),
    ScanSortField.issues => (issueCountFor?.call(a) ?? 0)
        .compareTo(issueCountFor?.call(b) ?? 0),
  };
  if (primary != 0) return sort.ascending ? primary : -primary;
  // Stable tiebreak: always ascending BSSID (row key for redacted rows).
  return bssidSortKey(a).compareTo(bssidSortKey(b));
}

List<ObservedBss> sortScanRows(
  List<ObservedBss> rows,
  ScanSortState sort, {
  ScanIssueCount? issueCountFor,
}) {
  final out = List<ObservedBss>.of(rows);
  out.sort(
    (a, b) => compareScanRows(a, b, sort, issueCountFor: issueCountFor),
  );
  return out;
}
