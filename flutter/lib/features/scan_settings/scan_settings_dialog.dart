import 'package:flutter/material.dart';

import '../annotations/annotations.dart';
import '../column_rules/column_rules.dart';
import '../scan_columns/scan_columns_scope.dart';
import 'persist.dart';
import 'scan_settings_controller.dart';
import 'scan_settings_scope.dart';
import 'scan_settings_window.dart';
import 'settings_tabs.dart';
import 'types.dart';

Future<void> showScanSettingsDialog(
  BuildContext context, {
  ScanSettingsController? controller,
  ColumnRulesController? columnRules,
  AnnotationsController? annotations,
  ScanWorkbenchSettings? settings,
  ValueChanged<ScanWorkbenchSettings>? onChanged,
  SettingsTabId initialTab = SettingsTabId.general,
}) {
  final ScanSettingsController resolvedController = controller ??
      ScanSettingsScope.maybeOf(context) ??
      _EphemeralScanSettingsController(
        initial: settings ?? loadScanWorkbenchSettings(),
        onChanged: onChanged,
      );
  // Overlay is a sibling of the workbench. Capture live controllers and
  // re-parent scopes above the dialog so columns toggles tint the table.
  final resolvedAnnotations =
      annotations ?? AnnotationsScope.maybeOf(context);
  final resolvedColumnRules =
      columnRules ?? ColumnRulesScope.maybeOf(context);
  final resolvedColumns = ScanColumnsScope.maybeOf(context);

  return showDialog<void>(
    context: context,
    builder: (dialogContext) {
      Widget dialog = ScanSettingsWindow(
        controller: resolvedController,
        annotations: resolvedAnnotations,
        initialTab: initialTab,
      );
      if (resolvedColumns != null) {
        dialog = ScanColumnsScope(
          controller: resolvedColumns,
          child: dialog,
        );
      }
      return ColumnRulesScope.overlay(
        controller: resolvedColumnRules,
        child: dialog,
      );
    },
  );
}

class _EphemeralScanSettingsController extends ScanSettingsController {
  _EphemeralScanSettingsController({
    required super.initial,
    this.onChanged,
  });

  final ValueChanged<ScanWorkbenchSettings>? onChanged;

  @override
  void replace(ScanWorkbenchSettings next) {
    super.replace(next);
    onChanged?.call(settings);
  }
}
