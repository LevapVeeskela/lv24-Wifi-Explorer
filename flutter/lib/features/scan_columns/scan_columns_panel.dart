import 'package:flutter/material.dart';

import '../../shared/i18n/app_localizations.dart';
import '../column_rules/column_rules.dart';
import 'scan_column_id.dart';
import 'scan_column_labels.dart';
import 'scan_column_profile.dart';
import 'scan_column_visibility.dart';
import 'scan_columns_controller.dart';
import 'scan_columns_scope.dart';

Future<void> showScanColumnsPanel(BuildContext context) {
  final controller = ScanColumnsScope.of(context);
  final columnRules = ColumnRulesScope.maybeOf(context);
  final l10n = AppLocalizations.of(context);
  return showDialog<void>(
    context: context,
    builder: (dialogContext) {
      Widget dialog = _ScanColumnsDialog(
        controller: controller,
        columnRules: columnRules,
        title: l10n.scanColumnsManage,
        resetLabel: l10n.scanColumnsReset,
        defaultProfileLabel: l10n.scanColumnsProfileDefault,
        saveProfileLabel: l10n.scanColumnsSaveProfile,
        deleteProfileLabel: l10n.scanColumnsDeleteProfile,
        profileNameHint: l10n.scanColumnsProfileNameHint,
        profilesLabel: l10n.scanColumnsProfiles,
      );
      return ColumnRulesScope.overlay(
        controller: columnRules,
        child: dialog,
      );
    },
  );
}

class ScanColumnsManageButton extends StatelessWidget {
  const ScanColumnsManageButton({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final controller = ScanColumnsScope.of(context);
    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final activeId =
            controller.activeProfileId ?? ScanColumnProfile.defaultId;
        final menuProfiles = _menuProfiles(controller);
        return PopupMenuButton<String>(
          tooltip: l10n.scanColumnsManage,
          icon: const Icon(Icons.view_column_outlined),
          onSelected: (value) {
            if (value == _manageAction) {
              showScanColumnsPanel(context);
              return;
            }
            controller.switchProfile(value);
          },
          itemBuilder: (context) {
            return [
              for (final profile in menuProfiles)
                CheckedPopupMenuItem<String>(
                  value: profile.id,
                  checked: profile.id == activeId,
                  child: Text(_profileLabel(l10n, profile)),
                ),
              const PopupMenuDivider(),
              PopupMenuItem<String>(
                value: _manageAction,
                child: Text(l10n.scanColumnsManage),
              ),
            ];
          },
        );
      },
    );
  }
}

const _manageAction = '__manage__';

List<ScanColumnProfile> _menuProfiles(ScanColumnsController controller) {
  return [
    ScanColumnProfile(
      id: ScanColumnProfile.defaultId,
      name: '',
      visibility: ScanColumnVisibility.defaults(),
    ),
    ...controller.customProfiles,
  ];
}

String _profileLabel(AppLocalizations l10n, ScanColumnProfile profile) {
  if (profile.isBuiltInDefault) return l10n.scanColumnsProfileDefault;
  return profile.name;
}

class _ScanColumnsDialog extends StatefulWidget {
  const _ScanColumnsDialog({
    required this.controller,
    this.columnRules,
    required this.title,
    required this.resetLabel,
    required this.defaultProfileLabel,
    required this.saveProfileLabel,
    required this.deleteProfileLabel,
    required this.profileNameHint,
    required this.profilesLabel,
  });

  final ScanColumnsController controller;
  final ColumnRulesController? columnRules;
  final String title;
  final String resetLabel;
  final String defaultProfileLabel;
  final String saveProfileLabel;
  final String deleteProfileLabel;
  final String profileNameHint;
  final String profilesLabel;

  @override
  State<_ScanColumnsDialog> createState() => _ScanColumnsDialogState();
}

class _ScanColumnsDialogState extends State<_ScanColumnsDialog> {
  late ScanColumnVisibility _draft;
  late String _selectedProfileId;

  @override
  void initState() {
    super.initState();
    _draft = widget.controller.visibility;
    _selectedProfileId =
        widget.controller.activeProfileId ?? ScanColumnProfile.defaultId;
  }

  List<ScanColumnProfile> get _allProfiles => [
        ScanColumnProfile(
          id: ScanColumnProfile.defaultId,
          name: widget.defaultProfileLabel,
          visibility: ScanColumnVisibility.defaults(),
        ),
        ...widget.controller.customProfiles,
      ];

