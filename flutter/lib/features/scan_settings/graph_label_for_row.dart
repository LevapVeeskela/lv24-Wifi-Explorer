import 'package:scan_domain/scan_domain.dart';

import '../../shared/i18n/app_localizations.dart';
import '../../shared/oui/display_scan_vendor.dart';
import '../../widgets/scan_grid_display.dart';
import '../scan_filters/ssid_hidden_from_bss.dart';
import '../scan_session/bss_display.dart';
import 'types.dart';

/// Fields used by [graphLabelForRow] (Electron `GraphLabelRow`).
class GraphLabelRow {
  const GraphLabelRow({
    required this.ssid,
    required this.bssid,
    this.ssidHidden = false,
    this.vendor,
    this.annotation = '',
  });

  final String ssid;
  final String bssid;
  final bool ssidHidden;
  final String? vendor;
  final String annotation;
}

/// Chart / spectrum label from Settings → Advanced → graph labels.
String graphLabelForRow(
  GraphLabelRow? row,
  GraphLabelMode mode,
  String hiddenSsidLabel,
) {
  if (row == null) return '';

  switch (mode) {
    case GraphLabelMode.annotation:
      final text = row.annotation.trim();
      if (text.isNotEmpty) return text;
      return _ssidLabel(row, hiddenSsidLabel);
    case GraphLabelMode.apName:
      final vendor = row.vendor?.trim();
      if (vendor != null && vendor.isNotEmpty) return vendor;
      return row.bssid;
    case GraphLabelMode.ssid:
      return _ssidLabel(row, hiddenSsidLabel);
  }
}

String _ssidLabel(GraphLabelRow row, String hiddenSsidLabel) {
  if (row.ssidHidden) return hiddenSsidLabel;
  final ssid = row.ssid.trim();
  return ssid.isEmpty ? hiddenSsidLabel : ssid;
}

GraphLabelRow graphLabelRowFromBss(
  ObservedBss bss,
  AppLocalizations l10n, {
  String annotation = '',
}) {
  final gated = bss.identity.ssid;
  var ssid = '';
  if (gated is LocationAvailable<SsidIdentity>) {
    ssid = (gated.value.utf8 ?? gated.value.displayName).trim();
  }
  final vendorText = displayScanVendor(bss, l10n);
  final vendor = (vendorText == l10n.emDash || vendorText == l10n.redacted)
      ? null
      : vendorText;
  return GraphLabelRow(
    ssid: ssid,
    ssidHidden: ssidHiddenFromBss(bss),
    bssid: displayBssid(bss, l10n),
    vendor: vendor,
    annotation: annotation,
  );
}

String graphLabelForBss(
  ObservedBss? bss,
  AppLocalizations l10n, {
  GraphLabelMode mode = GraphLabelMode.ssid,
  String annotation = '',
}) {
  if (bss == null) return '';
  return graphLabelForRow(
    graphLabelRowFromBss(bss, l10n, annotation: annotation),
    mode,
    l10n.hiddenSsid,
  );
}
