import 'package:scan_domain/scan_domain.dart';

import 'match_bss_scan_query.dart';
import 'parse_scan_query.dart';
import 'scan_query_ast.dart';

bool matchesScanSearch(
  ObservedBss bss,
  String query, {
  ScanSearchMatchContext context = const ScanSearchMatchContext(),
}) {
  final trimmed = query.trim();
  if (trimmed.isEmpty) return true;

  final parsed = parseScanQuery(query);
  if (parsed is ParseScanQueryOk) {
    return matchBssScanQuery(bss, parsed.ast, context);
  }

  return _fallbackContainsSearch(bss, trimmed, context);
}

/// Plain-text fallback when the scan query DSL fails to parse
/// (Electron `applyAllFilters` haystack parity).
bool _fallbackContainsSearch(
  ObservedBss bss,
  String trimmed,
  ScanSearchMatchContext context,
) {
  final folded = trimmed.toLowerCase();
  if (_isHiddenSearchToken(folded)) {
    return _isHidden(bss);
  }

  return _searchHaystack(bss, context).contains(folded);
}

bool _isHiddenSearchToken(String query) {
  return query == '\u0000' ||
      query == '<hidden>' ||
      query == '‹hidden›' ||
      query == '«скрытая»' ||
      query == '‹скрытая›' ||
      query == 'скрытая';
}

bool _isHidden(ObservedBss bss) {
  final gated = bss.identity.ssid;
  if (gated is! LocationAvailable<SsidIdentity>) return false;
  return gated.value.hidden;
}

List<String> _ssidDisplayFields(ObservedBss bss) {
  final out = <String>[];
  final gated = bss.identity.ssid;
  if (gated is LocationAvailable<SsidIdentity>) {
    final id = gated.value;
    if (id.displayName.isNotEmpty) out.add(id.displayName);
    final utf8 = id.utf8;
    if (utf8 != null && utf8.isNotEmpty) out.add(utf8);
  }
  return out;
}

String? _bssidNormalized(ObservedBss bss) {
  final gated = bss.identity.bssid;
  if (gated is! LocationAvailable<String>) return null;
  return gated.value.toLowerCase();
}

String _searchHaystack(ObservedBss bss, ScanSearchMatchContext context) {
  final parts = <String>[
    ..._ssidDisplayFields(bss),
    if (_bssidNormalized(bss) case final mac?) mac,
    bss.vendor.organization ?? '',
    if (context.annotation != null && context.annotation!.isNotEmpty)
      context.annotation!,
    if (context.apName != null && context.apName!.isNotEmpty) context.apName!,
    securityKindWire(bss.security.primary),
  ];
  return parts.join(' ').toLowerCase();
}
