import 'package:scan_domain/scan_domain.dart';

bool _hiddenFromIdentity(ObservedBss bss) {
  final gated = bss.identity.ssid;
  if (gated is! LocationAvailable<SsidIdentity>) return false;
  return gated.value.hidden;
}

String? _countryFromBss(ObservedBss bss) {
  final gated = bss.countryCode;
  if (gated is! LocationAvailable<String?>) return null;
  return gated.value;
}

/// Map domain scan row to issue heuristics input (matches TS `scanIssueBssFromObserved`).
ScanIssueBss scanIssueBssFromObserved(ObservedBss bss) {
  return ScanIssueBss(
    channel: ScanIssueChannel(
      band: bss.channel.band,
      number: bss.channel.number,
      widthMhz: bss.channel.widthMhz,
    ),
    signal: ScanIssueSignal(
      rssiDbm: bss.signal.rssiDbm,
      snrDb: bss.signal.snrDb,
    ),
    security: ScanIssueSecurity(
      primary: bss.security.primary,
      isOpen: bss.security.isOpen,
    ),
    hiddenSsid: _hiddenFromIdentity(bss),
    phy: ScanIssuePhy(
      highest: bss.phy.highest,
      supported: bss.phy.supported,
    ),
    countryCode: _countryFromBss(bss),
  );
}
