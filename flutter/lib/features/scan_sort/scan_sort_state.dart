/// Sortable scan-grid fields (Electron DataGrid column field names).
enum ScanSortField {
  ssid,
  bssid,
  rssi,
  channel,
  band,
  vendor,
  security,
  issues,
}

/// Active sort column + direction for [ScanDataTable].
class ScanSortState {
  const ScanSortState({required this.field, required this.ascending});

  final ScanSortField field;
  final bool ascending;

  /// Mirrors the desktop grid initial state (`signal` descending).
  static const defaults = ScanSortState(
    field: ScanSortField.rssi,
    ascending: false,
  );

  /// Clicking the active column flips direction; a new column starts with its
  /// natural direction (text ascending, numeric descending).
  ScanSortState toggle(ScanSortField next) {
    if (next == field) {
      return ScanSortState(field: field, ascending: !ascending);
    }
    return ScanSortState(field: next, ascending: defaultAscendingFor(next));
  }

  static bool defaultAscendingFor(ScanSortField field) {
    return switch (field) {
      ScanSortField.rssi || ScanSortField.issues => false,
      _ => true,
    };
  }

  @override
  bool operator ==(Object other) =>
      other is ScanSortState &&
      other.field == field &&
      other.ascending == ascending;

  @override
  int get hashCode => Object.hash(field, ascending);
}
