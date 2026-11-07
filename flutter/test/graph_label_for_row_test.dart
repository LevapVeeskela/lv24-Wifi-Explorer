import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_settings/graph_label_for_row.dart';
import 'package:lv24_wifi_explorer/features/scan_settings/types.dart';

void main() {
  const row = GraphLabelRow(
    ssid: 'Campus-WiFi',
    bssid: 'AA:BB:CC:DD:EE:FF',
    vendor: 'Acme Networks',
    annotation: 'Lab AP',
  );

  test('uses SSID by default', () {
    expect(graphLabelForRow(row, GraphLabelMode.ssid, '<hidden>'), 'Campus-WiFi');
  });

  test('uses vendor for apName with bssid fallback', () {
    expect(
      graphLabelForRow(row, GraphLabelMode.apName, '<hidden>'),
      'Acme Networks',
    );
    expect(
      graphLabelForRow(
        const GraphLabelRow(
          ssid: 'Campus-WiFi',
          bssid: 'AA:BB:CC:DD:EE:FF',
        ),
        GraphLabelMode.apName,
        '<hidden>',
      ),
      'AA:BB:CC:DD:EE:FF',
    );
  });

  test('uses annotation with SSID fallback', () {
    expect(
      graphLabelForRow(row, GraphLabelMode.annotation, '<hidden>'),
      'Lab AP',
    );
    expect(
      graphLabelForRow(
        const GraphLabelRow(
          ssid: 'Campus-WiFi',
          bssid: 'AA:BB:CC:DD:EE:FF',
          vendor: 'Acme Networks',
        ),
        GraphLabelMode.annotation,
        '<hidden>',
      ),
      'Campus-WiFi',
    );
  });

  test('hidden SSID uses placeholder', () {
    expect(
      graphLabelForRow(
        const GraphLabelRow(
          ssid: '',
          bssid: 'AA:BB:CC:DD:EE:FF',
          ssidHidden: true,
        ),
        GraphLabelMode.ssid,
        '<hidden>',
      ),
      '<hidden>',
    );
  });
}
