import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../features/scan_filters/ssid_hidden_from_bss.dart';
import '../shared/i18n/app_localizations.dart';

export '../features/scan_filters/ssid_hidden_from_bss.dart';

/// SSID column label: hidden placeholder or visible name (em dash if empty).
String ssidGridLabel(ObservedBss bss, AppLocalizations l10n) {
  if (ssidHiddenFromBss(bss)) return l10n.hiddenSsid;
  final gated = bss.identity.ssid;
  if (gated is LocationAvailable<SsidIdentity>) {
    final id = gated.value;
    final text = (id.utf8 ?? id.displayName).trim();
    return text.isEmpty ? l10n.emDash : text;
  }
  return l10n.emDash;
}

bool scanGridRowConnected(ObservedBss bss, String? connectedBssid) {
  if (connectedBssid == null || connectedBssid.isEmpty) return false;
  final gated = bss.identity.bssid;
  if (gated is! LocationAvailable<String>) return false;
  return normalizeBssid(gated.value) == normalizeBssid(connectedBssid);
}

bool scanGridRowStale(ObservedBss bss) =>
    bss.presence.presence == Presence.stale;

const scanGridStaleOpacity = 0.45;

TextStyle scanGridSsidTextStyle({
  required TextStyle base,
  required bool connected,
  required bool hidden,
}) {
  return base.copyWith(
    fontWeight: connected ? FontWeight.w600 : FontWeight.w400,
    fontStyle: hidden ? FontStyle.italic : FontStyle.normal,
  );
}

Widget scanGridRowCell(Widget child, {required bool stale}) {
  if (!stale) return child;
  return Opacity(opacity: scanGridStaleOpacity, child: child);
}
