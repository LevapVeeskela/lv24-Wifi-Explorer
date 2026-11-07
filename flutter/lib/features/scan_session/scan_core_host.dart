/// Non-IO stub: ScanCore spawn is macOS + `dart:io` only.
bool get canSpawnScanCore => false;

String? guessRepoRoot({String? explicit}) {
  if (explicit != null && explicit.isNotEmpty) return explicit;
  return null;
}

String? macosScanCoreResourcesPath() => null;
