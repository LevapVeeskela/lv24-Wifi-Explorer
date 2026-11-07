import 'package:flutter/material.dart';

import '../features/appearance/appearance.dart';
import '../features/export/csv_export_scope.dart';
import '../features/scan_columns/scan_columns_panel.dart';
import '../features/scan_filters/scan_filters.dart';
import '../features/scan_search/scan_search_field.dart';
import '../features/scan_settings/scan_settings_dialog.dart';
import '../features/scan_settings/scan_settings_scope.dart';
import '../features/scan_settings/types.dart';
import '../shared/i18n/app_localizations.dart';
import 'about_dialog.dart';

class ScanAppBar extends StatefulWidget implements PreferredSizeWidget {
  const ScanAppBar({
    super.key,
    required this.running,
    required this.demo,
    required this.onStart,
    required this.onStop,
    required this.filters,
    required this.onFiltersChange,
    this.onOpenSnapshot,
    this.onSaveSnapshot,
    this.onExportCsv,
    this.onPrintVisible,
    this.exportSelectedEnabled = false,
    this.scanSettings,
    this.onScanSettingsChange,
  });

  final bool running;
  final bool demo;
  final VoidCallback onStart;
  final VoidCallback onStop;
  final ScanWorkbenchFilters filters;
  final ValueChanged<ScanWorkbenchFilters> onFiltersChange;
  final VoidCallback? onOpenSnapshot;
  final VoidCallback? onSaveSnapshot;
  final void Function(CsvExportScope scope)? onExportCsv;
  final VoidCallback? onPrintVisible;
  final bool exportSelectedEnabled;
  final ScanWorkbenchSettings? scanSettings;
  final ValueChanged<ScanWorkbenchSettings>? onScanSettingsChange;

  @override
  Size get preferredSize => const Size.fromHeight(112);

  @override
  State<ScanAppBar> createState() => _ScanAppBarState();
}

enum _ScanAppBarMenuAction { about }

class _ScanAppBarState extends State<ScanAppBar> {
  ScanWorkbenchFilters get _filters => widget.filters;

