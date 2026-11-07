import 'package:scan_domain/scan_domain.dart';

/// Semantic cell highlight (Electron `scan-grid-cell--*` classes).
enum ColumnRuleCellClass {
  qualityExcellent,
  qualityGood,
  qualityFair,
  qualityPoor,
  qualityUnusable,
  securityOpen,
  securityWeak,
}

const qualityToCellClass = {
  SignalQuality.excellent: ColumnRuleCellClass.qualityExcellent,
  SignalQuality.good: ColumnRuleCellClass.qualityGood,
  SignalQuality.fair: ColumnRuleCellClass.qualityFair,
  SignalQuality.poor: ColumnRuleCellClass.qualityPoor,
  SignalQuality.unusable: ColumnRuleCellClass.qualityUnusable,
};
