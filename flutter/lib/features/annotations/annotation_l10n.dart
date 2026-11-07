import 'package:flutter/material.dart';

extension AnnotationL10n on BuildContext {
  bool get _ru => Localizations.localeOf(this).languageCode.startsWith('ru');

  String get annotationNoteLabel => _ru ? 'Пометки' : 'Notes';

  String get annotationPinColorLabel => _ru ? 'Цвет метки' : 'Pin color';

  String get annotationPinColorAuto => _ru ? 'Авто' : 'Auto';

  String get annotationNoteHint => _ru ? 'Заметка для этой сети…' : 'Note for this network…';

  String get annotationImportCsv => _ru ? 'Импорт CSV' : 'Import CSV';

  String get annotationExportCsv => _ru ? 'Экспорт CSV' : 'Export CSV';

  String get annotationImportCsvTitle => _ru ? 'Импорт пометок' : 'Import annotations';

  String get annotationExportCsvTitle => _ru ? 'Экспорт пометок' : 'Export annotations';

  String get annotationImportCsvAction => _ru ? 'Импортировать' : 'Import';

  String get annotationImportCsvHint => _ru
      ? 'Заменит все правила пометок. Формат: bssid_pattern,text'
      : 'Replaces all annotation rules. Format: bssid_pattern,text';

  String get annotationCsvFilePathLabel => _ru ? 'Путь к файлу (.csv)' : 'File path (.csv)';

  String get annotationCsvOptionalPathLabel =>
      _ru ? 'Путь к .csv (необязательно)' : 'Path to .csv (optional)';

  String get annotationCsvTextLabel => 'CSV';

  String get annotationPasteCsvLabel => _ru ? 'Или вставьте CSV' : 'Or paste CSV';

  String get annotationCopyCsv => _ru ? 'Копировать CSV' : 'Copy CSV';

  String get annotationWriteFile => _ru ? 'Записать' : 'Write file';

  String get annotationLoadFromDisk => _ru ? 'Загрузить с диска' : 'Load from disk';

  String get annotationDialogClose => _ru ? 'Закрыть' : 'Close';

  String get annotationCsvCopiedMessage =>
      _ru ? 'CSV скопирован в буфер обмена.' : 'CSV copied to clipboard.';

  String get annotationCsvWrittenMessage => _ru ? 'Файл записан.' : 'File written.';

  String get annotationCsvWriteErrorMessage => _ru
      ? 'Не удалось записать файл (проверьте путь или скопируйте CSV вручную).'
      : 'Could not write file (check path or copy CSV manually).';

  String annotationCsvRuleCount(int count) =>
      _ru ? 'Правил: $count' : 'Rules: $count';
}
