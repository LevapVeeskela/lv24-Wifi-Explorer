/// One user note keyed by exact BSSID or a `*` / `?` pattern.
class AnnotationRule {
  const AnnotationRule({
    required this.id,
    required this.bssidPattern,
    required this.text,
  });

  final String id;
  final String bssidPattern;
  final String text;

  AnnotationRule copyWith({
    String? id,
    String? bssidPattern,
    String? text,
  }) {
    return AnnotationRule(
      id: id ?? this.id,
      bssidPattern: bssidPattern ?? this.bssidPattern,
      text: text ?? this.text,
    );
  }
}

class AnnotationStoreV1 {
  const AnnotationStoreV1({required this.rules});

  final List<AnnotationRule> rules;

  Map<String, Object> toJson() => {
        'version': 1,
        'rules': rules
            .map(
              (r) => {
                'id': r.id,
                'bssidPattern': r.bssidPattern,
                'text': r.text,
              },
            )
            .toList(),
      };
}

class PinnedColorEntry {
  const PinnedColorEntry({required this.bssid, required this.color});

  final String bssid;
  final String color;
}

class PinnedColorStoreV1 {
  const PinnedColorStoreV1({required this.pins});

  final List<PinnedColorEntry> pins;

  Map<String, Object> toJson() => {
        'version': 1,
        'pins': pins
            .map(
              (p) => {
                'bssid': p.bssid,
                'color': p.color,
              },
            )
            .toList(),
      };
}
