import 'package:scan_domain/scan_domain.dart';

/// Resolves IE bytes for decode/display from an [ObservedBss].
///
/// Domain model stores shallow metadata on [ObservedBss.ie]; full TLV bytes
/// live on [ObservedBss.lastRaw.informationElementData] when the platform
/// exposes them.
IeDecodeResult decodeIesForObservedBss(ObservedBss bss) {
  return decodeInformationElements(bss.lastRaw.informationElementData);
}

String ieSummaryLine(ObservedBss bss, IeDecodeResult decoded) {
  final level = bss.ie.level != 'absent' ? bss.ie.level : decoded.level.wire;
  final byteLength =
      bss.ie.byteLength > 0 ? bss.ie.byteLength : decoded.byteLength;
  final ids = decoded.elements.map((e) => e.id).toSet().toList()..sort();
  final idPart = ids.isEmpty ? '—' : ids.join(', ');
  return '$level · $byteLength B · $idPart';
}
