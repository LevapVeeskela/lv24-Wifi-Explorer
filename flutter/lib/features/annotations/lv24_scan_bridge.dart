import '../snapshot/lv24_scan_types.dart';
import 'annotation_rule.dart';

List<Lv24ScanAnnotation> annotationRulesToSnapshot(List<AnnotationRule> rules) {
  return rules
      .map(
        (r) => Lv24ScanAnnotation(
          id: r.id,
          bssidPattern: r.bssidPattern,
          text: r.text,
        ),
      )
      .toList();
}

List<AnnotationRule> annotationRulesFromSnapshot(List<Lv24ScanAnnotation> annotations) {
  return annotations
      .map(
        (a) => AnnotationRule(
          id: a.id,
          bssidPattern: a.bssidPattern,
          text: a.text,
        ),
      )
      .toList();
}

List<Lv24PinnedColor> pinnedColorsToSnapshot(Map<String, String> pins) {
  final entries = pins.entries.toList()..sort((a, b) => a.key.compareTo(b.key));
  return entries
      .map((e) => Lv24PinnedColor(bssid: e.key, color: e.value))
      .toList();
}

Map<String, String> pinnedColorsFromSnapshot(List<Lv24PinnedColor> pinned) {
  final out = <String, String>{};
  for (final p in pinned) {
    final key = p.bssid.trim().toLowerCase().replaceAll('-', ':');
    if (key.isEmpty) continue;
    out[key] = p.color;
  }
  return out;
}
