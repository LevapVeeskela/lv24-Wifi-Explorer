import 'dart:convert';
import 'dart:io';

import '../models/scan_snapshot_dto.dart';
import '../protocol/snapshot_parser.dart';

/// Loads bundled LV24 / Meridia demo fixtures (never commercial WiFi Explorer dumps).
class FixtureLoader {
  FixtureLoader({List<String>? candidates}) : _candidates = candidates ?? const [];

  final List<String> _candidates;
  Map<String, dynamic>? _cache;

  static List<String> defaultFixtureCandidates({String? repoRoot}) {
    final root = repoRoot ?? _guessRepoRoot();
    return [
      if (root != null) '$root/resources/fixtures/scan-snapshot.json',
      if (root != null) '$root/resources/fixtures/scan-snapshot-minimal.json',
      if (root != null) '$root/native/ScanCore/resources/fixtures/scan-snapshot.json',
      'resources/fixtures/scan-snapshot.json',
      'resources/fixtures/scan-snapshot-minimal.json',
    ];
  }

  static String? resolveFixturePath({String? repoRoot, List<String>? candidates}) {
    for (final path in candidates ?? defaultFixtureCandidates(repoRoot: repoRoot)) {
      if (path.isEmpty) continue;
      if (File(path).existsSync()) return path;
    }
    return null;
  }

  Map<String, dynamic> loadFixtureObject({String? repoRoot}) {
    if (_cache != null) return Map<String, dynamic>.from(_cache!);

    final paths = [
      ..._candidates,
      ...defaultFixtureCandidates(repoRoot: repoRoot),
    ];

    for (final path in paths) {
      if (path.isEmpty || !File(path).existsSync()) continue;
      try {
        final raw = File(path).readAsStringSync();
        final decoded = jsonDecode(raw);
        if (decoded is Map<String, dynamic>) {
          _cache = decoded;
          return Map<String, dynamic>.from(decoded);
        }
      } catch (_) {
        continue;
      }
    }

    _cache = const {};
    return {};
  }

  /// Electron-style demo payload with fresh timestamp and transport metadata.
  Map<String, dynamic> buildDemoSnapshotPayload({String? repoRoot}) {
    final base = loadFixtureObject(repoRoot: repoRoot);
    return {
      ...base,
      'demo': true,
      'transportSource': 'fixtures',
      'capturedAt': DateTime.now().toUtc().toIso8601String(),
    };
  }

  /// Parsed snapshot DTO for UI mappers.
  ScanSnapshotDto loadDemoSnapshot({String? repoRoot}) {
    return parseScanSnapshotPayload(buildDemoSnapshotPayload(repoRoot: repoRoot));
  }
}

String? _guessRepoRoot() {
  final dir = Directory.current.path;
  if (File('$dir/pubspec.yaml').existsSync() &&
      File('$dir/resources/fixtures/scan-snapshot.json').existsSync()) {
    return dir;
  }
  var cursor = dir;
  for (var i = 0; i < 6; i++) {
    if (File('$cursor/resources/fixtures/scan-snapshot.json').existsSync()) {
      return cursor;
    }
    final parent = Directory(cursor).parent.path;
    if (parent == cursor) break;
    cursor = parent;
  }
  return null;
}
