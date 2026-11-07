import 'match_bssid_pattern.dart';
import 'annotation_rule.dart';

/// Pick the note for a BSSID. Exact patterns beat wildcards; among the same
/// class, a longer literal pattern wins. Equal score → later rule wins.
String? resolveAnnotation(String bssid, List<AnnotationRule> rules) {
  String? bestText;
  var bestScore = -1;
  var bestIndex = -1;

  for (var i = 0; i < rules.length; i++) {
    final rule = rules[i];
    final text = rule.text.trim();
    if (text.isEmpty) continue;
    if (!matchBssidPattern(rule.bssidPattern, bssid)) continue;

    final score = patternSpecificity(rule.bssidPattern);
    if (bestText == null || score > bestScore || (score == bestScore && i > bestIndex)) {
      bestText = text;
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestText;
}

Map<String, String> resolveAnnotationMap(
  Iterable<String> bssids,
  List<AnnotationRule> rules,
) {
  final out = <String, String>{};
  for (final bssid in bssids) {
    final text = resolveAnnotation(bssid, rules);
    if (text != null) out[bssid] = text;
  }
  return out;
}
