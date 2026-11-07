import 'package:scan_domain/scan_domain.dart';

import '../../shared/i18n/app_localizations.dart';

String gatedText<T>(LocationGated<T> value, AppLocalizations l10n) {
  if (value is LocationRedacted<T>) return l10n.redacted;
  if (value is LocationAvailable<T>) {
    final inner = value.value;
    if (inner == null) return l10n.emDash;
    return inner.toString();
  }
  return l10n.emDash;
}

String displaySsid(ObservedBss bss, AppLocalizations l10n) {
  final gated = bss.identity.ssid;
  if (gated is LocationRedacted<SsidIdentity>) return l10n.redacted;
  if (gated is LocationAvailable<SsidIdentity>) {
    final ssid = gated.value;
    if (ssid.hidden) return l10n.hiddenSsid;
    return ssid.displayName;
  }
  return l10n.emDash;
}

String displayBssid(ObservedBss bss, AppLocalizations l10n) {
  return gatedText(bss.identity.bssid, l10n);
}

String displayBand(WifiBand? band, AppLocalizations l10n) {
  return switch (band) {
    WifiBand.ghz24 => '2.4 GHz',
    WifiBand.ghz5 => '5 GHz',
    WifiBand.ghz6 => '6 GHz',
    null => l10n.emDash,
  };
}

String displayWidth(Object widthMhz, AppLocalizations l10n) {
  if (widthMhz is ChannelWidthMhz) return '${widthMhz.asInt} MHz';
  return l10n.emDash;
}

String displaySecurity(SecurityKind kind) {
  return switch (kind) {
    SecurityKind.open => 'Open',
    SecurityKind.wep => 'WEP',
    SecurityKind.wpaPersonal => 'WPA-Personal',
    SecurityKind.wpaPersonalMixed => 'WPA-Mixed',
    SecurityKind.wpa2Personal => 'WPA2-Personal',
    SecurityKind.wpa3Personal => 'WPA3-Personal',
    SecurityKind.wpa3Transition => 'WPA3-Transition',
    SecurityKind.owe => 'OWE',
    SecurityKind.oweTransition => 'OWE-Transition',
    SecurityKind.wpa2Enterprise => 'WPA2-Enterprise',
    SecurityKind.wpa3Enterprise => 'WPA3-Enterprise',
    _ => kind.name,
  };
}

String displayQuality(SignalQuality quality, AppLocalizations l10n) {
  return switch (quality) {
    SignalQuality.excellent => l10n.qualityExcellent,
    SignalQuality.good => l10n.qualityGood,
    SignalQuality.fair => l10n.qualityFair,
    SignalQuality.poor => l10n.qualityPoor,
    SignalQuality.unusable => l10n.qualityUnusable,
  };
}

String displayDbm(num? value, AppLocalizations l10n) {
  if (value == null) return l10n.emDash;
  return '${value.round()} dBm';
}

String rowKey(ObservedBss bss) {
  final raw = bss.lastRaw;
  return bssMatchKeyFromRaw(
    bssid: raw.bssid,
    ssidData: raw.ssidData,
    ssid: raw.ssid,
    channelNumber: raw.channelNumber,
    channelBand: coreWlanChannelBandKey(raw.channelBand),
    ibss: raw.ibss,
  );
}
