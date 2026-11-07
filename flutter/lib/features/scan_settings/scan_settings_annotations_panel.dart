import 'package:flutter/material.dart';

import '../../shared/i18n/app_localizations.dart';
import '../annotations/annotations.dart';

class ScanSettingsAnnotationsPanel extends StatefulWidget {
  const ScanSettingsAnnotationsPanel({super.key, this.controller});

  final AnnotationsController? controller;

  @override
  State<ScanSettingsAnnotationsPanel> createState() =>
      _ScanSettingsAnnotationsPanelState();
}

class _ScanSettingsAnnotationsPanelState
    extends State<ScanSettingsAnnotationsPanel> {
  final _pattern = TextEditingController();
  final _text = TextEditingController();

  @override
  void dispose() {
    _pattern.dispose();
    _text.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final controller = widget.controller;
    if (controller == null) {
      return Text(
        l10n.scanSettingsAnnotationsEmpty,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
      );
    }

    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final rules = controller.rules;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton(
                  onPressed: () => showImportAnnotationCsvDialog(
                    context,
                    controller: controller,
                  ),
                  child: Text(l10n.scanSettingsAnnotationsImport),
                ),
                OutlinedButton(
                  onPressed: rules.isEmpty
                      ? null
                      : () => showExportAnnotationCsvDialog(
                            context,
                            controller: controller,
                          ),
                  child: Text(l10n.scanSettingsAnnotationsExport),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _pattern,
              decoration: InputDecoration(
                isDense: true,
                labelText: l10n.scanSettingsAnnotationsPattern,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _text,
              decoration: InputDecoration(
                isDense: true,
                labelText: l10n.scanSettingsAnnotationsText,
              ),
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: FilledButton(
                onPressed: () {
                  final pattern = _pattern.text.trim();
                  final text = _text.text.trim();
                  if (pattern.isEmpty || text.isEmpty) return;
                  controller.upsertRule(bssidPattern: pattern, text: text);
                  _pattern.clear();
                  _text.clear();
                },
                child: Text(l10n.scanSettingsAnnotationsAdd),
              ),
            ),
            const SizedBox(height: 16),
            if (rules.isEmpty)
              Text(
                l10n.scanSettingsAnnotationsEmpty,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              )
            else
              for (final rule in rules)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(rule.bssidPattern),
                  subtitle: Text(rule.text),
                  trailing: IconButton(
                    tooltip: l10n.scanSettingsAnnotationsRemove,
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () => controller.removeRule(rule.id),
                  ),
                ),
          ],
        );
      },
    );
  }
}
