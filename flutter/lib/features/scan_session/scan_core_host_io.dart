import 'dart:io';

/// ScanCore is a macOS helper (CoreWLAN + CoreLocation). Never airport / wdutil / IO80211.
bool get canSpawnScanCore => Platform.isMacOS;

/// Walks from [explicit], cwd, and the resolved executable to the repo root
/// that contains `native/ScanCore` or `resources/fixtures`.
String? guessRepoRoot({String? explicit}) {
  if (explicit != null && explicit.isNotEmpty) return explicit;

  final seeds = <String>{
    Directory.current.path,
    File(Platform.resolvedExecutable).parent.path,
  };

  for (final seed in seeds) {
    var cursor = seed;
    for (var i = 0; i < 8; i++) {
      final scanCore = Directory('$cursor/native/ScanCore');
      final fixture = File('$cursor/resources/fixtures/scan-snapshot.json');
      if (scanCore.existsSync() || fixture.existsSync()) return cursor;
      final parent = Directory(cursor).parent.path;
      if (parent == cursor) break;
      cursor = parent;
    }
  }
  return null;
}

/// Packaged Flutter macOS: `App.app/Contents/Resources` (ScanCore.app extra resource).
String? macosScanCoreResourcesPath() {
  if (!Platform.isMacOS) return null;
  final macosDir = File(Platform.resolvedExecutable).parent;
  if (!macosDir.path.endsWith('MacOS')) return null;
  final resources = Directory('${macosDir.parent.path}/Resources');
  if (!resources.existsSync()) return null;
  return resources.path;
}
