/// BSS identity vs SSID/ESS grouping keys.

typedef Bssid = String;
typedef Oui24 = String;
typedef SsidOctetHex = String;
typedef IsoTime = String;
typedef EssGroupKey = String;

enum LocationAuthorization { granted, denied, notDetermined, restricted }

sealed class LocationGated<T> {
  const LocationGated();
}

final class LocationAvailable<T> extends LocationGated<T> {
  const LocationAvailable(this.value);
  final T value;
}

final class LocationRedacted<T> extends LocationGated<T> {
  const LocationRedacted({this.reason = 'location-required'});
  final String reason;
}

class SsidIdentity {
  const SsidIdentity({
    required this.utf8,
    required this.octets,
    required this.octetHex,
    required this.hidden,
    required this.displayName,
  });

  final String? utf8;
  final List<int> octets;
  final SsidOctetHex octetHex;
  final bool hidden;
  final String displayName;
}

class BssIdentity {
  const BssIdentity({required this.bssid, required this.ssid});

  final LocationGated<Bssid> bssid;
  final LocationGated<SsidIdentity> ssid;
}

Bssid asBssid(String value) => value;

SsidOctetHex asSsidOctetHex(String value) => value;

EssGroupKey asEssGroupKey(String value) => value;

IsoTime asIsoTime(Object value) {
  if (value is DateTime) return value.toUtc().toIso8601String();
  return value as String;
}

Bssid? normalizeBssid(String? raw) {
  if (raw == null) return null;
  final hex = raw.replaceAll(RegExp(r'[^0-9a-fA-F]'), '').toLowerCase();
  if (hex.length != 12 || !RegExp(r'^[0-9a-f]+$').hasMatch(hex)) return null;
  final pairs = RegExp(r'.{2}').allMatches(hex).map((m) => m.group(0)!).toList();
  if (pairs.length != 6) return null;
  return asBssid(pairs.join(':'));
}

SsidOctetHex octetHexOf(List<int> octets) {
  return asSsidOctetHex(
    octets.map((b) => (b & 0xff).toRadixString(16).padLeft(2, '0')).join(),
  );
}

List<int> octetsFromSsidFields(
  List<int>? ssidData,
  String? ssid,
) {
  if (ssidData != null) return ssidData.map((b) => b & 0xff).toList();
  if (ssid != null) return ssid.codeUnits;
  return [];
}

String bssMatchKeyFromRaw({
  required String? bssid,
  required List<int>? ssidData,
  required String? ssid,
  required int? channelNumber,
  required String channelBand,
  required bool ibss,
}) {
  final normalized = normalizeBssid(bssid);
  if (normalized != null) return 'bssid:$normalized';
  final hex = octetHexOf(octetsFromSsidFields(ssidData, ssid));
  final ch = channelNumber ?? -1;
  return 'anon:$hex:$ch:$channelBand:${ibss ? 1 : 0}';
}
