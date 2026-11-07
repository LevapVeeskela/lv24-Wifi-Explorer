import 'scan_column_visibility.dart';

/// Built-in default profile id (not stored in [ScanColumnPersistence.profiles]).
class ScanColumnProfile {
  const ScanColumnProfile({
    required this.id,
    required this.name,
    required this.visibility,
  });

  static const defaultId = 'default';

  final String id;
  final String name;
  final ScanColumnVisibility visibility;

  bool get isBuiltInDefault => id == defaultId;

  ScanColumnProfile copyWith({
    String? name,
    ScanColumnVisibility? visibility,
  }) {
    return ScanColumnProfile(
      id: id,
      name: name ?? this.name,
      visibility: visibility ?? this.visibility,
    );
  }

  Map<String, Object?> toJson() => {
        'id': id,
        'name': name,
        'visibility': visibility.toStorageMap(),
      };

  static ScanColumnProfile? fromJson(Object? raw) {
    if (raw is! Map) return null;
    final id = raw['id'];
    final name = raw['name'];
    final visibilityRaw = raw['visibility'];
    if (id is! String || id.isEmpty) return null;
    if (name is! String || name.trim().isEmpty) return null;
    if (visibilityRaw is! Map) return null;
    final visibilityMap = <String, bool>{
      for (final entry in visibilityRaw.entries)
        if (entry.key is String && entry.value is bool)
          entry.key as String: entry.value as bool,
    };
    return ScanColumnProfile(
      id: id,
      name: name.trim(),
      visibility: ScanColumnVisibility.fromStorageMap(visibilityMap),
    );
  }
}
