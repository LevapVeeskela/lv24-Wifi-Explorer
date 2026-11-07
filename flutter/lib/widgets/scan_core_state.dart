/// ScanCore line in the status bar (Electron `scanCoreState`).
enum ScanCoreState {
  ok,
  error,
  demo,
}

ScanCoreState scanCoreStateFromFlags({
  required bool demo,
  bool error = false,
}) {
  if (demo) return ScanCoreState.demo;
  if (error) return ScanCoreState.error;
  return ScanCoreState.ok;
}
