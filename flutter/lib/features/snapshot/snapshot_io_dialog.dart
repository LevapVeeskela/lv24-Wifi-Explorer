import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../shared/i18n/app_localizations.dart';
import 'lv24_scan_file_name.dart';
import 'lv24_scan_types.dart';
import 'snapshot_platform_file.dart';
import 'workbench_file_picker.dart';
import 'workbench_snapshot.dart';

Future<void> showSaveSnapshotDialog(
  BuildContext context, {
  required WorkbenchSnapshotBundle bundle,
}) async {
  final l10n = AppLocalizations.of(context);
  final ru = l10n.localeName.startsWith('ru');

  if (snapshotFileIoSupported) {
    final picked = await pickWorkbenchSavePath(
      dialogTitle: l10n.scanMessage('scan.file.save'),
      fileName: bundle.fileName,
      allowedExtensions: ['lv24scan'],
    );
    if (picked == null) return;

    final path = ensureFileExtension(picked, 'lv24scan');
    final ok = await writeSnapshotFile(path, bundle.text);
    if (ok) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              ru ? 'Снимок сохранён: $path' : 'Snapshot saved: $path',
            ),
          ),
        );
      }
      return;
    }

    if (!context.mounted) return;
    await _showSaveSnapshotFallbackDialog(
      context,
      bundle: bundle,
      initialPath: path,
      initialWriteError: true,
    );
    return;
  }

  await _showSaveSnapshotFallbackDialog(context, bundle: bundle);
}

