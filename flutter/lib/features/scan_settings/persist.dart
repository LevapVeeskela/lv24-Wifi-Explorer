import 'dart:convert';

import 'constants.dart';
import 'normalize.dart';
import 'persist_backend_mobile.dart'
    if (dart.library.html) 'persist_backend_mobile_stub.dart';
import 'persist_file_stub.dart'
    if (dart.library.io) 'persist_file_io.dart';
import 'types.dart';

export 'persist_file_stub.dart'
    if (dart.library.io) 'persist_file_io.dart';

String? _memoryPayload;

ScanSettingsFileBackend _backend = createScanSettingsFileBackend();

/// Overrides file backend (tests).
void debugOverrideScanSettingsBackend(ScanSettingsFileBackend backend) {
  _backend = backend;
}

/// Isolates tests from `~/.config` / SharedPreferences file writes.
void debugUseMemoryScanSettingsBackend() {
  _memoryPayload = null;
  _backend = const ScanSettingsFileBackend.unavailable();
}

void debugResetScanSettingsPersistence() {
  _memoryPayload = null;
  _backend = createScanSettingsFileBackend();
}

ScanWorkbenchSettings loadScanWorkbenchSettings() {
  final fromFile = _parsePayload(_backend.readSync());
  if (fromFile != null) return fromFile;
  return _parsePayload(_memoryPayload) ?? scanWorkbenchSettingsDefaults;
}

/// Parses a settings JSON payload (Flutter v2 or Electron v1).
ScanWorkbenchSettings parseScanWorkbenchSettingsPayload(String? raw) {
  return _parsePayload(raw) ?? scanWorkbenchSettingsDefaults;
}

void saveScanWorkbenchSettings(ScanWorkbenchSettings settings) {
  final normalized = normalizeScanWorkbenchSettings(settings);
  final payload = jsonEncode(
    ScanWorkbenchSettingsStoreV2.fromSettings(normalized).toJson(),
  );
  _memoryPayload = payload;
  _backend.writeSync(payload);
}

ScanWorkbenchSettings? _parsePayload(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  try {
    final parsed = jsonDecode(raw);
    if (parsed is! Map<String, dynamic>) {
      return normalizeScanWorkbenchSettingsMap(null);
    }
    final version = parsed['version'];
    if (version == 2) {
      return normalizeScanWorkbenchSettingsMap(parsed);
    }
    // Electron v1 store: { version: 1, signalUnit, … } plus Flutter extras if present.
    if (version == 1 || parsed.containsKey('signalUnit')) {
      return normalizeScanWorkbenchSettingsMap({
        'scanIntervalSec': parsed['scanIntervalSec'],
        'preferDemo': parsed['preferDemo'],
        'languageCode': parsed['languageCode'],
        'signalUnit': parsed['signalUnit'],
        'minRssiDbm': parsed['minRssiDbm'],
        'autoStartScanOnLaunch': parsed['autoStartScanOnLaunch'],
        'includeHiddenSsid': parsed['includeHiddenSsid'],
        'hideEmptySpectrumBand': parsed['hideEmptySpectrumBand'],
        'graphLabelMode': parsed['graphLabelMode'],
        'appearanceFollowSystem': parsed['appearanceFollowSystem'],
      });
    }
    return normalizeScanWorkbenchSettingsMap(parsed);
  } catch (_) {
    return null;
  }
}

/// Key shared with Electron for documentation / future unified storage.
String get scanSettingsPersistenceKey => scanSettingsStorageKey;

/// Loads mobile [SharedPreferences] cache before sync reads (no-op on desktop/web).
Future<void> ensureScanSettingsPersistenceReady() =>
    ensureScanSettingsMobileBackendReady();
