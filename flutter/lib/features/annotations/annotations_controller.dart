import 'dart:async';

import 'package:flutter/foundation.dart';

import '../snapshot/lv24_scan_types.dart';
import 'annotation_persist.dart';
import 'annotation_rule.dart';
import 'lv24_scan_bridge.dart';
import 'pin_color_persist.dart';
import 'platform_string_storage.dart';
import 'resolve_annotation.dart';
import 'string_storage.dart';

/// Workbench state for per-BSSID notes and pinned chart colors.
class AnnotationsController extends ChangeNotifier {
  AnnotationsController({StringStorage? storage, bool hydrate = true}) {
    final resolved = storage ?? createPlatformStringStorage();
    _storage = resolved;
    _rules = loadAnnotations(storage: resolved);
    _pinnedColors = loadPinnedColors(storage: resolved);
    if (hydrate && storage == null && !isDesktopConfigPlatform) {
      unawaited(_hydrateFromPlatformStorage());
    } else {
      _hydrated = true;
    }
  }

  StringStorage? _storage;
  List<AnnotationRule> _rules = [];
  Map<String, String> _pinnedColors = {};
  bool _hydrated = false;

  bool get hydrated => _hydrated;

  Future<void> _hydrateFromPlatformStorage() async {
    final store = await ensurePlatformStringStorageReady();
    _storage = store;
    _rules = loadAnnotations(storage: store);
    _pinnedColors = loadPinnedColors(storage: store);
    _hydrated = true;
    notifyListeners();
  }

  List<AnnotationRule> get rules => List.unmodifiable(_rules);
  Map<String, String> get pinnedColors => Map.unmodifiable(_pinnedColors);

  String? textFor(String bssid) => resolveAnnotation(bssid, _rules);

  String? pinnedHexFor(String bssid) {
    final key = bssid.trim().toLowerCase().replaceAll('-', ':');
    return _pinnedColors[key];
  }

  void setRules(List<AnnotationRule> rules) {
    _rules = [...rules];
    saveAnnotations(_rules, storage: _storage);
    notifyListeners();
  }

  void upsertRule({
    String? id,
    required String bssidPattern,
    required String text,
  }) {
    setRules(
      upsertAnnotation(
        _rules,
        id: id,
        bssidPattern: bssidPattern,
        text: text,
      ),
    );
  }

  void removeRule(String id) {
    setRules(removeAnnotation(_rules, id));
  }

  void setPinnedColors(Map<String, String> pins) {
    _pinnedColors = Map<String, String>.from(pins);
    savePinnedColors(_pinnedColors, storage: _storage);
    notifyListeners();
  }

  void loadFromSnapshot(Lv24ScanDocument document) {
    _rules = annotationRulesFromSnapshot(document.annotations);
    _pinnedColors = pinnedColorsFromSnapshot(document.pinnedColors);
    saveAnnotations(_rules, storage: _storage);
    savePinnedColors(_pinnedColors, storage: _storage);
    notifyListeners();
  }

  List<Lv24ScanAnnotation> snapshotAnnotations() => annotationRulesToSnapshot(_rules);

  List<Lv24PinnedColor> snapshotPinnedColors() => pinnedColorsToSnapshot(_pinnedColors);

  /// Exact-BSSID note edit (Electron grid / details commit).
  void commitAnnotation(String bssid, String text) {
    final pattern = bssid.trim();
    final trimmed = text.trim();
    AnnotationRule? existing;
    for (final rule in _rules) {
      if (rule.bssidPattern.trim().toLowerCase() == pattern.toLowerCase()) {
        existing = rule;
        break;
      }
    }
    if (trimmed.isEmpty) {
      if (existing != null) {
        _rules = removeAnnotation(_rules, existing.id);
        saveAnnotations(_rules, storage: _storage);
        notifyListeners();
      }
      return;
    }
    _rules = upsertAnnotation(
      _rules,
      id: existing?.id,
      bssidPattern: pattern,
      text: trimmed,
    );
    saveAnnotations(_rules, storage: _storage);
    notifyListeners();
  }

  void setPinColor(String bssid, String hexColor) {
    _pinnedColors = upsertPinnedColor(_pinnedColors, bssid: bssid, color: hexColor);
    savePinnedColors(_pinnedColors, storage: _storage);
    notifyListeners();
  }

  void clearPinColor(String bssid) {
    _pinnedColors = removePinnedColor(_pinnedColors, bssid);
    savePinnedColors(_pinnedColors, storage: _storage);
    notifyListeners();
  }
}
