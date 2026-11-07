enum BandFilterValue { all, ghz24, ghz5, ghz6 }

enum SecurityFilterValue { open, secure }

class ScanWorkbenchFilters {
  const ScanWorkbenchFilters({
    this.band = BandFilterValue.all,
    this.security = const [],
    this.searchQuery = '',
    this.vendorQuery = '',
    this.minRssiDbm,
    this.includeHiddenSsid = true,
  });

  final BandFilterValue band;
  final List<SecurityFilterValue> security;
  final String searchQuery;
  final String vendorQuery;
  final int? minRssiDbm;

  /// When false, omit hidden SSID rows (same as scan settings).
  final bool includeHiddenSsid;

  static const defaults = ScanWorkbenchFilters();

  ScanWorkbenchFilters copyWith({
    BandFilterValue? band,
    List<SecurityFilterValue>? security,
    String? searchQuery,
    String? vendorQuery,
    int? minRssiDbm,
    bool? includeHiddenSsid,
    bool clearMinRssi = false,
  }) {
    return ScanWorkbenchFilters(
      band: band ?? this.band,
      security: security ?? this.security,
      searchQuery: searchQuery ?? this.searchQuery,
      vendorQuery: vendorQuery ?? this.vendorQuery,
      minRssiDbm: clearMinRssi ? null : (minRssiDbm ?? this.minRssiDbm),
      includeHiddenSsid: includeHiddenSsid ?? this.includeHiddenSsid,
    );
  }
}

/// AppBar writes [ScanWorkbenchFilters.searchQuery] after this delay.
const searchDebounceMs = 150;

/// Min RSSI slider range (matches web ScanAppBar).
const minRssiSliderMinDbm = -95;
const minRssiSliderMaxDbm = -40;

int minRssiSliderValue(int? minRssiDbm) =>
    minRssiDbm ?? minRssiSliderMinDbm;

/// Values at or below [minRssiSliderMinDbm] mean no RSSI filter.
int? minRssiDbmFromSlider(double value) {
  final rounded = value.round();
  return rounded <= minRssiSliderMinDbm ? null : rounded;
}

double? bandFilterToGhz(BandFilterValue band) {
  return switch (band) {
    BandFilterValue.ghz24 => 2.4,
    BandFilterValue.ghz5 => 5,
    BandFilterValue.ghz6 => 6,
    BandFilterValue.all => null,
  };
}

bool hasActiveFilters(ScanWorkbenchFilters filters) {
  return filters.band != BandFilterValue.all ||
      filters.security.length == 1 ||
      filters.searchQuery.trim().isNotEmpty ||
      filters.vendorQuery.trim().isNotEmpty ||
      filters.minRssiDbm != null;
}
