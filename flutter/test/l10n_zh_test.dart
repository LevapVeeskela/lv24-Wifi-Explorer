import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_settings/normalize.dart';
import 'package:lv24_wifi_explorer/shared/i18n/app_localizations.dart';

void main() {
  test('supported locales include Simplified Chinese', () {
    final codes = AppLocalizations.supportedLocales
        .map((locale) => locale.languageCode)
        .toSet();
    expect(codes, containsAll(<String>['ru', 'en', 'zh']));
  });

  test('workbench extension resolves user-facing strings in ru, en and zh', () {
    final ru = lookupAppLocalizations(const Locale('ru'));
    final en = lookupAppLocalizations(const Locale('en'));
    final zh = lookupAppLocalizations(const Locale('zh'));

    expect(ru.scanStart, isNotEmpty);
    expect(en.scanStart, isNotEmpty);
    expect(zh.scanStart, isNotEmpty);
    expect({ru.scanStart, en.scanStart, zh.scanStart}, hasLength(3));

    expect({ru.scanStop, en.scanStop, zh.scanStop}, hasLength(3));
    expect({ru.redacted, en.redacted, zh.redacted}, hasLength(3));
    expect(zh.redacted, isNot(equals(en.redacted)));
  });

  test('language code normalization accepts zh variants', () {
    expect(normalizeLanguageCode('zh'), 'zh');
    expect(normalizeLanguageCode('zh-CN'), 'zh');
    expect(normalizeLanguageCode('zh-Hans'), 'zh');
    expect(normalizeLanguageCode('en-US'), 'en');
    expect(normalizeLanguageCode('de'), 'ru');
    expect(normalizeLanguageCode(null), 'ru');
  });
}
