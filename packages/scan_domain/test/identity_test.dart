import 'package:scan_domain/scan_domain.dart';
import 'package:test/test.dart';

void main() {
  test('normalizeBssid and match key prefer BSSID', () {
    expect(normalizeBssid('AA-BB-CC-DD-EE-FF'), 'aa:bb:cc:dd:ee:ff');
    expect(
      bssMatchKeyFromRaw(
        bssid: 'aa:bb:cc:dd:ee:ff',
        ssidData: [1, 2],
        ssid: 'x',
        channelNumber: 6,
        channelBand: '2ghz',
        ibss: false,
      ),
      'bssid:aa:bb:cc:dd:ee:ff',
    );
  });

  test('octetHexOf builds ssidData grouping key', () {
    expect(octetHexOf('Campus'.codeUnits), octetHexOf('Campus'.codeUnits));
    expect(octetHexOf('Beta'.codeUnits), isNot(octetHexOf('Campus'.codeUnits)));
  });
}
