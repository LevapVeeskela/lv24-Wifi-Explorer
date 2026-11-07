import 'scan_column_id.dart';

/// Default visibility for the Flutter workbench table (subset of Electron grid fields).
const defaultScanColumnVisibility = <ScanColumnId, bool>{
  ScanColumnId.ssid: true,
  ScanColumnId.bssid: true,
  ScanColumnId.rssi: true,
  ScanColumnId.channel: true,
  ScanColumnId.band: true,
  ScanColumnId.security: true,
  ScanColumnId.phy: true,
  ScanColumnId.issues: true,
  ScanColumnId.vendor: true,
};