  void _openScanSettings() {
    final scope = ScanSettingsScope.maybeOf(context);
    if (scope != null) {
      showScanSettingsDialog(context, controller: scope);
      return;
    }
    final settings = widget.scanSettings;
    final onChange = widget.onScanSettingsChange;
    if (settings != null && onChange != null) {
      showScanSettingsDialog(
        context,
        settings: settings,
        onChanged: onChange,
      );
      return;
    }
    showScanSettingsDialog(context);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final scheme = Theme.of(context).colorScheme;

    return Material(
      color: scheme.surface,
      elevation: 0,
      child: SafeArea(
        bottom: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              height: 56,
              child: Row(
                children: [
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      l10n.appTitle,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  if (widget.demo)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Chip(
                        visualDensity: VisualDensity.compact,
                        label: Text(l10n.demoChip),
                        avatar: const Icon(Icons.science_outlined, size: 16),
                      ),
                    ),
                  if (widget.running)
                    FilledButton.tonal(
                      onPressed: widget.onStop,
                      child: Text(l10n.scanStop),
                    )
                  else
                    FilledButton(
                      onPressed: widget.onStart,
                      child: Text(l10n.scanStart),
                    ),
                  MenuAnchor(
                    menuChildren: [
                      MenuItemButton(
                        onPressed: widget.onOpenSnapshot,
                        child: Text(l10n.scanMessage('scan.file.open')),
                      ),
                      MenuItemButton(
                        onPressed: widget.onSaveSnapshot,
                        child: Text(l10n.scanMessage('scan.file.save')),
                      ),
                      if (widget.onExportCsv != null)
                        SubmenuButton(
                          menuChildren: [
                            MenuItemButton(
                              onPressed: () =>
                                  widget.onExportCsv!(CsvExportScope.visible),
                              child: Text(l10n.scanExportVisible),
                            ),
                            MenuItemButton(
                              onPressed: widget.exportSelectedEnabled
                                  ? () => widget.onExportCsv!(
                                        CsvExportScope.selected,
                                      )
                                  : null,
                              child: Text(l10n.scanExportSelected),
                            ),
                            MenuItemButton(
                              onPressed: () =>
                                  widget.onExportCsv!(CsvExportScope.all),
                              child: Text(l10n.scanExportAll),
                            ),
                          ],
                          child: Text(l10n.scanExportCsv),
                        ),
                      if (widget.onPrintVisible != null) ...[
                        const Divider(height: 1),
                        MenuItemButton(
                          onPressed: widget.onPrintVisible,
                          child: Text(l10n.scanMessage('scan.print.visible')),
                        ),
                      ],
                    ],
                    builder: (context, controller, child) {
                      return TextButton(
                        onPressed: widget.onOpenSnapshot == null &&
                                widget.onSaveSnapshot == null &&
                                widget.onExportCsv == null &&
                                widget.onPrintVisible == null
                            ? null
                            : () {
                                if (controller.isOpen) {
                                  controller.close();
                                } else {
                                  controller.open();
                                }
                              },
                        child: Text(l10n.scanMessage('scan.file.menu')),
                      );
                    },
                  ),
                  const ScanColumnsManageButton(),
                  const ThemePreferenceToggle(),
                  IconButton(
                    tooltip: l10n.scanSettingsOpen,
                    onPressed: _openScanSettings,
                    icon: const Icon(Icons.settings_outlined),
                  ),
                  PopupMenuButton<_ScanAppBarMenuAction>(
                    tooltip: l10n.scanMessage('scan.status.about'),
                    onSelected: (action) {
                      switch (action) {
                        case _ScanAppBarMenuAction.about:
                          showScanAboutDialog(context);
                      }
                    },
                    itemBuilder: (context) => [
                      PopupMenuItem(
                        value: _ScanAppBarMenuAction.about,
                        child: Text(l10n.scanMessage('scan.status.about')),
                      ),
                    ],
                  ),
                  const SizedBox(width: 8),
                ],
              ),
            ),
            SizedBox(
              height: 48,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
                child: Row(
                  children: [
                  Semantics(
                    label: l10n.scanMessage('scan.filter.band'),
                    child: SegmentedButton<BandFilterValue>(
                      showSelectedIcon: false,
                      segments: [
                        ButtonSegment(
                          value: BandFilterValue.all,
                          label: Text(
                            l10n.scanMessage('scan.filter.band.all'),
                          ),
                        ),
                        ButtonSegment(
                          value: BandFilterValue.ghz24,
                          label: Text(
                            l10n.scanMessage('scan.filter.band.24'),
                          ),
                        ),
                        ButtonSegment(
                          value: BandFilterValue.ghz5,
                          label: Text(
                            l10n.scanMessage('scan.filter.band.5'),
                          ),
                        ),
                        ButtonSegment(
                          value: BandFilterValue.ghz6,
                          label: Text(
                            l10n.scanMessage('scan.filter.band.6'),
                          ),
                        ),
                      ],
                      selected: {_filters.band},
                      onSelectionChanged: (next) {
                        if (next.isEmpty) return;
                        widget.onFiltersChange(
                          _filters.copyWith(band: next.first),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Semantics(
                    label: l10n.scanMessage('scan.filter.secure'),
                    child: SegmentedButton<SecurityFilterValue>(
                      multiSelectionEnabled: true,
                      showSelectedIcon: false,
                      emptySelectionAllowed: true,
                      segments: [
                        ButtonSegment(
                          value: SecurityFilterValue.open,
                          label: Text(
                            l10n.scanMessage('scan.filter.open'),
                          ),
                        ),
                        ButtonSegment(
                          value: SecurityFilterValue.secure,
                          label: Text(
                            l10n.scanMessage('scan.filter.secure'),
                          ),
                        ),
                      ],
                      selected: _filters.security.toSet(),
                      onSelectionChanged: (next) {
                        widget.onFiltersChange(
                          _filters.copyWith(security: next.toList()),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  ScanSearchField(
                    searchQuery: _filters.searchQuery,
                    onChanged: (value) {
                      if (_filters.searchQuery == value) return;
                      widget.onFiltersChange(
                        _filters.copyWith(searchQuery: value),
                      );
                    },
                  ),
                  const SizedBox(width: 8),
                  ScanVendorFilterField(
                    vendorQuery: _filters.vendorQuery,
                    onChanged: (value) {
                      if (_filters.vendorQuery == value) return;
                      widget.onFiltersChange(
                        _filters.copyWith(vendorQuery: value),
                      );
                    },
                  ),
                  const SizedBox(width: 8),
                  ScanMinRssiFilter(
                    minRssiDbm: _filters.minRssiDbm,
                    onChanged: (next) {
                      if (_filters.minRssiDbm == next) return;
                      if (next == null) {
                        widget.onFiltersChange(
                          _filters.copyWith(clearMinRssi: true),
                        );
                      } else {
                        widget.onFiltersChange(
                          _filters.copyWith(minRssiDbm: next),
                        );
                      }
                    },
                  ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
