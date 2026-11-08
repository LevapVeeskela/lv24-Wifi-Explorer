import 'package:flutter/material.dart';
import 'package:lv24_sunset_theme/lv24_sunset_theme.dart';

import '../features/appearance/appearance.dart';
import '../features/scan_columns/scan_columns.dart';
import '../features/scan_settings/scan_settings.dart';
import '../pages/scan_workbench/scan_workbench_page.dart';
import '../shared/i18n/app_localizations.dart';

class Lv24App extends StatefulWidget {
  const Lv24App({super.key});

  @override
  State<Lv24App> createState() => _Lv24AppState();
}

class _Lv24AppState extends State<Lv24App> {
  late final AppearanceController _appearance;
  late final ScanSettingsController _scanSettings;

  @override
  void initState() {
    super.initState();
    _appearance = AppearanceController()..hydrate();
    _scanSettings = ScanSettingsController();
  }

  @override
  void dispose() {
    _appearance.dispose();
    _scanSettings.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppearanceScope(
      controller: _appearance,
      child: ScanSettingsScope(
        controller: _scanSettings,
        child: ListenableBuilder(
          listenable: Listenable.merge([_appearance, _scanSettings]),
          builder: (context, _) {
            return MaterialApp(
              onGenerateTitle: (context) => AppLocalizations.of(context).appTitle,
              theme: AppTheme.light,
              darkTheme: AppTheme.dark,
              themeMode: themePreferenceToThemeMode(
                resolveThemePreference(
                  appearanceFollowSystem:
                      _scanSettings.settings.appearanceFollowSystem,
                  stored: _appearance.preference,
                ),
              ),
              locale: _scanSettings.settings.locale,
              localeResolutionCallback: (locale, supported) {
                if (locale == null) return _scanSettings.settings.locale;
                for (final item in supported) {
                  if (item.languageCode == locale.languageCode) return item;
                }
                return _scanSettings.settings.locale;
              },
              localizationsDelegates: AppLocalizations.localizationsDelegates,
              supportedLocales: scanSupportedLocales,
              home: const PersistedScanColumns(child: ScanWorkbenchPage()),
            );
          },
        ),
      ),
    );
  }
}
