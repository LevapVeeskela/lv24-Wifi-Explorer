import 'package:flutter/widgets.dart';

import '../../shared/i18n/app_localizations.dart';

/// Annotation UI strings; every getter delegates to the ARB catalogs
/// (`packages/scan_l10n`), so en/ru/zh stay in sync.
extension AnnotationL10n on BuildContext {
  AppLocalizations get _l10n => AppLocalizations.of(this);

  String get annotationNoteLabel => _l10n.annotationNoteLabel;

  String get annotationPinColorLabel => _l10n.annotationPinColorLabel;

  String get annotationPinColorAuto => _l10n.annotationPinColorAuto;

  String get annotationNoteHint => _l10n.annotationNoteHint;

  String get annotationImportCsv => _l10n.annotationImportCsv;

  String get annotationExportCsv => _l10n.annotationExportCsv;

  String get annotationImportCsvTitle => _l10n.annotationImportCsvTitle;

  String get annotationExportCsvTitle => _l10n.annotationExportCsvTitle;

  String get annotationImportCsvAction => _l10n.annotationImportCsvAction;

  String get annotationImportCsvHint => _l10n.annotationImportCsvHint;

  String get annotationCsvFilePathLabel => _l10n.annotationCsvFilePathLabel;

  String get annotationCsvOptionalPathLabel =>
      _l10n.annotationCsvOptionalPathLabel;

  String get annotationCsvTextLabel => _l10n.annotationCsvTextLabel;

  String get annotationPasteCsvLabel => _l10n.annotationPasteCsvLabel;

  String get annotationCopyCsv => _l10n.annotationCopyCsv;

  String get annotationWriteFile => _l10n.annotationWriteFile;

  String get annotationLoadFromDisk => _l10n.annotationLoadFromDisk;

  String get annotationDialogClose => _l10n.annotationDialogClose;

  String get annotationCsvCopiedMessage => _l10n.annotationCsvCopiedMessage;

  String get annotationCsvWrittenMessage => _l10n.annotationCsvWrittenMessage;

  String get annotationCsvWriteErrorMessage =>
      _l10n.annotationCsvWriteErrorMessage;

  String annotationCsvRuleCount(int count) =>
      _l10n.annotationCsvRuleCount(count);
}
