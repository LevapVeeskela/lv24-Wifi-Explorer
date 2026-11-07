import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/android_scan/android_scan_dedupe.dart';
import 'package:scan_domain/scan_domain.dart';

CoreWlanNetworkRecord _record({
  required String? bssid,
  required int channel,
  required double rssi,
  CoreWlanChannelBand band = CoreWlanChannelBand.ghz2,
}) {
  return CoreWlanNetworkRecord(
    ssid: 'Cafe',
    ssidData: const [67, 97, 102, 101],
    bssid: bssid,
    rssiDbm: rssi,
    noiseDbm: 0,
    channelNumber: channel,
    channelBand: band,
    channelWidth: CoreWlanChannelWidth.mhz20,
    countryCode: null,
    beaconIntervalMs: 100,
    ibss: false,
    informationElementData: null,
    supportedSecurity: const [SecurityKind.wpa2Personal],
    supportedPhyModes: const [PhyLetter.n],
  );
}

void main() {
  test('dedupes BSSID+channel and keeps a second channel as its own BSS', () {
    final rows = dedupeAndroidNetworkRecords([
      _record(bssid: '00:11:22:33:44:55', channel: 6, rssi: -80),
      _record(bssid: '00:11:22:33:44:55', channel: 6, rssi: -40),
      _record(bssid: '00:11:22:33:44:55', channel: 11, rssi: -60),
    ]);
    expect(rows, hasLength(2));
    final ch6 = rows.firstWhere((row) => row.channelNumber == 6);
    expect(ch6.rssiDbm, -40);
    expect(rows.any((row) => row.channelNumber == 11), isTrue);
  });
}
