import 'dart:async';

import 'package:flutter/foundation.dart';

import 'normalize.dart';
import 'persist.dart';
import 'types.dart';

class ScanSettingsController extends ChangeNotifier {
  ScanSettingsController({ScanWorkbenchSettings? initial, bool hydrate = true})
      : _settings = normalizeScanWorkbenchSettings(
          initial ?? loadScanWorkbenchSettings(),
        ) {
    if (hydrate) {
      unawaited(_hydrateFromPersistence());
    }
  }

  ScanWorkbenchSettings _settings;
  bool _hydrated = false;

  ScanWorkbenchSettings get settings => _settings;

  bool get hydrated => _hydrated;

  Future<void> _hydrateFromPersistence() async {
    await ensureScanSettingsPersistenceReady();
    final stored = loadScanWorkbenchSettings();
    if (stored != _settings) {
      _settings = stored;
      notifyListeners();
    }
    _hydrated = true;
  }

  void replace(ScanWorkbenchSettings next) {
    final normalized = normalizeScanWorkbenchSettings(next);
    if (normalized == _settings) return;
    _settings = normalized;
    saveScanWorkbenchSettings(normalized);
    notifyListeners();
  }

  void patch({
    int? scanIntervalSec,
    bool? preferDemo,
    String? languageCode,
    SignalDisplayUnit? signalUnit,
    int? minRssiDbm,
    bool clearMinRssi = false,
    bool? autoStartScanOnLaunch,
    bool? includeHiddenSsid,
    bool? hideEmptySpectrumBand,
    GraphLabelMode? graphLabelMode,
    bool? appearanceFollowSystem,
  }) {
    replace(
      _settings.copyWith(
        scanIntervalSec: scanIntervalSec,
        preferDemo: preferDemo,
        languageCode: languageCode,
        signalUnit: signalUnit,
        minRssiDbm: minRssiDbm,
        clearMinRssi: clearMinRssi,
        autoStartScanOnLaunch: autoStartScanOnLaunch,
        includeHiddenSsid: includeHiddenSsid,
        hideEmptySpectrumBand: hideEmptySpectrumBand,
        graphLabelMode: graphLabelMode,
        appearanceFollowSystem: appearanceFollowSystem,
      ),
    );
  }
}
