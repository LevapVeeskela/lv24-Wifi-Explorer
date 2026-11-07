import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../../features/annotations/annotations.dart';
import '../../features/scan_details/bss_accessors.dart';
import '../../features/scan_session/bss_display.dart';
import '../../features/scan_settings/signal_unit.dart';
import '../../features/scan_settings/types.dart';
import '../../shared/i18n/app_localizations.dart';
import 'details_field.dart';
import 'network_annotation_section.dart';

class NetworkDetailsTab extends StatelessWidget {
  const NetworkDetailsTab({
    super.key,
    required this.bss,
    this.annotations,
    this.signalUnit = SignalDisplayUnit.percent,
  });

  final ObservedBss bss;
  final AnnotationsController? annotations;
  final SignalDisplayUnit signalUnit;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final maxRate = formatMaxRateMbps(bss);
    final frequency = formatFrequencyMHz(bss);
    final encryption = formatEncryptionSummary(bss, empty: l10n.emDash);
    final networkType =
        bss.ibss ? l10n.scanTypeIbss : l10n.scanTypeInfrastructure;

    return LayoutBuilder(
      builder: (context, constraints) {
        final twoCol = constraints.maxWidth >= 520;
        final fields = <Widget>[
          DetailsField(label: l10n.scanDetailsSsid, value: displaySsid(bss, l10n)),
          DetailsField(label: l10n.scanDetailsBand, value: displayBand(bss.channel.band, l10n)),
          DetailsField(label: l10n.scanDetailsBssid, value: displayBssid(bss, l10n), mono: true),
          DetailsField(
            label: l10n.scanDetailsPhyMode,
            value: bss.phy.display.isEmpty ? l10n.emDash : bss.phy.display,
          ),
          DetailsField(
            label: l10n.scanDetailsVendor,
            value: bss.vendor.organization ?? bss.vendor.match,
          ),
          DetailsField(
            label: l10n.scanDetailsMaxRateMbps,
            value: maxRate.isEmpty ? l10n.emDash : maxRate,
            unavailable: maxRate.isEmpty,
            unavailableHint: l10n.scanFieldUnavailable,
          ),
          DetailsField(
            label: l10n.scanDetailsSignalQuality,
            value: displayQuality(bss.signal.quality, l10n),
          ),
          DetailsField(label: l10n.scanDetailsChannel, value: '${bss.channel.number}'),
          DetailsField(
            label: signalDisplayLabel(l10n, signalUnit),
            value: formatSignalDisplay(bss.signal.rssiDbm, signalUnit),
          ),
          DetailsField(
            label: l10n.scanDetailsNoiseDbm,
            value: displayDbm(bss.signal.noiseDbm, l10n),
            unavailable: bss.signal.noiseDbm == null,
            unavailableHint: l10n.scanFieldUnavailable,
          ),
          DetailsField(label: l10n.scanDetailsNetworkType, value: networkType),
          DetailsField(label: l10n.scanDetailsSecurity, value: displaySecurity(bss.security.primary)),
          DetailsField(
            label: l10n.scanDetailsEncryption,
            value: encryption,
            unavailable: encryption == l10n.emDash,
            unavailableHint: l10n.scanFieldUnavailable,
          ),
          DetailsField(
            label: l10n.scanDetailsChannelWidth,
            value: displayWidth(bss.channel.widthMhz, l10n),
          ),
          DetailsField(
            label: l10n.scanDetailsSnrDb,
            value: bss.signal.snrDb == null ? l10n.emDash : '${bss.signal.snrDb!.round()} dB',
            unavailable: bss.signal.snrDb == null,
            unavailableHint: l10n.scanFieldUnavailable,
          ),
          DetailsField(
            label: l10n.scanDetailsFrequencyMHz,
            value: frequency.isEmpty ? l10n.emDash : frequency,
            unavailable: frequency.isEmpty,
            unavailableHint: l10n.scanFieldUnavailable,
          ),
          DetailsField(label: l10n.scanDetailsCountry, value: gatedText(bss.countryCode, l10n)),
          DetailsField(label: l10n.scanDetailsFirstSeen, value: bss.presence.firstSeenAt),
          DetailsField(label: l10n.scanDetailsLastSeen, value: bss.presence.lastSeenAt),
          DetailsField(label: l10n.scanDetailsConnected, value: l10n.emDash),
          if (annotations != null) ...[
            const SizedBox(height: 8),
            NetworkAnnotationSection(bss: bss, controller: annotations!),
          ],
        ];

        if (!twoCol) {
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: fields);
        }

        final half = (fields.length / 2).ceil();
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: Column(children: fields.sublist(0, half))),
            const SizedBox(width: 12),
            Expanded(child: Column(children: fields.sublist(half))),
          ],
        );
      },
    );
  }
}
