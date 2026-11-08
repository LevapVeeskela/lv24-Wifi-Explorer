import 'package:flutter/widgets.dart';
import 'package:scan_l10n/scan_l10n.dart';

/// Languages the UI is translated into, labelled with their own endonyms.
///
/// Deliberately not localized: a language is always offered in its own script.
const _languageLabels = <String, String>{
  'ru': 'Русский',
  'en': 'English',
  'zh': '简体中文',
};

/// One entry of the interface-language picker.
class LanguageOption {
  const LanguageOption({required this.languageCode, required this.label});

  final String languageCode;
  final String label;
}

/// Picker options derived from [AppLocalizations.supportedLocales] so a new
/// ARB catalog shows up without touching the settings UI.
List<LanguageOption> languageOptionsFrom(Iterable<Locale> supported) => [
  for (final locale in supported)
    LanguageOption(
      languageCode: locale.languageCode,
      label:
          _languageLabels[locale.languageCode] ??
          locale.languageCode.toUpperCase(),
    ),
];

/// Options for the current app build.
List<LanguageOption> get supportedLanguageOptions =>
    languageOptionsFrom(AppLocalizations.supportedLocales);
