import 'dart:io';

/// Relative path from repository root to the bundled OUI registry.
const ouiRegistryRelativePath = 'resources/oui/registry.json';

/// Candidate paths for [resources/oui/registry.json], newest guess first.
List<String> defaultOuiRegistryCandidates({String? repoRoot}) {
  final root = repoRoot ?? guessRepoRootForOui();
  return [
    if (root != null) '$root/$ouiRegistryRelativePath',
    ouiRegistryRelativePath,
    '../../$ouiRegistryRelativePath',
    '../$ouiRegistryRelativePath',
  ];
}

/// First existing registry file path, or null.
String? resolveOuiRegistryPath({
  String? repoRoot,
  List<String>? candidates,
}) {
  for (final path in candidates ?? defaultOuiRegistryCandidates(repoRoot: repoRoot)) {
    if (path.isEmpty) continue;
    if (File(path).existsSync()) return path;
  }
  return null;
}

String? guessRepoRootForOui() {
  final dir = Directory.current.path;
  if (File('$dir/$ouiRegistryRelativePath').existsSync()) {
    return dir;
  }
  var cursor = dir;
  for (var i = 0; i < 8; i++) {
    if (File('$cursor/$ouiRegistryRelativePath').existsSync()) {
      return cursor;
    }
    final parent = Directory(cursor).parent.path;
    if (parent == cursor) break;
    cursor = parent;
  }
  return null;
}

String? repoRootFromRegistryPath(String registryPath) {
  const suffix = '/$ouiRegistryRelativePath';
  if (registryPath.endsWith(suffix)) {
    return registryPath.substring(0, registryPath.length - suffix.length);
  }
  return null;
}
