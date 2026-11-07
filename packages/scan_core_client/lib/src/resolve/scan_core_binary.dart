import 'dart:io';

/// Resolves the ScanCore helper binary (mirrors `electron/scan/scanCoreClient.ts`).
String? resolveScanCoreBinary({
  String? resourcesPath,
  List<String> devRoots = const [],
}) {
  const appExecutable = 'Contents/MacOS/ScanCore';
  const relativeCandidates = [
    '.build/ScanCore.app/$appExecutable',
    '.build/release/ScanCore',
    '.build/out/Products/Release/ScanCore',
  ];

  final candidates = <String>[];
  if (resourcesPath != null && resourcesPath.isNotEmpty) {
    candidates.add('$resourcesPath/ScanCore.app/$appExecutable');
  }

  for (final root in devRoots) {
    for (final rel in relativeCandidates) {
      candidates.add('$root/$rel');
    }
  }

  for (final candidate in candidates) {
    if (candidate.isEmpty) continue;
    if (File(candidate).existsSync()) return candidate;
  }
  return null;
}

List<String> defaultScanCoreDevRoots({String? repoRoot}) {
  final roots = <String>[];
  if (repoRoot != null) {
    roots.add('$repoRoot/native/ScanCore');
  }
  roots.add('native/ScanCore');
  return roots;
}
