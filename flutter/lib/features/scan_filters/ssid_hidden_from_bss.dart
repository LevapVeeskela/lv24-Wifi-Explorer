import 'package:scan_domain/scan_domain.dart';

/// Grid + filters: hidden SSID rows (empty octets or explicit hidden flag).
bool ssidHiddenFromBss(ObservedBss bss) {
  final gated = bss.identity.ssid;
  if (gated is! LocationAvailable<SsidIdentity>) return false;
  final id = gated.value;
  return id.hidden || id.octets.isEmpty;
}
