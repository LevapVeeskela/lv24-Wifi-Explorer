import '../scan_settings/types.dart';
import 'scan_workbench_filters.dart';

ScanWorkbenchFilters workbenchFiltersFromScanSettings(
  ScanWorkbenchSettings settings,
) {
  return ScanWorkbenchFilters.defaults.copyWith(
    includeHiddenSsid: settings.includeHiddenSsid,
    minRssiDbm: settings.minRssiDbm,
    clearMinRssi: settings.minRssiDbm == null,
  );
}

/// Keeps toolbar filters; refreshes fields owned by scan settings.
ScanWorkbenchFilters syncWorkbenchFiltersFromScanSettings(
  ScanWorkbenchFilters current,
  ScanWorkbenchSettings settings,
) {
  return current.copyWith(
    includeHiddenSsid: settings.includeHiddenSsid,
    minRssiDbm: settings.minRssiDbm,
    clearMinRssi: settings.minRssiDbm == null,
  );
}

bool settingsOwnedFiltersChanged(
  ScanWorkbenchFilters previous,
  ScanWorkbenchFilters next,
) {
  return previous.includeHiddenSsid != next.includeHiddenSsid ||
      previous.minRssiDbm != next.minRssiDbm;
}
