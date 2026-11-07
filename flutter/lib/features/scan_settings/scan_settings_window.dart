import 'package:flutter/material.dart';

import '../../shared/i18n/app_localizations.dart';
import '../annotations/annotations.dart';
import 'normalize.dart';
import 'scan_settings_advanced_panel.dart';
import 'scan_settings_annotations_panel.dart';
import 'scan_settings_columns_panel.dart';
import 'scan_settings_controller.dart';
import 'scan_settings_general_panel.dart';
import 'scan_settings_vendor_panel.dart';
import 'settings_tabs.dart';
import 'types.dart';

class ScanSettingsWindow extends StatefulWidget {
  const ScanSettingsWindow({
    super.key,
    required this.controller,
    this.annotations,
    this.initialTab = SettingsTabId.general,
  });

  final ScanSettingsController controller;
  final AnnotationsController? annotations;
  final SettingsTabId initialTab;

  @override
  State<ScanSettingsWindow> createState() => _ScanSettingsWindowState();
}

class _ScanSettingsWindowState extends State<ScanSettingsWindow> {
  late ScanWorkbenchSettings _draft;
  late SettingsTabId _tab;

  @override
  void initState() {
    super.initState();
    _draft = widget.controller.settings;
    _tab = widget.initialTab;
    widget.controller.addListener(_syncFromController);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_syncFromController);
    super.dispose();
  }

  void _syncFromController() {
    if (!mounted) return;
    setState(() => _draft = widget.controller.settings);
  }

  void _commit(ScanWorkbenchSettings next) {
    setState(() => _draft = normalizeScanWorkbenchSettings(next));
    widget.controller.replace(_draft);
  }

  String _tabLabel(AppLocalizations l10n, SettingsTabId id) {
    return switch (id) {
      SettingsTabId.general => l10n.scanSettingsTabGeneral,
      SettingsTabId.columns => l10n.scanSettingsTabColumns,
      SettingsTabId.annotations => l10n.scanSettingsTabAnnotations,
      SettingsTabId.vendor => l10n.scanSettingsTabVendor,
      SettingsTabId.advanced => l10n.scanSettingsTabAdvanced,
    };
  }

  Widget _panel() {
    switch (_tab) {
      case SettingsTabId.columns:
        return const ScanSettingsColumnsPanel();
      case SettingsTabId.annotations:
        return ScanSettingsAnnotationsPanel(controller: widget.annotations);
      case SettingsTabId.vendor:
        return const ScanSettingsVendorPanel();
      case SettingsTabId.advanced:
        return ScanSettingsAdvancedPanel(settings: _draft, onChanged: _commit);
      case SettingsTabId.general:
        return ScanSettingsGeneralPanel(settings: _draft, onChanged: _commit);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final width = MediaQuery.sizeOf(context).width;
    final stacked = width < 640;

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 800, maxHeight: 560),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      l10n.scanSettingsWindowTitle,
                      style: theme.textTheme.titleLarge,
                    ),
                  ),
                  IconButton(
                    tooltip: l10n.scanSettingsClose,
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: stacked
                  ? _StackedSettingsBody(
                      tab: _tab,
                      onTab: (id) => setState(() => _tab = id),
                      tabLabel: (id) => _tabLabel(l10n, id),
                      panel: _panel(),
                    )
                  : _SplitSettingsBody(
                      tab: _tab,
                      onTab: (id) => setState(() => _tab = id),
                      tabLabel: (id) => _tabLabel(l10n, id),
                      navLabel: l10n.scanSettingsTitle,
                      panel: _panel(),
                    ),
            ),
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text(l10n.scanSettingsClose),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SplitSettingsBody extends StatelessWidget {
  const _SplitSettingsBody({
    required this.tab,
    required this.onTab,
    required this.tabLabel,
    required this.navLabel,
    required this.panel,
  });

  final SettingsTabId tab;
  final ValueChanged<SettingsTabId> onTab;
  final String Function(SettingsTabId) tabLabel;
  final String navLabel;
  final Widget panel;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          width: 200,
          child: ListView(
            padding: const EdgeInsets.symmetric(vertical: 8),
            children: [
              for (final id in settingsTabs)
                ListTile(
                  selected: tab == id,
                  title: Text(tabLabel(id)),
                  onTap: () => onTab(id),
                ),
            ],
          ),
        ),
        const VerticalDivider(width: 1),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  tabLabel(tab),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: SingleChildScrollView(child: panel),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _StackedSettingsBody extends StatelessWidget {
  const _StackedSettingsBody({
    required this.tab,
    required this.onTab,
    required this.tabLabel,
    required this.panel,
  });

  final SettingsTabId tab;
  final ValueChanged<SettingsTabId> onTab;
  final String Function(SettingsTabId) tabLabel;
  final Widget panel;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DropdownButtonFormField<SettingsTabId>(
            value: tab,
            decoration: InputDecoration(
              isDense: true,
              labelText: tabLabel(tab),
            ),
            items: [
              for (final id in settingsTabs)
                DropdownMenuItem(value: id, child: Text(tabLabel(id))),
            ],
            onChanged: (id) {
              if (id == null) return;
              onTab(id);
            },
          ),
          const SizedBox(height: 12),
          Expanded(child: SingleChildScrollView(child: panel)),
        ],
      ),
    );
  }
}
