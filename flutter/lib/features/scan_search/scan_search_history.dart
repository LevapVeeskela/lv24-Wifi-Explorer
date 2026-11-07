import 'scan_search_history_storage_key.dart';

/// Adds [query] to the front of [history], deduping and capping at
/// [scanSearchHistoryMaxEntries]. Empty or whitespace-only queries are ignored.
List<String> pushScanSearchHistory(List<String> history, String query) {
  final trimmed = query.trim();
  if (trimmed.isEmpty) return List<String>.from(history);

  final next = [
    trimmed,
    for (final entry in history)
      if (entry != trimmed) entry,
  ];
  if (next.length <= scanSearchHistoryMaxEntries) return next;
  return next.sublist(0, scanSearchHistoryMaxEntries);
}

/// Recent queries to show in the app bar autocomplete for [typed].
List<String> filterScanSearchHistoryForAutocomplete(
  List<String> history,
  String typed,
) {
  final needle = typed.trim().toLowerCase();
  if (needle.isEmpty) return List<String>.from(history);
  return [
    for (final entry in history)
      if (entry.toLowerCase().contains(needle)) entry,
  ];
}

/// Parses persisted JSON (array of strings) into a sanitized history list.
List<String> scanSearchHistoryFromJson(dynamic decoded) {
  if (decoded is! List) return const [];
  final out = <String>[];
  for (final item in decoded) {
    if (item is! String) continue;
    final trimmed = item.trim();
    if (trimmed.isEmpty) continue;
    if (out.contains(trimmed)) continue;
    out.add(trimmed);
    if (out.length >= scanSearchHistoryMaxEntries) break;
  }
  return out;
}
