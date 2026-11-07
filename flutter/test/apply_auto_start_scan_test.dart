import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_filters/scan_filters.dart';
import 'package:lv24_wifi_explorer/features/scan_settings/scan_settings.dart';

void main() {
  test('shouldAutoStartScanOnLaunch follows the persisted flag', () {
    expect(shouldAutoStartScanOnLaunch(false), isFalse);
    expect(shouldAutoStartScanOnLaunch(true), isTrue);
  });

  test('autoStartUsesLiveScan respects LIVE_SCAN / preferDemo', () {
    expect(
      autoStartUsesLiveScan(
        autoStartScanOnLaunch: false,
        preferDemo: false,
      ),
      isFalse,
    );
    expect(
      autoStartUsesLiveScan(
        autoStartScanOnLaunch: true,
        preferDemo: true,
      ),
      isFalse,
    );
    expect(
      autoStartUsesLiveScan(
        autoStartScanOnLaunch: true,
        preferDemo: false,
      ),
      isTrue,
    );
    expect(
      autoStartUsesLiveScan(
        autoStartScanOnLaunch: true,
        preferDemo: true,
        liveScan: true,
      ),
      isTrue,
    );
    expect(
      autoStartUsesLiveScan(
        autoStartScanOnLaunch: true,
        preferDemo: false,
        liveScan: false,
      ),
      isFalse,
    );
  });

  test('workbench filters take minRssi and hidden from settings', () {
    const settings = ScanWorkbenchSettings(
      scanIntervalSec: 5,
      preferDemo: true,
      languageCode: 'en',
      minRssiDbm: -70,
      includeHiddenSsid: false,
    );
    final filters = workbenchFiltersFromScanSettings(settings);
    expect(filters.minRssiDbm, -70);
    expect(filters.includeHiddenSsid, isFalse);

    final cleared = syncWorkbenchFiltersFromScanSettings(
      filters,
      settings.copyWith(clearMinRssi: true, includeHiddenSsid: true),
    );
    expect(cleared.minRssiDbm, isNull);
    expect(cleared.includeHiddenSsid, isTrue);
    expect(settingsOwnedFiltersChanged(filters, cleared), isTrue);
  });
}
