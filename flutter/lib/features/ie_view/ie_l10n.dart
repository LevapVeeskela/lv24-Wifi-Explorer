import 'package:scan_domain/scan_domain.dart';
import 'package:scan_l10n/scan_l10n.dart';

String localizeIeTreeLabel(ScanL10n l10n, IeTreeNode node) {
  final key = node.messageKey;
  if (key == null) return node.label;
  return l10n.tryMessage(key, node.messageValues) ?? node.label;
}

String localizeIeTreeValue(ScanL10n l10n, String? value) {
  if (value == null) return '';
  return switch (value) {
    'yes' => l10n.message('scan.ie.yes'),
    'no' => l10n.message('scan.ie.no'),
    '(hidden)' => l10n.message('scan.ie.hiddenValue'),
    'set' => l10n.message('scan.ie.flagSet'),
    'WPA IE' => l10n.message('scan.ie.wpaIe'),
    'absent' => l10n.message('scan.ie.levelAbsent'),
    'raw-only' => l10n.message('scan.ie.levelRawOnly'),
    'shallow-tags' => l10n.message('scan.ie.levelShallowTags'),
    'unsupported-deep' => l10n.message('scan.ie.levelUnsupportedDeep'),
    _ => value,
  };
}
