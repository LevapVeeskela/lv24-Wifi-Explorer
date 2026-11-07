import 'scan_column_id.dart';
import 'scan_column_profile.dart';
import 'scan_column_visibility.dart';

const scanColumnPersistenceVersion = 1;

class ScanColumnPersistence {
  const ScanColumnPersistence({
    required this.visibility,
    this.activeProfileId,
    this.profiles = const [],
  });

  final ScanColumnVisibility visibility;
  final String? activeProfileId;
  final List<ScanColumnProfile> profiles;

  Map<String, Object?> toJson() => {
        'v': scanColumnPersistenceVersion,
        'visibility': visibility.toStorageMap(),
        if (activeProfileId != null && activeProfileId!.isNotEmpty)
          'activeProfileId': activeProfileId,
        'profiles': [for (final p in profiles) p.toJson()],
      };

  static ScanColumnPersistence defaults() => ScanColumnPersistence(
        visibility: ScanColumnVisibility.defaults(),
      );

  static ScanColumnPersistence? decode(Object? decoded) {
    if (decoded is! Map) return null;
    final map = decoded.cast<Object?, Object?>();
    if (_isLegacyColumnMap(map)) {
      final visibility = ScanColumnVisibility.fromStorageMap(
        map.map((key, value) => MapEntry(key as String, value as bool)),
      );
      return ScanColumnPersistence(visibility: visibility);
    }
    final visibilityRaw = map['visibility'];
    if (visibilityRaw is! Map) return null;
    final visibilityMap = <String, bool>{
      for (final entry in visibilityRaw.entries)
        if (entry.key is String && entry.value is bool)
          entry.key as String: entry.value as bool,
    };
    final profilesRaw = map['profiles'];
    final profiles = <ScanColumnProfile>[];
    if (profilesRaw is List) {
      for (final item in profilesRaw) {
        final profile = ScanColumnProfile.fromJson(item);
        if (profile != null && !profile.isBuiltInDefault) {
          profiles.add(profile);
        }
      }
    }
    final activeProfileId = map['activeProfileId'];
    return ScanColumnPersistence(
      visibility: ScanColumnVisibility.fromStorageMap(visibilityMap),
      activeProfileId: activeProfileId is String && activeProfileId.isNotEmpty
          ? activeProfileId
          : null,
      profiles: profiles,
    );
  }

  static bool _isLegacyColumnMap(Map<Object?, Object?> map) {
    if (map.isEmpty) return false;
    if (map.containsKey('visibility') || map.containsKey('profiles')) {
      return false;
    }
    for (final entry in map.entries) {
      if (entry.key is! String) return false;
      if (entry.value is! bool) return false;
      if (ScanColumnId.tryParse(entry.key as String) == null) return false;
    }
    return true;
  }
}
