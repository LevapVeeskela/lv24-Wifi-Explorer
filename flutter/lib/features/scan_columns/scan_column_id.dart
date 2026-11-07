/// DataTable column ids (aligned with Electron CSV / grid field names where applicable).
enum ScanColumnId {
  ssid('ssid'),
  bssid('bssid'),
  rssi('rssi'),
  channel('channel'),
  band('band'),
  security('security'),
  phy('phy'),
  issues('issues'),
  vendor('vendor');

  const ScanColumnId(this.storageKey);

  final String storageKey;

  static ScanColumnId? tryParse(String key) {
    for (final id in ScanColumnId.values) {
      if (id.storageKey == key) return id;
    }
    return null;
  }

  static const ordered = ScanColumnId.values;
}
