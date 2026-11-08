/// Supported scan UI locales (`ru` is the product default).
enum ScanLocale {
  ru('ru'),
  en('en'),
  zh('zh');

  const ScanLocale(this.languageCode);

  final String languageCode;

  static const ScanLocale defaultLocale = ScanLocale.ru;

  static ScanLocale? tryParse(String? code) {
    if (code == null || code.isEmpty) return null;
    final normalized = code.split(RegExp('[-_]')).first.toLowerCase();
    for (final locale in ScanLocale.values) {
      if (locale.languageCode == normalized) return locale;
    }
    return null;
  }

  static ScanLocale parse(String code) =>
      tryParse(code) ?? ScanLocale.defaultLocale;
}
