import 'package:scan_domain/scan_domain.dart';

import '../i18n/app_localizations.dart';
import 'scan_oui_registry.dart';

String displayScanVendor(ObservedBss bss, AppLocalizations l10n) {
  if (bss.identity.bssid is LocationRedacted<Bssid> ||
      bss.vendor.match == 'bssid-redacted') {
    return l10n.redacted;
  }

  final org = bss.vendor.organization;
  if (org != null && org.isNotEmpty) return org;

  final bssid = switch (bss.identity.bssid) {
    LocationAvailable(value: final v) => v,
    _ => bss.lastRaw.bssid,
  };

  if (bssid != null && bssid.isNotEmpty) {
    final registry = scanOuiRegistry();
    if (registry != null) {
      final hit = registry.lookup(bssid);
      final fromRegistry = hit.vendor;
      if (fromRegistry != null && fromRegistry.isNotEmpty) {
        return fromRegistry;
      }
    }
  }

  final match = bss.vendor.match;
  if (match.isNotEmpty && match != 'unknown') return match;

  return l10n.emDash;
}
