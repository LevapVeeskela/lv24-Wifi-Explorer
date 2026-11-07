import 'dart:convert';
import 'dart:math';

import 'annotation_rule.dart';
import 'string_storage.dart';

/// localStorage key for annotation rules (Electron parity).
const annotationsStorageKey = 'lv24.wifi-explorer.annotations';

String newAnnotationId() {
  // `Random()` is fine for client-side rule ids (Electron uses crypto.randomUUID).
  final r = Random();
  final suffix = List.generate(8, (_) => r.nextInt(36).toRadixString(36)).join();
  return 'ann-${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}-$suffix';
}

AnnotationRule? _asRule(Object? value) {
  if (value is! Map) return null;
  final bssidPattern = value['bssidPattern'];
  if (bssidPattern is! String || bssidPattern.trim().isEmpty) return null;
  final text = value['text'] is String ? value['text'] as String : '';
  final idRaw = value['id'];
  final id = idRaw is String && idRaw.trim().isNotEmpty ? idRaw : newAnnotationId();
  return AnnotationRule(id: id, bssidPattern: bssidPattern.trim(), text: text);
}

List<AnnotationRule> parseAnnotationStore(String? raw) {
  if (raw == null || raw.isEmpty) return [];
  try {
    final parsed = jsonDecode(raw);
    if (parsed is List) {
      return parsed.map(_asRule).whereType<AnnotationRule>().toList();
    }
    if (parsed is Map) {
      final rules = parsed['rules'];
      if (rules is! List) return [];
      return rules.map(_asRule).whereType<AnnotationRule>().toList();
    }
  } catch (_) {
    return [];
  }
  return [];
}

List<AnnotationRule> loadAnnotations({StringStorage? storage}) {
  final store = storage;
  if (store == null) return [];
  try {
    return parseAnnotationStore(store.read(annotationsStorageKey));
  } catch (_) {
    return [];
  }
}

void saveAnnotations(List<AnnotationRule> rules, {StringStorage? storage}) {
  final store = storage;
  if (store == null) return;
  try {
    store.write(
      annotationsStorageKey,
      jsonEncode(AnnotationStoreV1(rules: rules).toJson()),
    );
  } catch (_) {
    // quota / unavailable — keep in-memory only
  }
}

List<AnnotationRule> upsertAnnotation(
  List<AnnotationRule> rules, {
  String? id,
  required String bssidPattern,
  required String text,
}) {
  final pattern = bssidPattern.trim();
  if (id != null) {
    final idx = rules.indexWhere((r) => r.id == id);
    if (idx >= 0) {
      final next = [...rules];
      next[idx] = next[idx].copyWith(bssidPattern: pattern, text: text);
      return next;
    }
  }
  final fold = pattern.toLowerCase();
  final existing = rules.indexWhere((r) => r.bssidPattern.trim().toLowerCase() == fold);
  if (existing >= 0) {
    final next = [...rules];
    next[existing] = next[existing].copyWith(text: text);
    return next;
  }
  return [
    ...rules,
    AnnotationRule(id: id ?? newAnnotationId(), bssidPattern: pattern, text: text),
  ];
}

List<AnnotationRule> removeAnnotation(List<AnnotationRule> rules, String id) {
  return rules.where((r) => r.id != id).toList();
}

AnnotationRule createAnnotationRule(String bssidPattern, String text) {
  return AnnotationRule(
    id: newAnnotationId(),
    bssidPattern: bssidPattern.trim(),
    text: text,
  );
}
