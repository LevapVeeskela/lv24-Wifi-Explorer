import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/annotations/string_storage.dart';
import 'package:lv24_wifi_explorer/features/column_rules/column_rules.dart';
import 'package:lv24_wifi_explorer/features/scan_columns/scan_columns.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_networks.dart';
import 'package:lv24_wifi_explorer/features/scan_settings/scan_settings_dialog.dart';
import 'package:lv24_wifi_explorer/features/scan_settings/settings_tabs.dart';
import 'package:lv24_wifi_explorer/shared/i18n/app_localizations.dart';
import 'package:scan_domain/scan_domain.dart';

void main() {
  group('columnRuleClassesForCell', () {
    const enabledBoth = ColumnRulesConfig(
      enabled: true,
      highlights: [ColumnRulesHighlight.rssi, ColumnRulesHighlight.security],
    );

    ObservedBss rowWith({
      SignalQuality quality = SignalQuality.good,
      bool isOpen = false,
      SecurityKind primary = SecurityKind.wpa2Personal,
    }) {
      final base = bundledDemoObservedBss().first;
      return ObservedBss(
        identity: base.identity,
        ibss: base.ibss,
        countryCode: base.countryCode,
        beaconIntervalMs: base.beaconIntervalMs,
        signal: SignalView(
          rssiDbm: base.signal.rssiDbm,
          noiseDbm: base.signal.noiseDbm,
          snrDb: base.signal.snrDb,
          quality: quality,
          qualityBasis: base.signal.qualityBasis,
        ),
        channel: base.channel,
        security: SecurityView(
          flags: [primary],
          primary: primary,
          authClass: isOpen
              ? SecurityAuthClass.open
              : SecurityAuthClass.personal,
          isOpen: isOpen,
          isSecure: !isOpen,
          ieHint: RsnHint.none,
        ),
        phy: base.phy,
        maxRate: base.maxRate,
        vendor: base.vendor,
        ie: base.ie,
        presence: base.presence,
        rssiHistory: base.rssiHistory,
        lastRaw: base.lastRaw,
      );
    }

    test('quality class on RSSI columns when RSSI highlight is on', () {
      final classes = columnRuleClassesForCell(
        rowWith(quality: SignalQuality.good, isOpen: false),
        'rssiDbm',
        enabledBoth,
      );
      expect(classes, contains(ColumnRuleCellClass.qualityGood));
    });

    test('open security class on security columns', () {
      final classes = columnRuleClassesForCell(
        rowWith(quality: SignalQuality.excellent, isOpen: true),
        'security',
        enabledBoth,
      );
      expect(classes, [ColumnRuleCellClass.securityOpen]);
    });

    test('weak class for WEP on secure rows', () {
      final classes = columnRuleClassesForCell(
        rowWith(
          quality: SignalQuality.fair,
          isOpen: false,
          primary: SecurityKind.wep,
        ),
        'security',
        enabledBoth,
      );
      expect(classes, contains(ColumnRuleCellClass.securityWeak));
    });

    test('skips unrelated columns', () {
      final classes = columnRuleClassesForCell(
        rowWith(quality: SignalQuality.poor, isOpen: true),
        'ssid',
        enabledBoth,
      );
      expect(classes, isEmpty);
    });

    test('returns empty when disabled', () {
      final classes = columnRuleClassesForCell(
        rowWith(quality: SignalQuality.poor, isOpen: true),
        'signal',
        const ColumnRulesConfig(
          enabled: false,
          highlights: [ColumnRulesHighlight.rssi],
        ),
      );
      expect(classes, isEmpty);
    });
  });

  group('loadColumnRules / saveColumnRules', () {
    test('round-trips Electron v1 payload', () {
      final storage = InMemoryStringStorage();
      saveColumnRules(defaultColumnRules, storage: storage);
      final raw = storage.read(columnRulesStorageKey);
      expect(raw, isNotNull);
      expect(raw, contains('"version":1'));
      expect(loadColumnRules(storage: storage), defaultColumnRules);
    });

    test('empty highlights array stays empty (both off)', () {
      final storage = InMemoryStringStorage();
      const empty = ColumnRulesConfig(enabled: true, highlights: []);
      saveColumnRules(empty, storage: storage);
      expect(storage.read(columnRulesStorageKey), contains('"highlights":[]'));
      expect(loadColumnRules(storage: storage), empty);

      final seeded = InMemoryStringStorage({
        columnRulesStorageKey: '{"version":1,"enabled":true,"highlights":[]}',
      });
      expect(loadColumnRules(storage: seeded).highlights, isEmpty);
      expect(ColumnRulesController(storage: seeded).config.highlights, isEmpty);
    });

    test('missing or non-list highlights still use defaults', () {
      final storage = InMemoryStringStorage({
        columnRulesStorageKey: '{"version":1,"enabled":true}',
      });
      expect(
        loadColumnRules(storage: storage).highlights,
        defaultColumnRules.highlights,
      );
    });
  });

  group('ColumnRulesController.setConfig', () {
    test('persists and notifies; identical config is a no-op', () {
      final storage = InMemoryStringStorage();
      final controller = ColumnRulesController(storage: storage);
      var notified = 0;
      controller.addListener(() => notified++);

      const next = ColumnRulesConfig(
        enabled: false,
        highlights: [ColumnRulesHighlight.rssi],
      );
      controller.setConfig(next);
      expect(controller.config, next);
      expect(notified, 1);
      expect(loadColumnRules(storage: storage), next);
      expect(storage.read(columnRulesStorageKey), contains('"version":1'));

      controller.setConfig(next);
      expect(notified, 1);

      controller.resetToDefaults();
      expect(controller.config, defaultColumnRules);
      expect(loadColumnRules(storage: storage), defaultColumnRules);
      expect(notified, 2);
    });

    test('withHighlightToggled matches Electron add/remove', () {
      expect(
        withHighlightToggled(
          [ColumnRulesHighlight.rssi, ColumnRulesHighlight.security],
          ColumnRulesHighlight.rssi,
          false,
        ),
        [ColumnRulesHighlight.security],
      );
      expect(
        withHighlightToggled(
          [ColumnRulesHighlight.security],
          ColumnRulesHighlight.rssi,
          true,
        ),
        [ColumnRulesHighlight.security, ColumnRulesHighlight.rssi],
      );
    });
  });

  testWidgets('settings section setConfig updates persist immediately',
      (tester) async {
    final storage = InMemoryStringStorage();
    final controller = ColumnRulesController(storage: storage);
    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(
          body: ColumnRulesSettingsSection(controller: controller),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Cell highlighting'), findsOneWidget);
    expect(find.text('Enable rule-based highlighting'), findsOneWidget);

    await tester.tap(find.byType(Switch).first);
    await tester.pump();
    expect(controller.config.enabled, isFalse);
    expect(loadColumnRules(storage: storage).enabled, isFalse);

    final rssiSwitch = tester.widget<Switch>(find.byType(Switch).at(1));
    expect(rssiSwitch.onChanged, isNull);
  });

  Future<void> tapRssiHighlightToggle(WidgetTester tester) async {
    final rssi = find.text('Signal quality (RSSI, SNR, noise)');
    await tester.scrollUntilVisible(
      rssi,
      200,
      scrollable: find.byType(Scrollable).last,
    );
    await tester.pump();
    await tester.tap(rssi);
    await tester.pump();
  }

  testWidgets(
      'settings overlay shares live controller so table tints update',
      (tester) async {
    final storage = InMemoryStringStorage();
    final controller = ColumnRulesController(storage: storage);
    final columns = ScanColumnsController();
    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: ScanColumnsScope(
          controller: columns,
          child: ColumnRulesScope(
            controller: controller,
            child: Scaffold(
              body: Builder(
                builder: (context) {
                  final rssiOn = ColumnRulesScope.of(context)
                      .config
                      .highlights
                      .contains(ColumnRulesHighlight.rssi);
                  return Column(
                    children: [
                      TextButton(
                        onPressed: () => showScanSettingsDialog(
                          context,
                          initialTab: SettingsTabId.columns,
                        ),
                        child: const Text('open-settings'),
                      ),
                      Text('table-rssi:$rssiOn'),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );

    expect(find.text('table-rssi:true'), findsOneWidget);
    await tester.tap(find.text('open-settings'));
    await tester.pumpAndSettle();

    expect(find.text('Enable rule-based highlighting'), findsOneWidget);
    expect(find.text('Manage column visibility…'), findsOneWidget);
    await tapRssiHighlightToggle(tester);

    expect(controller.config.highlights.contains(ColumnRulesHighlight.rssi),
        isFalse);
    expect(find.text('table-rssi:false'), findsOneWidget);
  });

  testWidgets(
      'columns manage overlay shares live controller so table tints update',
      (tester) async {
    final storage = InMemoryStringStorage();
    final controller = ColumnRulesController(storage: storage);
    final columns = ScanColumnsController();
    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: ScanColumnsScope(
          controller: columns,
          child: ColumnRulesScope(
            controller: controller,
            child: Scaffold(
              body: Builder(
                builder: (context) {
                  final rssiOn = ColumnRulesScope.of(context)
                      .config
                      .highlights
                      .contains(ColumnRulesHighlight.rssi);
                  return Column(
                    children: [
                      TextButton(
                        onPressed: () => showScanColumnsPanel(context),
                        child: const Text('open-columns'),
                      ),
                      Text('table-rssi:$rssiOn'),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );

    expect(find.text('table-rssi:true'), findsOneWidget);
    await tester.tap(find.text('open-columns'));
    await tester.pumpAndSettle();

    await tapRssiHighlightToggle(tester);

    expect(controller.config.highlights.contains(ColumnRulesHighlight.rssi),
        isFalse);
    expect(find.text('table-rssi:false'), findsOneWidget);
  });
}
