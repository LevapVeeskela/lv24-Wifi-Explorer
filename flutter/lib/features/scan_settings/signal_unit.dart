import 'package:scan_domain/scan_domain.dart';

import '../../shared/i18n/app_localizations.dart';
import '../scan_details/chart_timescale.dart';
import 'types.dart';

/// Maps persisted Settings → General signal unit onto chart toolbar units.
SignalChartUnit signalDisplayToChartUnit(SignalDisplayUnit unit) {
  return unit == SignalDisplayUnit.dbm ? SignalChartUnit.dbm : SignalChartUnit.pct;
}

SignalDisplayUnit chartUnitToSignalDisplay(SignalChartUnit unit) {
  return unit == SignalChartUnit.dbm
      ? SignalDisplayUnit.dbm
      : SignalDisplayUnit.percent;
}

/// Grid / details / print / CSV: `−67 dBm` or `50%` (Electron `formatDbm` / percent).
String formatSignalDisplay(num rssiDbm, SignalDisplayUnit unit) {
  if (unit == SignalDisplayUnit.dbm) {
    return '${rssiDbm.round()} dBm';
  }
  return '${percentFromDbm(rssiDbm.toDouble())}%';
}

/// Details / compare chrome: `dBm` or `Signal` matching [unit].
String signalDisplayLabel(AppLocalizations l10n, SignalDisplayUnit unit) {
  return unit == SignalDisplayUnit.dbm
      ? l10n.scanSettingsSignalUnitDbm
      : l10n.scanDetailsSignalPct;
}
