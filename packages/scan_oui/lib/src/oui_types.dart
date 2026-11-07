/// Dataset provenance for a successful vendor match.
enum OuiSource {
  ieeeMal('ieee-mal'),
  curatedFallback('curated-fallback'),
  unknown('unknown');

  const OuiSource(this.wireValue);

  final String wireValue;

  static OuiSource fromWire(String? value) {
    return switch (value) {
      'ieee-mal' => OuiSource.ieeeMal,
      'curated-fallback' => OuiSource.curatedFallback,
      _ => OuiSource.unknown,
    };
  }
}

/// Result of resolving a BSSID against the IEEE MA-L registry.
class OuiLookupResult {
  const OuiLookupResult({
    required this.oui,
    required this.vendor,
    required this.source,
    required this.randomized,
  });

  final String? oui;
  final String? vendor;
  final OuiSource source;
  final bool randomized;

  static const unknown = OuiLookupResult(
    oui: null,
    vendor: null,
    source: OuiSource.unknown,
    randomized: false,
  );
}

/// Build metadata from [resources/oui/registry.json].
class OuiRegistryMeta {
  const OuiRegistryMeta({
    required this.format,
    required this.source,
    required this.sourceUrl,
    required this.generatedAt,
    required this.entryCount,
    this.note,
  });

  final String format;
  final OuiSource source;
  final String? sourceUrl;
  final String generatedAt;
  final int entryCount;
  final String? note;

  factory OuiRegistryMeta.fromJson(Map<String, dynamic> json) {
    return OuiRegistryMeta(
      format: json['format'] as String? ?? '',
      source: OuiSource.fromWire(json['source'] as String?),
      sourceUrl: json['sourceUrl'] as String?,
      generatedAt: json['generatedAt'] as String? ?? '',
      entryCount: (json['entryCount'] as num?)?.toInt() ?? 0,
      note: json['note'] as String?,
    );
  }
}
