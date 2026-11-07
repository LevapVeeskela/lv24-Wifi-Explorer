import 'package:scan_domain/scan_domain.dart';

String? bssidOf(ObservedBss? bss) {
  if (bss == null) return null;
  final gated = bss.identity.bssid;
  if (gated is LocationAvailable<Bssid>) return gated.value;
  return null;
}

String formatMaxRateMbps(ObservedBss bss) {
  final rate = bss.maxRate;
  if (rate == null) return '';
  if (rate is num && rate.isFinite) return '${rate.round()} Mbps';
  return rate.toString();
}

String formatFrequencyMHz(ObservedBss bss) {
  final mhz = bss.channel.primaryCenterMhz;
  if (mhz == null || !mhz.isFinite) return '';
  return '${mhz.round()} MHz';
}

String formatEncryptionSummary(ObservedBss bss, {String empty = '—'}) {
  final hint = bss.security.ieHint;
  return switch (hint) {
    RsnHint.none => empty,
    RsnHint.wpaIe => 'WPA IE',
    RsnHint.rsnIe => 'RSN IE',
    RsnHint.both => 'WPA + RSN IE',
    RsnHint.unparsed => 'IE present',
  };
}
