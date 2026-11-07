import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../shared/i18n/app_localizations.dart';
import '../snapshot/snapshot_platform_file.dart';
import '../snapshot/workbench_file_picker.dart';
import 'workbench_csv.dart';

Future<void> showExportCsvDialog(
  BuildContext context, {
  required WorkbenchCsvBundle bundle,
}) async {
  final l10n = AppLocalizations.of(context);
  final ru = l10n.localeName.startsWith('ru');

  if (snapshotFileIoSupported) {
    final picked = await pickWorkbenchSavePath(
      dialogTitle: l10n.scanExportCsv,
      fileName: bundle.fileName,
      allowedExtensions: ['csv'],
    );
    if (picked == null) return;

    final path = ensureFileExtension(picked, 'csv');
    final ok = await writeSnapshotFile(path, bundle.text);
    if (ok) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ru ? 'CSV сохранён: $path' : 'CSV saved: $path'),
          ),
        );
      }
      return;
    }

    if (!context.mounted) return;
    await _showExportCsvFallbackDialog(
      context,
      bundle: bundle,
      initialPath: path,
      initialWriteError: true,
    );
    return;
  }

  await _showExportCsvFallbackDialog(context, bundle: bundle);
}

Future<void> _showExportCsvFallbackDialog(
  BuildContext context, {
  required WorkbenchCsvBundle bundle,
  String? initialPath,
  bool initialWriteError = false,
}) async {
  final l10n = AppLocalizations.of(context);
  final ru = l10n.localeName.startsWith('ru');
  final pathController = TextEditingController(text: initialPath ?? bundle.fileName);
  final csvController = TextEditingController(text: bundle.text);
  var copied = false;
  var wrote = false;
  var writeError = initialWriteError;

  await showDialog<void>(
    context: context,
    builder: (dialogContext) {
      return StatefulBuilder(
        builder: (context, setLocal) {
          Future<void> copyCsv() async {
            await Clipboard.setData(ClipboardData(text: csvController.text));
            setLocal(() => copied = true);
          }

          Future<void> writePath() async {
            if (!snapshotFileIoSupported) {
              setLocal(() => writeError = true);
              return;
            }
            final ok = await writeSnapshotFile(pathController.text, csvController.text);
            setLocal(() {
              wrote = ok;
              writeError = !ok;
            });
          }

          return AlertDialog(
            title: Text(l10n.scanExportCsv),
            content: SizedBox(
              width: 560,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      ru ? 'Строк: ${bundle.rowCount}' : 'Rows: ${bundle.rowCount}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: pathController,
                      decoration: InputDecoration(
                        labelText: ru ? 'Путь к файлу (.csv)' : 'File path (.csv)',
                        hintText: bundle.fileName,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: csvController,
                      maxLines: 12,
                      readOnly: true,
                      decoration: InputDecoration(
                        labelText: 'CSV',
                        alignLabelWithHint: true,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    if (copied)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          ru ? 'CSV скопирован в буфер обмена.' : 'CSV copied to clipboard.',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    if (wrote)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          ru ? 'Файл записан.' : 'File written.',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    if (writeError)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          ru
                              ? 'Не удалось записать файл (проверьте путь или скопируйте CSV вручную).'
                              : 'Could not write file (check path or copy CSV manually).',
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                            fontSize: Theme.of(context).textTheme.bodySmall?.fontSize,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: Text(ru ? 'Закрыть' : 'Close'),
              ),
              TextButton(
                onPressed: copyCsv,
                child: Text(ru ? 'Копировать CSV' : 'Copy CSV'),
              ),
              if (snapshotFileIoSupported)
                FilledButton(
                  onPressed: writePath,
                  child: Text(ru ? 'Записать' : 'Write file'),
                ),
            ],
          );
        },
      );
    },
  );

  pathController.dispose();
  csvController.dispose();
}
