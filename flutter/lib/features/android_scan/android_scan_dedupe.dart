import 'package:scan_domain/scan_domain.dart';

/// Dedupe WifiManager rows by BSSID + primary channel (keep stronger RSSI).
List<CoreWlanNetworkRecord> dedupeAndroidNetworkRecords(
  Iterable<CoreWlanNetworkRecord> rows,
) {
  final best = <String, CoreWlanNetworkRecord>{};
  for (final row in rows) {
    final key = androidBssChannelKey(row);
    final previous = best[key];
    if (previous == null || row.rssiDbm > previous.rssiDbm) {
      best[key] = row;
    }
  }
  return best.values.toList(growable: false);
}

String androidBssChannelKey(CoreWlanNetworkRecord row) {
  final bssid = normalizeBssid(row.bssid) ?? row.bssid ?? '';
  return '$bssid|${row.channelNumber}|${coreWlanChannelBandKey(row.channelBand)}';
}
