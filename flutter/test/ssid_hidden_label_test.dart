import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_session/bss_display.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_networks.dart';
import 'package:lv24_wifi_explorer/shared/i18n/app_localizations.dart';
import 'package:lv24_wifi_explorer/widgets/scan_grid_display.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late AppLocalizations en;
  late AppLocalizations ru;

  setUp(() {
    en = lookupAppLocalizations(const Locale('en'));
    ru = lookupAppLocalizations(const Locale('ru'));
  });

  group('ssidHiddenFromBss', () {
    test('true for demo hidden row (empty octets)', () {
      final hidden = bundledDemoObservedBss().firstWhere((n) => n.lastRaw.ssid == null);
      expect(ssidHiddenFromBss(hidden), isTrue);
    });

    test('false for visible SSID demo row', () {
      final lab = bundledDemoObservedBss().firstWhere((n) => n.lastRaw.ssid == 'LV24-Lab');
      expect(ssidHiddenFromBss(lab), isFalse);
    });
  });

  group('ssidGridLabel and displaySsid', () {
    test('hidden row uses localized hidden placeholder', () {
      final hidden = bundledDemoObservedBss().firstWhere((n) => n.lastRaw.ssid == null);
      expect(ssidGridLabel(hidden, en), en.hiddenSsid);
      expect(ssidGridLabel(hidden, ru), ru.hiddenSsid);
      expect(displaySsid(hidden, en), en.hiddenSsid);
    });

    test('visible row shows UTF-8 SSID', () {
      final lab = bundledDemoObservedBss().firstWhere((n) => n.lastRaw.ssid == 'LV24-Lab');
      expect(ssidGridLabel(lab, en), 'LV24-Lab');
      expect(displaySsid(lab, en), 'LV24-Lab');
    });
  });

  testWidgets('grid SSID style is italic when hidden', (tester) async {
    final style = scanGridSsidTextStyle(
      base: const TextStyle(fontSize: 14),
      connected: false,
      hidden: true,
    );
    expect(style.fontStyle, FontStyle.italic);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Text(
            en.hiddenSsid,
            style: style,
          ),
        ),
      ),
    );
    expect(find.text(en.hiddenSsid), findsOneWidget);
  });
}
