/// Windows v1 scan adapter (associated link + demo fallback).
///
/// Public APIs only: Native Wifi `WlanGetAvailableNetworkList` /
/// `WlanQueryInterface`. That list is SSID-aggregated (no BSSID, channel, or
/// IEs), so v1 does **not** pretend it is a BSS survey. WinRT `WiFiAdapter`
/// is skipped (unpackaged Flutter has no MSIX `wifiControl`; still no IEs).
library;

export 'windows_scan_adapter.dart';
export 'windows_scan_channel.dart';
export 'windows_scan_payload.dart';
export 'windows_scan_resolve.dart';
export 'windows_scan_session.dart';
export 'windows_scan_source.dart';
