import 'package:flutter/foundation.dart';

import 'scan_column_id.dart';
import 'scan_column_persistence.dart';
import 'scan_column_profile.dart';
import 'scan_column_store.dart';
import 'scan_column_visibility.dart';

class ScanColumnsController extends ChangeNotifier {
  ScanColumnsController({ScanColumnStore? store})
      : _store = store ?? ScanColumnStore(),
        _visibility = ScanColumnVisibility.defaults();

  final ScanColumnStore _store;
  ScanColumnVisibility _visibility;
  List<ScanColumnProfile> _profiles = [];
  String? _activeProfileId;
  bool _loaded = false;

  ScanColumnVisibility get visibility => _visibility;

  List<ScanColumnProfile> get customProfiles =>
      List<ScanColumnProfile>.unmodifiable(_profiles);

  String? get activeProfileId => _activeProfileId;

  bool get loaded => _loaded;

  ScanColumnProfile profileById(String id) {
    if (id == ScanColumnProfile.defaultId) {
      return ScanColumnProfile(
        id: ScanColumnProfile.defaultId,
        name: '',
        visibility: ScanColumnVisibility.defaults(),
      );
    }
    return _profiles.firstWhere((p) => p.id == id);
  }

  Future<void> load() async {
    final data = await _store.read();
    if (data != null) {
      _visibility = data.visibility;
      _profiles = List<ScanColumnProfile>.from(data.profiles);
      _activeProfileId = _validActiveProfileId(
        data.activeProfileId,
        _profiles,
      );
    }
    _loaded = true;
    notifyListeners();
  }

  Future<void> setVisibility(ScanColumnVisibility next) async {
    if (_visibility == next) return;
    _visibility = next;
    notifyListeners();
    await _persist();
  }

  Future<void> setColumnVisible(ScanColumnId id, bool visible) {
    return setVisibility(_visibility.withVisible(id, visible));
  }

  Future<void> resetToDefaults() {
    return switchProfile(ScanColumnProfile.defaultId);
  }

  Future<void> switchProfile(String profileId) async {
    final nextVisibility = profileId == ScanColumnProfile.defaultId
        ? ScanColumnVisibility.defaults()
        : profileById(profileId).visibility;
    _visibility = nextVisibility;
    _activeProfileId = profileId;
    notifyListeners();
    await _persist();
  }

  Future<void> saveNamedProfile(String name, ScanColumnVisibility visibility) {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return Future.value();
    final existingIndex =
        _profiles.indexWhere((p) => p.name.toLowerCase() == trimmed.toLowerCase());
    if (existingIndex >= 0) {
      final existing = _profiles[existingIndex];
      _profiles = [
        ..._profiles.sublist(0, existingIndex),
        existing.copyWith(name: trimmed, visibility: visibility),
        ..._profiles.sublist(existingIndex + 1),
      ];
      _activeProfileId = existing.id;
    } else {
      final id = _newProfileId(trimmed);
      _profiles = [
        ..._profiles,
        ScanColumnProfile(id: id, name: trimmed, visibility: visibility),
      ];
      _activeProfileId = id;
    }
    _visibility = visibility;
    notifyListeners();
    return _persist();
  }

  Future<void> deleteProfile(String profileId) async {
    if (profileId == ScanColumnProfile.defaultId) return;
    _profiles = _profiles.where((p) => p.id != profileId).toList();
    if (_activeProfileId == profileId) {
      _activeProfileId = null;
    }
    notifyListeners();
    await _persist();
  }

  Future<void> setActiveProfileId(String? profileId) async {
    _activeProfileId = profileId;
    notifyListeners();
    await _persist();
  }

  String _newProfileId(String name) {
    final slug = name
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
        .replaceAll(RegExp(r'^-|-$'), '');
    final suffix = DateTime.now().microsecondsSinceEpoch.toRadixString(36);
    if (slug.isEmpty) return 'profile-$suffix';
    return '$slug-$suffix';
  }

  Future<void> _persist() async {
    await _store.write(
      ScanColumnPersistence(
        visibility: _visibility,
        activeProfileId: _activeProfileId,
        profiles: _profiles,
      ),
    );
  }

  static String? _validActiveProfileId(
    String? id,
    List<ScanColumnProfile> profiles,
  ) {
    if (id == null || id.isEmpty) return null;
    if (id == ScanColumnProfile.defaultId) return id;
    return profiles.any((p) => p.id == id) ? id : null;
  }
}
