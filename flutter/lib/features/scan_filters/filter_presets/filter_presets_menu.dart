import 'package:flutter/material.dart';

import '../../../shared/i18n/app_localizations.dart';
import '../../../shared/i18n/workbench_l10n_ext.dart';
import 'filter_preset.dart';

/// AppBar-style control for saved filter presets: apply, delete, or save the
/// current filters under a new name.
class FilterPresetsMenu extends StatelessWidget {
  const FilterPresetsMenu({
    super.key,
    required this.presets,
    required this.onApply,
    required this.onDelete,
    required this.onSave,
  });

  final List<FilterPreset> presets;
  final ValueChanged<FilterPreset> onApply;
  final ValueChanged<String> onDelete;
  final ValueChanged<String> onSave;

  static const _saveValue = '__save__';

  Future<void> _promptSave(BuildContext context) async {
    final l10n = AppLocalizations.of(context);
    final material = MaterialLocalizations.of(context);
    final controller = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(l10n.filterPresetsSave),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLength: maxFilterPresetNameLength,
          decoration: InputDecoration(hintText: l10n.filterPresetsNewName),
          onSubmitted: (value) => Navigator.of(dialogContext).pop(value),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text(material.cancelButtonLabel),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(controller.text),
            child: Text(material.saveButtonLabel),
          ),
        ],
      ),
    );
    controller.dispose();
    final trimmed = name?.trim() ?? '';
    if (trimmed.isNotEmpty) onSave(trimmed);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return PopupMenuButton<String>(
      tooltip: l10n.filterPresetsTitle,
      icon: const Icon(Icons.bookmark_add_outlined, size: 20),
      onSelected: (value) {
        if (value == _saveValue) {
          _promptSave(context);
          return;
        }
        for (final preset in presets) {
          if (preset.id == value) {
            onApply(preset);
            return;
          }
        }
      },
      itemBuilder: (menuContext) => [
        if (presets.isEmpty)
          PopupMenuItem<String>(
            enabled: false,
            child: Text(
              l10n.filterPresetsEmpty,
              style: Theme.of(menuContext).textTheme.bodySmall,
            ),
          )
        else
          for (final preset in presets)
            PopupMenuItem<String>(
              value: preset.id,
              child: Row(
                children: [
                  Expanded(
                    child: Text(preset.name, overflow: TextOverflow.ellipsis),
                  ),
                  IconButton(
                    tooltip: l10n.filterPresetsDelete(preset.name),
                    iconSize: 18,
                    visualDensity: VisualDensity.compact,
                    onPressed: () {
                      Navigator.of(menuContext).pop();
                      onDelete(preset.id);
                    },
                    icon: const Icon(Icons.delete_outline, size: 18),
                  ),
                ],
              ),
            ),
        const PopupMenuDivider(),
        PopupMenuItem<String>(
          value: _saveValue,
          child: Row(
            children: [
              const Icon(Icons.bookmark_add_outlined, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(l10n.filterPresetsSave)),
            ],
          ),
        ),
      ],
    );
  }
}
