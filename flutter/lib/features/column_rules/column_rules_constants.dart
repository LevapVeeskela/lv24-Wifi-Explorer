import 'column_rules_config.dart';

/// Columns tinted when RSSI / quality highlighting is on (Electron field ids).
const rssiHighlightFields = {
  'signal',
  'rssiDbm',
  'rssi',
  'snrDb',
  'noiseDbm',
};

/// Columns tinted when security highlighting is on.
const securityHighlightFields = {'securityLock', 'security'};

const defaultColumnRules = ColumnRulesConfig(
  enabled: true,
  highlights: [ColumnRulesHighlight.rssi, ColumnRulesHighlight.security],
);
