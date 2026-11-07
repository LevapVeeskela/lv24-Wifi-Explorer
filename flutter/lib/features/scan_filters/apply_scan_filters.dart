import 'package:scan_domain/scan_domain.dart';

import '../scan_search/scan_search.dart';
import 'scan_workbench_filters.dart';
import 'ssid_hidden_from_bss.dart';

typedef ScanSearchContextForRow = ScanSearchMatchContext Function(
  ObservedBss row,
);

List<ObservedBss> applyScanFilters(
  List<ObservedBss> rows,
  ScanWorkbenchFilters filters, {
  ScanSearchContextForRow? searchContext,
}) {
  final bandGhz = bandFilterToGhz(filters.band);
  final vendorQ = filters.vendorQuery.trim().toLowerCase();
  final searchQ = filters.searchQuery.trim();

  return rows.where((row) {
    if (!filters.includeHiddenSsid && ssidHiddenFromBss(row)) {
      return false;
    }
    if (bandGhz != null && _bandGhz(row.channel.band) != bandGhz) {
      return false;
    }
    if (!_matchesSecurity(row, filters.security)) return false;
    if (filters.minRssiDbm != null &&
        row.signal.rssiDbm < filters.minRssiDbm!) {
      return false;
    }
    if (vendorQ.isNotEmpty) {
      final org = row.vendor.organization ?? '';
      if (!org.toLowerCase().contains(vendorQ)) return false;
    }
    if (searchQ.isNotEmpty &&
        !matchesScanSearch(
          row,
          searchQ,
          context:
              searchContext?.call(row) ?? const ScanSearchMatchContext(),
        )) {
      return false;
    }
    return true;
  }).toList(growable: false);
}

double? _bandGhz(WifiBand? band) {
  return switch (band) {
    WifiBand.ghz24 => 2.4,
    WifiBand.ghz5 => 5,
    WifiBand.ghz6 => 6,
    null => null,
  };
}

bool _matchesSecurity(
  ObservedBss row,
  List<SecurityFilterValue> security,
) {
  if (security.length != 1) return true;
  if (security.first == SecurityFilterValue.open) {
    return row.security.isOpen;
  }
  return !row.security.isOpen;
}
