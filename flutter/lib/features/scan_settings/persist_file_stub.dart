ScanSettingsFileBackend createScanSettingsFileBackend() =>
    const ScanSettingsFileBackend.unavailable();

class ScanSettingsFileBackend {
  const ScanSettingsFileBackend.unavailable();

  bool get isAvailable => false;

  String? readSync() => null;

  void writeSync(String contents) {}
}