Future<void> _showSaveSnapshotFallbackDialog(
  BuildContext context, {
  required WorkbenchSnapshotBundle bundle,
  String? initialPath,
  bool initialWriteError = false,
}) async {
  final l10n = AppLocalizations.of(context);
  final ru = l10n.localeName.startsWith('ru');
  final pathController = TextEditingController(text: initialPath ?? bundle.fileName);
  final jsonController = TextEditingController(text: bundle.text);
  var copied = false;
  var wrote = false;
  var writeError = initialWriteError;

  await showDialog<void>(
    context: context,
    builder: (dialogContext) {
      return StatefulBuilder(
        builder: (context, setLocal) {
          Future<void> copyJson() async {
            await Clipboard.setData(ClipboardData(text: jsonController.text));
            setLocal(() => copied = true);
          }

          Future<void> writePath() async {
            if (!snapshotFileIoSupported) {
              setLocal(() => writeError = true);
              return;
            }
            final ok = await writeSnapshotFile(pathController.text, jsonController.text);
            setLocal(() {
              wrote = ok;
              writeError = !ok;
            });
          }

          return AlertDialog(
            title: Text(l10n.scanMessage('scan.file.save')),
            content: SizedBox(
              width: 560,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: pathController,
                      decoration: InputDecoration(
                        labelText: ru ? 'Путь к файлу (.lv24scan)' : 'File path (.lv24scan)',
                        hintText: suggestLv24ScanFileName(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: jsonController,
                      maxLines: 12,
                      readOnly: true,
                      decoration: InputDecoration(
                        labelText: ru ? 'JSON снимка' : 'Snapshot JSON',
                        alignLabelWithHint: true,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    if (copied)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          ru ? 'JSON скопирован в буфер обмена.' : 'JSON copied to clipboard.',
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
                              ? 'Не удалось записать файл (проверьте путь или вставьте JSON вручную).'
                              : 'Could not write file (check path or copy JSON manually).',
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
                onPressed: copyJson,
                child: Text(ru ? 'Копировать JSON' : 'Copy JSON'),
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
  jsonController.dispose();
}

Future<Lv24ScanDocument?> showOpenSnapshotDialog(BuildContext context) async {
  final l10n = AppLocalizations.of(context);

  if (snapshotFileIoSupported) {
    final picked = await pickWorkbenchOpenPath(
      dialogTitle: l10n.scanMessage('scan.file.open'),
      allowedExtensions: ['lv24scan'],
    );
    if (picked == null) return null;

    final text = await readSnapshotFile(picked);
    if (text != null) {
      final parsed = parseWorkbenchSnapshot(text, fileName: picked);
      switch (parsed) {
        case Lv24ScanParseOk(:final document):
          return document;
        case Lv24ScanParseError(error: final detail):
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  l10n.scanMessage('scan.snapshot.openError', {'detail': detail}),
                ),
              ),
            );
          }
          if (!context.mounted) return null;
          return _showOpenSnapshotFallbackDialog(
            context,
            initialPath: picked,
            initialJson: text,
            initialError: l10n.scanMessage('scan.snapshot.openError', {'detail': detail}),
          );
      }
    }

    if (!context.mounted) return null;
    return _showOpenSnapshotFallbackDialog(
      context,
      initialPath: picked,
      initialError: l10n.scanMessage('scan.snapshot.openError', {'detail': 'read failed'}),
    );
  }

  return _showOpenSnapshotFallbackDialog(context);
}

Future<Lv24ScanDocument?> _showOpenSnapshotFallbackDialog(
  BuildContext context, {
  String? initialPath,
  String? initialJson,
  String? initialError,
}) async {
  final l10n = AppLocalizations.of(context);
  final pathController = TextEditingController(text: initialPath ?? '');
  final jsonController = TextEditingController(text: initialJson ?? '');
  String? error = initialError;

  final result = await showDialog<Lv24ScanDocument?>(
    context: context,
    builder: (dialogContext) {
      return StatefulBuilder(
        builder: (context, setLocal) {
          Future<void> loadPath() async {
            if (!snapshotFileIoSupported) return;
            final text = await readSnapshotFile(pathController.text);
            if (text == null) {
              setLocal(
                () => error = l10n.scanMessage('scan.snapshot.openError', {'detail': 'read failed'}),
              );
              return;
            }
            jsonController.text = text;
            setLocal(() => error = null);
          }

          void parseAndClose() {
            if (jsonController.text.trim().isEmpty) return;
            final parsed = parseWorkbenchSnapshot(
              jsonController.text,
              fileName: pathController.text.trim().isEmpty ? null : pathController.text.trim(),
            );
            switch (parsed) {
              case Lv24ScanParseOk(:final document):
                Navigator.pop(dialogContext, document);
              case Lv24ScanParseError(error: final detail):
                setLocal(
                  () => error = l10n.scanMessage('scan.snapshot.openError', {'detail': detail}),
                );
            }
          }

          return AlertDialog(
            title: Text(l10n.scanMessage('scan.file.open')),
            content: SizedBox(
              width: 560,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: pathController,
                      decoration: InputDecoration(
                        labelText: l10n.localeName.startsWith('ru')
                            ? 'Путь к .lv24scan (необязательно)'
                            : 'Path to .lv24scan (optional)',
                      ),
                      onSubmitted: (_) => loadPath(),
                    ),
                    if (snapshotFileIoSupported)
                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton(
                          onPressed: loadPath,
                          child: Text(
                            l10n.localeName.startsWith('ru') ? 'Загрузить с диска' : 'Load from disk',
                          ),
                        ),
                      ),
                    TextField(
                      controller: jsonController,
                      maxLines: 14,
                      decoration: InputDecoration(
                        labelText: l10n.localeName.startsWith('ru') ? 'Или вставьте JSON' : 'Or paste JSON',
                        alignLabelWithHint: true,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    if (error != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          error!,
                          style: TextStyle(color: Theme.of(context).colorScheme.error),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancel')),
              FilledButton(
                onPressed: parseAndClose,
                child: Text(l10n.localeName.startsWith('ru') ? 'Открыть' : 'Open'),
              ),
            ],
          );
        },
      );
    },
  );

  pathController.dispose();
  jsonController.dispose();
  return result;
}
