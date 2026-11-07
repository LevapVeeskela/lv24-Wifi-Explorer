/// Which automatic cell highlights are active (SPEC §7.3 tiers + weak security).
enum ColumnRulesHighlight {
  rssi('rssi'),
  security('security');

  const ColumnRulesHighlight(this.wire);
  final String wire;

  static ColumnRulesHighlight? tryParse(String? value) {
    if (value == null) return null;
    for (final item in ColumnRulesHighlight.values) {
      if (item.wire == value) return item;
    }
    return null;
  }
}

class ColumnRulesConfig {
  const ColumnRulesConfig({
    required this.enabled,
    required this.highlights,
  });

  final bool enabled;
  final List<ColumnRulesHighlight> highlights;

  ColumnRulesConfig copyWith({
    bool? enabled,
    List<ColumnRulesHighlight>? highlights,
  }) {
    return ColumnRulesConfig(
      enabled: enabled ?? this.enabled,
      highlights: highlights ?? this.highlights,
    );
  }

  @override
  bool operator ==(Object other) {
    return other is ColumnRulesConfig &&
        other.enabled == enabled &&
        _listEquals(other.highlights, highlights);
  }

  @override
  int get hashCode => Object.hash(enabled, Object.hashAll(highlights));
}

bool _listEquals<T>(List<T> a, List<T> b) {
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}

class ColumnRulesStoreV1 {
  const ColumnRulesStoreV1({
    required this.version,
    required this.enabled,
    required this.highlights,
  });

  final int version;
  final bool enabled;
  final List<ColumnRulesHighlight> highlights;

  ColumnRulesConfig toConfig() => ColumnRulesConfig(
        enabled: enabled,
        highlights: List<ColumnRulesHighlight>.from(highlights),
      );

  Map<String, Object?> toJson() => {
        'version': version,
        'enabled': enabled,
        'highlights': [for (final h in highlights) h.wire],
      };

  static ColumnRulesStoreV1 fromConfig(ColumnRulesConfig config) {
    return ColumnRulesStoreV1(
      version: 1,
      enabled: config.enabled,
      highlights: List<ColumnRulesHighlight>.from(config.highlights),
    );
  }
}
