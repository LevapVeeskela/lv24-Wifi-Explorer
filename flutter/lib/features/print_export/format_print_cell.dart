import 'package:scan_domain/scan_domain.dart';

import '../../shared/i18n/app_localizations.dart';
import '../../shared/oui/display_scan_vendor.dart';
import '../../widgets/scan_grid_display.dart';
import '../scan_issues/compute_issue_keys.dart';
import '../scan_session/bss_display.dart';
import '../scan_settings/signal_unit.dart';
import '../scan_settings/types.dart';

class PrintCellFormatContext {
  const PrintCellFormatContext({
    required this.l10n,
    required this.allRows,
    this.connectedBssid,
    this.signalUnit = SignalDisplayUnit.percent,
  });

  final AppLocalizations l10n;
  final List<ObservedBss> allRows;
  final String? connectedBssid;
  final SignalDisplayUnit signalUnit;
}

String formatPrintCell(
  ObservedBss row,
  String columnId,
  PrintCellFormatContext context,
) {
  final l10n = context.l10n;
  switch (columnId) {
    case 'ssid':
      final label = ssidGridLabel(row, l10n);
      final connected = scanGridRowConnected(row, context.connectedBssid);
      return connected ? '$label *' : label;
    case 'bssid':
      return displayBssid(row, l10n);
    case 'rssi':
      return formatSignalDisplay(row.signal.rssiDbm, context.signalUnit);
    case 'channel':
      return '${row.channel.number}';
    case 'band':
      return displayBand(row.channel.band, l10n);
    case 'security':
      return displaySecurity(row.security.primary);
    case 'phy':
      return row.phy.display.isEmpty ? l10n.emDash : row.phy.display;
    case 'issues':
      final keys = computeIssueKeys(row, context.allRows);
      if (keys.isEmpty) return l10n.emDash;
      return keys.map(l10n.scanMessage).join('; ');
    case 'vendor':
      return displayScanVendor(row, l10n);
    default:
      return '';
  }
}

String? printCellClass(String columnId) {
  if (columnId == 'bssid') return 'mono';
  return null;
}
