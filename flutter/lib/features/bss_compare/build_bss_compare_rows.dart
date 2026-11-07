import 'package:scan_domain/scan_domain.dart';

import '../scan_details/bss_accessors.dart';
import '../scan_session/bss_display.dart';
import '../scan_settings/signal_unit.dart';
import '../scan_settings/types.dart';
import '../../shared/i18n/app_localizations.dart';
import 'bss_compare_field.dart';

List<BssCompareFieldRow> buildBssCompareRows(
  List<ObservedBss> networks,
  AppLocalizations l10n, {
  SignalDisplayUnit signalUnit = SignalDisplayUnit.percent,
}) {
  if (networks.length < 2) return const [];

  BssCompareFieldRow row(
    String id,
    String label,
    String Function(ObservedBss bss) format, {
    bool mono = false,
  }) {
    final values = networks.map(format).toList();
    final first = values.first;
    final differs = values.any((v) => v != first);
    return BssCompareFieldRow(
      id: id,
      label: label,
      values: values,
      differs: differs,
      mono: mono,
    );
  }

  return [
    row('ssid', l10n.scanDetailsSsid, (b) => displaySsid(b, l10n)),
    row('bssid', l10n.scanDetailsBssid, (b) => displayBssid(b, l10n), mono: true),
    row(
      'vendor',
      l10n.scanDetailsVendor,
      (b) => b.vendor.organization ?? b.vendor.match,
    ),
    row(
      'signalQuality',
      l10n.scanDetailsSignalQuality,
      (b) => displayQuality(b.signal.quality, l10n),
    ),
    row(
      signalUnit == SignalDisplayUnit.dbm ? 'rssi' : 'signalPct',
      signalDisplayLabel(l10n, signalUnit),
      (b) => formatSignalDisplay(b.signal.rssiDbm, signalUnit),
    ),
    row(
      'noise',
      l10n.scanDetailsNoiseDbm,
      (b) => displayDbm(b.signal.noiseDbm, l10n),
    ),
    row(
      'snr',
      l10n.scanDetailsSnrDb,
      (b) => b.signal.snrDb == null ? l10n.emDash : '${b.signal.snrDb!.round()} dB',
    ),
    row(
      'channel',
      l10n.scanDetailsChannel,
      (b) => '${b.channel.number}',
    ),
    row(
      'band',
      l10n.scanDetailsBand,
      (b) => displayBand(b.channel.band, l10n),
    ),
    row(
      'width',
      l10n.scanDetailsChannelWidth,
      (b) => displayWidth(b.channel.widthMhz, l10n),
    ),
    row(
      'frequency',
      l10n.scanDetailsFrequencyMHz,
      (b) {
        final f = formatFrequencyMHz(b);
        return f.isEmpty ? l10n.emDash : f;
      },
    ),
    row(
      'phy',
      l10n.scanDetailsPhyMode,
      (b) => b.phy.display.isEmpty ? l10n.emDash : b.phy.display,
    ),
    row(
      'security',
      l10n.scanDetailsSecurity,
      (b) => displaySecurity(b.security.primary),
    ),
    row(
      'encryption',
      l10n.scanDetailsEncryption,
      (b) => formatEncryptionSummary(b, empty: l10n.emDash),
    ),
    row(
      'maxRate',
      l10n.scanDetailsMaxRateMbps,
      (b) {
        final r = formatMaxRateMbps(b);
        return r.isEmpty ? l10n.emDash : r;
      },
    ),
    row(
      'networkType',
      l10n.scanDetailsNetworkType,
      (b) => b.ibss ? l10n.scanTypeIbss : l10n.scanTypeInfrastructure,
    ),
    row(
      'country',
      l10n.scanDetailsCountry,
      (b) => gatedText(b.countryCode, l10n),
    ),
    row(
      'firstSeen',
      l10n.scanDetailsFirstSeen,
      (b) => b.presence.firstSeenAt,
    ),
    row(
      'lastSeen',
      l10n.scanDetailsLastSeen,
      (b) => b.presence.lastSeenAt,
    ),
  ];
}

/// Resolve [keysInOrder] against [allRows] (stable compare column order).
List<ObservedBss> resolveCompareNetworks(
  List<ObservedBss> allRows,
  List<String> keysInOrder,
) {
  if (keysInOrder.isEmpty) return const [];
  final byKey = {for (final row in allRows) rowKey(row): row};
  final out = <ObservedBss>[];
  for (final key in keysInOrder) {
    final row = byKey[key];
    if (row != null) out.add(row);
  }
  return out;
}
