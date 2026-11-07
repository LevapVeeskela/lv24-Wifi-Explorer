import 'package:flutter/material.dart';
import 'package:lv24_sunset_theme/lv24_sunset_theme.dart';

import 'column_rule_cell_class.dart';

/// Background tint for a column-rule cell (Electron `ScanDataGrid/styles.ts`).
Color? columnRuleCellBackground(
  ColorScheme scheme,
  LvTokens tokens,
  ColumnRuleCellClass? ruleClass,
) {
  if (ruleClass == null) return null;
  return switch (ruleClass) {
    ColumnRuleCellClass.qualityExcellent =>
      tokens.success.withValues(alpha: 0.14),
    ColumnRuleCellClass.qualityGood => tokens.success.withValues(alpha: 0.10),
    ColumnRuleCellClass.qualityFair => tokens.warning.withValues(alpha: 0.12),
    ColumnRuleCellClass.qualityPoor => tokens.warning.withValues(alpha: 0.18),
    ColumnRuleCellClass.qualityUnusable =>
      scheme.error.withValues(alpha: 0.16),
    ColumnRuleCellClass.securityOpen =>
      tokens.warning.withValues(alpha: 0.22),
    ColumnRuleCellClass.securityWeak =>
      scheme.error.withValues(alpha: 0.14),
  };
}
