import '../core/l10n/generated/app_localizations.dart';
import 'scan_issue_id.dart';
import 'scan_locale.dart';
import 'scan_message_lookup.dart';

/// Lookup for scan UI strings keyed like Electron `MessageKey` (`scan.status.found`, …).
///
/// Backed by ARB catalogs under `lib/core/l10n/` (same layout as lv24 city mobile app).
class ScanL10n {
  ScanL10n._(this.locale, this._l10n);

  final ScanLocale locale;
  final AppLocalizations _l10n;

  static const ScanLocale defaultLocale = ScanLocale.defaultLocale;

  factory ScanL10n(ScanLocale locale) {
    return ScanL10n._(locale, appLocalizationsForScanLocale(locale));
  }

  factory ScanL10n.fromLanguageCode(String code) =>
      ScanL10n(ScanLocale.parse(code));

  /// Flutter `AppLocalizations` instance for this scan locale (no [BuildContext]).
  AppLocalizations get appLocalizations => _l10n;

  static AppLocalizations appLocalizationsForScanLocale(ScanLocale locale) =>
      appLocalizationsForLanguageCode(locale.languageCode);

  /// Resolves a dot-key message without placeholders (throws if key needs values).
  static Map<String, String> catalogFor(ScanLocale locale) {
    final l10n = appLocalizationsForScanLocale(locale);
    return {
      for (final key in scanMessageKeys) key: lookupScanMessage(l10n, key),
    };
  }

  /// Full message id, e.g. `scan.status.found`.
  String operator [](String messageKey) => message(messageKey);

  String message(String messageKey, [Map<String, Object>? values]) {
    return lookupScanMessage(_l10n, messageKey, values);
  }

  String? tryMessage(String messageKey, [Map<String, Object>? values]) {
    return tryLookupScanMessage(_l10n, messageKey, values);
  }

  /// Label for an issue flag id from `evaluateIssues` (`lowSignal`, `overlap24`, …).
  String issue(String issueId) => message('scan.issue.$issueId');

  /// Same key shape as TS `ScanIssueMessageKey` (`scan.issue.lowSignal`).
  String issueMessageKey(String issueId) => 'scan.issue.$issueId';

  /// Resolves any issue id in [ScanIssueId.all].
  String issueOrId(String issueId) {
    final key = issueMessageKey(issueId);
    return tryLookupScanMessage(_l10n, key) ?? issueId;
  }
}

/// Flutter `MaterialApp.supportedLocales` entries for scan UI (ru first — product default).
const scanSupportedLocales = AppLocalizations.supportedLocales;

/// Language codes for scan UI (`ru` default when unknown).
const scanSupportedLocaleCodes = <String>['ru', 'en', 'zh'];
