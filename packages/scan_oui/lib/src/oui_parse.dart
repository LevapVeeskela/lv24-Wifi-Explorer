final _prefixPattern = RegExp(r'^[0-9a-f]{2}(:[0-9a-f]{2}){2}$');
final _bssidHexPattern = RegExp(r'^[0-9a-f]{12}$');

class ParsedBssid {
  const ParsedBssid({
    required this.oui,
    required this.locallyAdministered,
  });

  final String oui;
  final bool locallyAdministered;
}

/// Normalized 24-bit prefix (`aa:bb:cc`) from a BSSID, or null if invalid.
String? ouiFromBssid(String raw) {
  return parseBssid(raw)?.oui;
}

/// True when the IEEE locally administered (U/L) bit is set in the first octet.
bool isLocallyAdministeredBssid(String raw) {
  return parseBssid(raw)?.locallyAdministered ?? false;
}

ParsedBssid? parseBssid(String raw) {
  final hex = raw.trim().toLowerCase().replaceAll(RegExp(r'[:\-.]'), '');
  if (!_bssidHexPattern.hasMatch(hex)) {
    return null;
  }
  final first = int.parse(hex.substring(0, 2), radix: 16);
  final locallyAdministered = (first & 0x02) != 0;
  final oui =
      '${hex.substring(0, 2)}:${hex.substring(2, 4)}:${hex.substring(4, 6)}';
  return ParsedBssid(oui: oui, locallyAdministered: locallyAdministered);
}

/// IEEE MA-L organization for a normalized 24-bit prefix (`aa:bb:cc`).
bool isValidOuiPrefix(String oui) {
  return _prefixPattern.hasMatch(oui.trim().toLowerCase());
}

String normalizeOuiPrefix(String oui) => oui.trim().toLowerCase();