  String _labelFor(ScanColumnProfile profile) {
    if (profile.isBuiltInDefault) return widget.defaultProfileLabel;
    return profile.name;
  }

  ScanColumnProfile? _profileForId(String id) {
    for (final profile in _allProfiles) {
      if (profile.id == id) return profile;
    }
    return null;
  }

  Future<void> _save() async {
    await widget.controller.setVisibility(_draft);
    final selected = _profileForId(_selectedProfileId);
    if (selected != null && selected.visibility == _draft) {
      await widget.controller.setActiveProfileId(_selectedProfileId);
    } else {
      await widget.controller.setActiveProfileId(null);
    }
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _reset() async {
    await widget.controller.resetToDefaults();
    if (!mounted) return;
    setState(() {
      _draft = ScanColumnVisibility.defaults();
      _selectedProfileId = ScanColumnProfile.defaultId;
    });
  }

  Future<void> _promptSaveProfile() async {
    final material = MaterialLocalizations.of(context);
    final nameController = TextEditingController(
      text: _selectedProfileId == ScanColumnProfile.defaultId
          ? ''
          : _profileForId(_selectedProfileId)?.name ?? '',
    );
    final savedName = await showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(widget.saveProfileLabel),
          content: TextField(
            controller: nameController,
            autofocus: true,
            decoration: InputDecoration(hintText: widget.profileNameHint),
            onSubmitted: (value) => Navigator.of(context).pop(value),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(material.cancelButtonLabel),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(nameController.text),
              child: Text(material.saveButtonLabel),
            ),
          ],
        );
      },
    );
    nameController.dispose();
    if (savedName == null || savedName.trim().isEmpty) return;
    await widget.controller.saveNamedProfile(savedName, _draft);
    if (!mounted) return;
    setState(() {
      _selectedProfileId =
          widget.controller.activeProfileId ?? ScanColumnProfile.defaultId;
    });
  }

  Future<void> _deleteSelectedProfile() async {
    if (_selectedProfileId == ScanColumnProfile.defaultId) return;
    await widget.controller.deleteProfile(_selectedProfileId);
    if (!mounted) return;
    setState(() {
      _selectedProfileId = ScanColumnProfile.defaultId;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final material = MaterialLocalizations.of(context);
    final canDelete = _selectedProfileId != ScanColumnProfile.defaultId;
    final dropdownValue = _allProfiles.any((p) => p.id == _selectedProfileId)
        ? _selectedProfileId
        : ScanColumnProfile.defaultId;
    return AlertDialog(
      title: Text(widget.title),
      content: SizedBox(
        width: 360,
        child: ListView(
          shrinkWrap: true,
          children: [
            Text(widget.profilesLabel,
                style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: dropdownValue,
                    decoration: const InputDecoration(
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                    items: [
                      for (final profile in _allProfiles)
                        DropdownMenuItem(
                          value: profile.id,
                          child: Text(_labelFor(profile)),
                        ),
                    ],
                    onChanged: (profileId) {
                      if (profileId == null) return;
                      final profile = _profileForId(profileId);
                      if (profile == null) return;
                      setState(() {
                        _selectedProfileId = profileId;
                        _draft = profile.visibility;
                      });
                    },
                  ),
                ),
                IconButton(
                  tooltip: widget.saveProfileLabel,
                  onPressed: _promptSaveProfile,
                  icon: const Icon(Icons.save_outlined),
                ),
                IconButton(
                  tooltip: widget.deleteProfileLabel,
                  onPressed: canDelete ? _deleteSelectedProfile : null,
                  icon: const Icon(Icons.delete_outline),
                ),
              ],
            ),
            const SizedBox(height: 12),
            for (final id in ScanColumnId.ordered)
              CheckboxListTile(
                value: _draft.isVisible(id),
                onChanged: (value) {
                  if (value == null) return;
                  setState(() => _draft = _draft.withVisible(id, value));
                },
                title: Text(scanColumnLabel(l10n, id)),
                controlAffinity: ListTileControlAffinity.leading,
                dense: true,
              ),
            if (widget.columnRules != null) ...[
              const Divider(),
              ColumnRulesSettingsSection(controller: widget.columnRules),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _reset,
          child: Text(widget.resetLabel),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(material.cancelButtonLabel),
        ),
        FilledButton(
          onPressed: _save,
          child: Text(material.okButtonLabel),
        ),
      ],
    );
  }
}
