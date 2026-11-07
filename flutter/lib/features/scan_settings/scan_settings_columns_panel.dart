import 'package:flutter/material.dart';

import '../../shared/i18n/app_localizations.dart';
import '../column_rules/column_rules.dart';
import '../scan_columns/scan_columns_panel.dart';
import '../scan_columns/scan_columns_scope.dart';

/// Columns tab: visibility shortcut + Electron cell-highlighting switches.
///
/// Switches bind to the inherited [ColumnRulesScope] (the workbench
/// controller re-parented via [ColumnRulesScope.overlay]) — no second
/// controller is created here.
class ScanSettingsColumnsPanel extends StatelessWidget {
  const ScanSettingsColumnsPanel({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final canOpenVisibility = ScanColumnsScope.maybeOf(context) != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (canOpenVisibility)
          Align(
            alignment: Alignment.centerLeft,
            child: OutlinedButton.icon(
              onPressed: () => showScanColumnsPanel(context),
              icon: const Icon(Icons.view_column_outlined),
              label: Text(l10n.scanSettingsColumnsOpenVisibility),
            ),
          ),
        if (canOpenVisibility) const SizedBox(height: 16),
        const ColumnRulesSettingsSection(),
      ],
    );
  }
}
