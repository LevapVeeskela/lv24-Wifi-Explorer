import 'package:scan_l10n/scan_l10n.dart';
import 'package:test/test.dart';

void main() {
  test('ru, en and zh catalogs share the same keys', () {
    final keys = {
      for (final locale in ScanLocale.values)
        locale: ScanL10n.catalogFor(locale).keys.toSet(),
    };
    expect(keys[ScanLocale.ru], keys[ScanLocale.en]);
    expect(keys[ScanLocale.en], keys[ScanLocale.zh]);
    expect(scanMessageKeys.length, greaterThan(100));
  });

  test('evaluateIssues issue ids resolve to non-empty labels', () {
    final ru = ScanL10n(ScanLocale.ru);
    final en = ScanL10n(ScanLocale.en);
    for (final id in ScanIssueId.all) {
      expect(ru.issue(id), isNotEmpty);
      expect(en.issue(id), isNotEmpty);
      expect(ru.issue(id), isNot(equals(id)));
    }
  });

  test('lowSignal, overlap24, hiddenSsid match shared i18n', () {
    final ru = ScanL10n(ScanLocale.ru);
    expect(ru.issue(ScanIssueId.lowSignal), 'Слабый сигнал');
    expect(ru.issue(ScanIssueId.overlap24), 'Нестандартный канал 2,4 ГГц');
    expect(ru.issue(ScanIssueId.hiddenSsid), 'Скрытое имя сети');

    final en = ScanL10n(ScanLocale.en);
    expect(en.issue(ScanIssueId.lowSignal), 'Low signal');
    expect(en.issue(ScanIssueId.overlap24), 'Non-standard 2.4 GHz channel');
    expect(en.issue(ScanIssueId.hiddenSsid), 'Hidden network name');
  });

  test('scan.print.visible matches Electron File menu', () {
    expect(
      ScanL10n(ScanLocale.ru).message('scan.print.visible'),
      'Печать видимой таблицы…',
    );
    expect(
      ScanL10n(ScanLocale.en).message('scan.print.visible'),
      'Print visible table…',
    );
  });

  test('column cell-rule settings keys match Electron labels', () {
    final ru = ScanL10n(ScanLocale.ru);
    expect(ru.message('scan.settings.columns.cellRules'), 'Подсветка ячеек');
    expect(
      ru.message('scan.settings.columns.cellRules.enabled'),
      'Включить подсветку по правилам',
    );
    expect(
      ru.message('scan.settings.columns.cellRules.rssi'),
      'Качество сигнала (RSSI, SNR, шум)',
    );
    expect(
      ru.message('scan.settings.columns.cellRules.security'),
      'Открытые и слабые сети (WEP)',
    );

    final en = ScanL10n(ScanLocale.en);
    expect(en.message('scan.settings.columns.cellRules'), 'Cell highlighting');
    expect(
      en.message('scan.settings.columns.cellRules.rssi'),
      'Signal quality (RSSI, SNR, noise)',
    );
  });

  test('location onboarding and scan degradation keys resolve', () {
    final en = ScanL10n(ScanLocale.en);
    expect(en.message('onboarding.location.continue'), 'Continue');
    expect(
      en.message('permissions.platform.ios.body'),
      contains('CoreWLAN'),
    );
    expect(
      en.message('scan.degraded.androidThrottled.title'),
      'Android scan throttled',
    );
    expect(
      en.message('scan.degraded.windowsConnectedOnly.title'),
      'Windows associated link only',
    );
    expect(
      en.message('permissions.platform.windows.body'),
      contains('WlanQueryInterface'),
    );
    expect(
      en.message('permissions.platform.other.settingsHint'),
      contains('associated-link'),
    );
    expect(
      en.message('permissions.platform.other.settingsHint'),
      isNot(contains('WLAN adapter')),
    );
    expect(en.message('scan.demo.banner'), contains('Windows'));
    expect(en.message('scan.degraded.demo.body'), contains('Windows'));

    final ru = ScanL10n(ScanLocale.ru);
    expect(ru.message('onboarding.location.later'), 'Не сейчас');
    expect(ru.message('permissions.platform.linux.title'), contains('D-Bus'));
    expect(ru.message('scan.demo.banner'), contains('Windows'));
    expect(
      ru.message('permissions.platform.other.settingsHint'),
      isNot(contains('WLAN-адаптер')),
    );
  });

  test('placeholder interpolation', () {
    final l10n = ScanL10n(ScanLocale.en);
    expect(
      l10n.message('scan.status.found', {'count': 3}),
      'Networks: 3',
    );
    expect(
      l10n.message('scan.settings.scanIntervalSec', {'sec': 2}),
      '2s',
    );
    expect(
      l10n.message('scan.settings.windowTitle'),
      'LV24 WiFi Explorer settings',
    );
    expect(
      l10n.message('scan.settings.advanced.followSystem'),
      'Match system appearance',
    );
    expect(
      l10n.message('scan.settings.autoStartScan'),
      'Start scanning on launch',
    );
  });

  test('default locale is ru', () {
    expect(ScanL10n.defaultLocale, ScanLocale.ru);
    expect(ScanL10n.fromLanguageCode('ru').locale, ScanLocale.ru);
    expect(ScanL10n.fromLanguageCode('en').locale, ScanLocale.en);
    expect(ScanL10n.fromLanguageCode('zh').locale, ScanLocale.zh);
    expect(ScanL10n.fromLanguageCode('zh-CN').locale, ScanLocale.zh);
    expect(ScanL10n.fromLanguageCode('de').locale, ScanLocale.ru);
  });

  test('AppLocalizations delegate lists ru, en and zh', () {
    expect(AppLocalizations.supportedLocales.first.languageCode, 'ru');
    expect(
      AppLocalizations.supportedLocales.map((locale) => locale.languageCode),
      containsAll(<String>['ru', 'en', 'zh']),
    );
  });

  test('IE tree field labels resolve in ru and en', () {
    final ru = ScanL10n(ScanLocale.ru);
    final en = ScanL10n(ScanLocale.en);
    expect(en.message('scan.adv.ies.tree'), 'Information elements — tree');
    expect(ru.message('scan.adv.ies.tree'), 'Информационные элементы — дерево');
    expect(en.message('scan.ie.parseLevel'), 'Parse level');
    expect(ru.message('scan.ie.parseLevel'), 'Уровень разбора');
    expect(en.message('scan.ie.dtimCount'), 'DTIM count');
    expect(ru.message('scan.ie.yes'), 'да');
    expect(en.message('scan.ie.pairwise', {'index': 1}), 'Pairwise 1');
  });
}
