import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/annotations/string_storage.dart';
import 'package:lv24_wifi_explorer/features/column_rules/column_rules.dart';
import 'package:lv24_wifi_explorer/features/scan_columns/scan_columns.dart';
import 'package:lv24_wifi_explorer/features/scan_settings/scan_settings.dart';
import 'package:scan_l10n/scan_l10n.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    debugUseMemoryScanSettingsBackend();
    final view = TestWidgetsFlutterBinding.instance.platformDispatcher.views.first;
    view.physicalSize = const Size(1200, 800);
    view.devicePixelRatio = 1;
  });

  tearDown(() {
    debugResetScanSettingsPersistence();
    final view = TestWidgetsFlutterBinding.instance.platformDispatcher.views.first;
    view.resetPhysicalSize();
    view.resetDevicePixelRatio();
  });

  testWidgets('settings window shows Electron-like tabs and persists advanced prefs',
      (tester) async {
    final controller = ScanSettingsController(
      initial: scanWorkbenchSettingsDefaults,
      hydrate: false,
    );

    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: scanSupportedLocales,
        home: ScanSettingsWindow(controller: controller),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('LV24 WiFi Explorer settings'), findsOneWidget);
    expect(find.text('General'), findsWidgets);
    expect(find.text('Columns'), findsOneWidget);
    expect(find.text('Annotations'), findsOneWidget);
    expect(find.text('Vendor database'), findsOneWidget);
    expect(find.text('Advanced'), findsOneWidget);
    expect(find.text('Include hidden SSIDs when scanning'), findsOneWidget);
    expect(find.text('Live scan'), findsOneWidget);
    expect(find.text('Signal display'), findsOneWidget);
    expect(find.text('Min RSSI'), findsOneWidget);
    expect(find.text('Start scanning on launch'), findsOneWidget);

    await tester.tap(find.text('Advanced'));
    await tester.pumpAndSettle();

    expect(find.text('Hide empty bands on spectrum'), findsOneWidget);
    expect(find.text('Match system appearance'), findsOneWidget);
    expect(find.text('Graph labels'), findsOneWidget);

    await tester.tap(find.text('Match system appearance'));
    await tester.pump();
    expect(controller.settings.appearanceFollowSystem, isFalse);
  });

  testWidgets('columns tab hosts cell-highlighting switches',
      (tester) async {
    final controller = ScanSettingsController(
      initial: scanWorkbenchSettingsDefaults,
      hydrate: false,
    );
    final columnRules = ColumnRulesController(storage: InMemoryStringStorage());
    final columns = ScanColumnsController();

    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: scanSupportedLocales,
        home: ScanColumnsScope(
          controller: columns,
          child: ColumnRulesScope(
            controller: columnRules,
            child: ScanSettingsWindow(
              controller: controller,
              initialTab: SettingsTabId.columns,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Cell highlighting'), findsOneWidget);
    expect(find.text('Enable rule-based highlighting'), findsOneWidget);
    expect(find.text('Signal quality (RSSI, SNR, noise)'), findsOneWidget);
    expect(find.text('Open and weak networks (WEP)'), findsOneWidget);
    expect(find.text('Manage column visibility…'), findsOneWidget);
    expect(find.textContaining('not edited here'), findsNothing);
    expect(find.byType(Switch), findsNWidgets(3));
  });
}
