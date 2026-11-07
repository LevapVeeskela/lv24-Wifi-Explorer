import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../snapshot/snapshot_platform_file.dart';
import 'annotation_csv.dart';
import 'annotation_l10n.dart';
import 'annotations_controller.dart';

const annotationCsvDefaultFileName = 'lv24-annotations.csv';

Future<void> showExportAnnotationCsvDialog(
  BuildContext context, {
  required AnnotationsController controller,
}) async {
  final csv = exportAnnotationCsv(controller.rules);
  final pathController = TextEditingController(text: annotationCsvDefaultFileName);
  final csvController = TextEditingController(text: csv);
  var copied = false;
  var wrote = false;
  var writeError = false;

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
            title: Text(context.annotationExportCsvTitle),
            content: SizedBox(
              width: 560,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      context.annotationCsvRuleCount(controller.rules.length),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: pathController,
                      decoration: InputDecoration(
                        labelText: context.annotationCsvFilePathLabel,
                        hintText: annotationCsvDefaultFileName,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: csvController,
                      maxLines: 12,
                      readOnly: true,
                      decoration: InputDecoration(
                        labelText: context.annotationCsvTextLabel,
                        alignLabelWithHint: true,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    if (copied)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          context.annotationCsvCopiedMessage,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    if (wrote)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          context.annotationCsvWrittenMessage,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    if (writeError)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          context.annotationCsvWriteErrorMessage,
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
                child: Text(context.annotationDialogClose),
              ),
              TextButton(
                onPressed: copyCsv,
                child: Text(context.annotationCopyCsv),
              ),
              if (snapshotFileIoSupported)
                FilledButton(
                  onPressed: writePath,
                  child: Text(context.annotationWriteFile),
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

Future<void> showImportAnnotationCsvDialog(
  BuildContext context, {
  required AnnotationsController controller,
}) async {
  final pathController = TextEditingController();
  final csvController = TextEditingController();

  await showDialog<void>(
    context: context,
    builder: (dialogContext) {
      return StatefulBuilder(
        builder: (context, setLocal) {
          Future<void> loadPath() async {
            if (!snapshotFileIoSupported) return;
            final text = await readSnapshotFile(pathController.text);
            if (text == null) {
              setLocal(() {});
              return;
            }
            csvController.text = text;
            setLocal(() {});
          }

          void importAndClose() {
            if (csvController.text.trim().isEmpty) return;
            final rules = importAnnotationCsv(csvController.text);
            controller.setRules(rules);
            Navigator.pop(dialogContext);
          }

          return AlertDialog(
            title: Text(context.annotationImportCsvTitle),
            content: SizedBox(
              width: 560,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      context.annotationImportCsvHint,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: pathController,
                      decoration: InputDecoration(
                        labelText: context.annotationCsvOptionalPathLabel,
                      ),
                      onSubmitted: (_) => loadPath(),
                    ),
                    if (snapshotFileIoSupported)
                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton(
                          onPressed: loadPath,
                          child: Text(context.annotationLoadFromDisk),
                        ),
                      ),
                    TextField(
                      controller: csvController,
                      maxLines: 14,
                      decoration: InputDecoration(
                        labelText: context.annotationPasteCsvLabel,
                        alignLabelWithHint: true,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: Text(context.annotationDialogClose),
              ),
              FilledButton(
                onPressed: importAndClose,
                child: Text(context.annotationImportCsvAction),
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
