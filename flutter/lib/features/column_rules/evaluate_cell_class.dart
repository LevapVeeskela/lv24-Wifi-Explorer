import 'package:scan_domain/scan_domain.dart';

import 'column_rule_cell_class.dart';
import 'column_rules_config.dart';
import 'column_rules_constants.dart';

bool _isWeakSecurity(ObservedBss row) {
  if (row.security.isOpen) return true;
  final primary = row.security.primary;
  return primary == SecurityKind.wep || primary == SecurityKind.dynamicWep;
}

/// Returns highlight classes for a grid cell under the active column color rules.
List<ColumnRuleCellClass> columnRuleClassesForCell(
  ObservedBss row,
  String field,
  ColumnRulesConfig config,
) {
  if (!config.enabled) return const [];

  final classes = <ColumnRuleCellClass>[];

  if (config.highlights.contains(ColumnRulesHighlight.rssi) &&
      rssiHighlightFields.contains(field)) {
    final qualityClass = qualityToCellClass[row.signal.quality];
    if (qualityClass != null) {
      classes.add(qualityClass);
    }
  }

  if (config.highlights.contains(ColumnRulesHighlight.security) &&
      securityHighlightFields.contains(field)) {
    if (row.security.isOpen) {
      classes.add(ColumnRuleCellClass.securityOpen);
    } else if (_isWeakSecurity(row)) {
      classes.add(ColumnRuleCellClass.securityWeak);
    }
  }

  return classes;
}

ColumnRuleCellClass? columnRuleClassForCell(
  ObservedBss row,
  String field,
  ColumnRulesConfig config,
) {
  final classes = columnRuleClassesForCell(row, field, config);
  return classes.isEmpty ? null : classes.first;
}
