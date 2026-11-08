/// Row-grouping mode for the scan grid (desktop `OrganizeByValue`).
enum OrganizeByValue { none, ssid, ap, vendor }

/// Matches Electron `STORAGE_ORGANIZE_BY`.
const organizeByStorageKey = 'lv24.wifi-explorer.organize-by';

OrganizeByValue organizeByFromWire(String? raw) {
  return switch (raw) {
    'ssid' => OrganizeByValue.ssid,
    'ap' => OrganizeByValue.ap,
    'vendor' => OrganizeByValue.vendor,
    _ => OrganizeByValue.none,
  };
}

String organizeByToWire(OrganizeByValue value) {
  return switch (value) {
    OrganizeByValue.none => 'none',
    OrganizeByValue.ssid => 'ssid',
    OrganizeByValue.ap => 'ap',
    OrganizeByValue.vendor => 'vendor',
  };
}
