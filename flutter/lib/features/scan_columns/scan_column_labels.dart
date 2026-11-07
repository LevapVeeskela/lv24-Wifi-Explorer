import '../../shared/i18n/app_localizations.dart';
import 'scan_column_id.dart';

String scanColumnLabel(AppLocalizations l10n, ScanColumnId id) {
  return switch (id) {
    ScanColumnId.ssid => l10n.colSsid,
    ScanColumnId.bssid => l10n.colBssid,
    ScanColumnId.rssi => l10n.colRssi,
    ScanColumnId.channel => l10n.colChannel,
    ScanColumnId.band => l10n.colBand,
    ScanColumnId.security => l10n.colSecurity,
    ScanColumnId.phy => l10n.colPhy,
    ScanColumnId.issues => l10n.scanColIssues,
    ScanColumnId.vendor => l10n.colVendor,
  };
}
