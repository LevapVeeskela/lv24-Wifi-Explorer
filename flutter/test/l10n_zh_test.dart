import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/annotations/annotation_l10n.dart';
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

  test('annotation strings come from ARB catalogs and differ in zh', () {
    final ru = lookupAppLocalizations(const Locale('ru'));
    final en = lookupAppLocalizations(const Locale('en'));
    final zh = lookupAppLocalizations(const Locale('zh'));

    final pickers = <String Function(AppLocalizations)>[
      (l10n) => l10n.annotationNoteLabel,
      (l10n) => l10n.annotationPinColorLabel,
      (l10n) => l10n.annotationCsvCopiedMessage,
      (l10n) => l10n.annotationImportCsvHint,
      (l10n) => l10n.annotationLoadFromDisk,
      (l10n) => l10n.annotationCsvRuleCount(4),
    ];

    var differing = 0;
    for (final pick in pickers) {
      final ruText = pick(ru);
      final enText = pick(en);
      final zhText = pick(zh);
      expect(ruText, isNotEmpty);
      expect(enText, isNotEmpty);
      expect(zhText, isNotEmpty);
      if (enText != zhText) differing += 1;
    }

    expect(differing, greaterThanOrEqualTo(3));
    expect(zh.annotationNoteLabel, isNot(equals(en.annotationNoteLabel)));
    expect(zh.annotationCsvRuleCount(4), contains('4'));
    expect(en.annotationCsvRuleCount(4), contains('4'));
  });

  testWidgets('annotation BuildContext extension resolves zh, not English', (
    tester,
  ) async {
    Future<String> noteFor(Locale locale) async {
      late String note;
      await tester.pumpWidget(
        Localizations(
          locale: locale,
          delegates: AppLocalizations.localizationsDelegates,
          child: Builder(
            builder: (context) {
              note = context.annotationNoteLabel;
              return const SizedBox.shrink();
            },
          ),
        ),
      );
      await tester.pumpAndSettle();
      return note;
    }

    final en = await noteFor(const Locale('en'));
    final zh = await noteFor(const Locale('zh'));
    expect(en, 'Notes');
    expect(zh, isNot(equals(en)));
    expect(zh, isNotEmpty);
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
