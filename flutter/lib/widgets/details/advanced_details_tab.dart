import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../../features/ie_view/ie_source.dart';
import '../../features/ie_view/ie_tree_panel.dart';
import '../../features/scan_details/bss_accessors.dart';
import '../../features/scan_issues/compute_issue_keys.dart';
import '../../features/scan_session/bss_display.dart';
import '../../shared/i18n/app_localizations.dart';
import '../scan_issue_chips.dart';
import 'details_field.dart';

class AdvancedDetailsTab extends StatelessWidget {
  const AdvancedDetailsTab({
    super.key,
    required this.bss,
    this.allBss,
  });

  final ObservedBss bss;
  final List<ObservedBss>? allBss;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final encryption = formatEncryptionSummary(bss, empty: l10n.emDash);
    final country = gatedText(bss.countryCode, l10n);
    final frequency = formatFrequencyMHz(bss);
    final maxRate = formatMaxRateMbps(bss);
    final decoded = decodeIesForObservedBss(bss);
    final ieSummary = ieSummaryLine(bss, decoded);
    final ieExtra = [
      if (bss.ie.htSecondaryOffset != null) 'HT+${bss.ie.htSecondaryOffset}',
      if (bss.ie.ccfs0 != null) 'CCFS0=${bss.ie.ccfs0}',
    ].join(' · ');
    final ieSummaryWithHints = ieExtra.isEmpty ? ieSummary : '$ieSummary · $ieExtra';

    return Column(
      children: [
        _Section(
          title: l10n.scanAdvRadio,
          initiallyExpanded: true,
          children: [
            DetailsField(label: l10n.scanDetailsChannel, value: '${bss.channel.number}'),
            DetailsField(label: l10n.scanDetailsBand, value: displayBand(bss.channel.band, l10n)),
            DetailsField(
              label: l10n.scanDetailsChannelWidth,
              value: displayWidth(bss.channel.widthMhz, l10n),
            ),
            DetailsField(
              label: l10n.scanDetailsFrequencyMHz,
              value: frequency.isEmpty ? l10n.emDash : frequency,
              unavailable: frequency.isEmpty,
              unavailableHint: l10n.scanFieldUnavailable,
            ),
            DetailsField(
              label: l10n.scanDetailsPhyMode,
              value: bss.phy.display.isEmpty ? l10n.emDash : bss.phy.display,
            ),
            DetailsField(
              label: l10n.scanDetailsMaxRateMbps,
              value: maxRate.isEmpty ? l10n.emDash : maxRate,
              unavailable: maxRate.isEmpty,
              unavailableHint: l10n.scanFieldUnavailable,
            ),
            DetailsField(
              label: l10n.scanDetailsNoiseDbm,
              value: displayDbm(bss.signal.noiseDbm, l10n),
              unavailable: bss.signal.noiseDbm == null,
              unavailableHint: l10n.scanFieldUnavailable,
            ),
            DetailsField(
              label: l10n.scanDetailsSnrDb,
              value: bss.signal.snrDb == null ? l10n.emDash : '${bss.signal.snrDb!.round()} dB',
              unavailable: bss.signal.snrDb == null,
              unavailableHint: l10n.scanFieldUnavailable,
            ),
            DetailsField(
              label: l10n.scanDetailsCountry,
              value: country,
              unavailable: country == l10n.emDash || country == l10n.redacted,
              unavailableHint: l10n.scanFieldUnavailable,
            ),
          ],
        ),
        _Section(
          title: l10n.scanAdvSecurity,
          children: [
            DetailsField(label: l10n.scanDetailsSecurity, value: displaySecurity(bss.security.primary)),
            DetailsField(
              label: l10n.scanDetailsEncryption,
              value: encryption,
              unavailable: encryption == l10n.emDash,
              unavailableHint: l10n.scanFieldUnavailable,
            ),
            DetailsField(
              label: l10n.scanDetailsSecurity,
              value: bss.security.flags.map(displaySecurity).join(', ').isEmpty
                  ? l10n.emDash
                  : bss.security.flags.map(displaySecurity).join(', '),
            ),
          ],
        ),
        _Section(
          title: l10n.scanAdvIesTree,
          initiallyExpanded: true,
          children: [
            DetailsField(
              label: l10n.scanAdvIes,
              value: ieSummaryWithHints,
              unavailable: bss.ie.level == 'absent' && decoded.byteLength == 0,
              unavailableHint: l10n.scanFieldUnavailable,
            ),
            IeTreePanel(bss: bss),
          ],
        ),
        _Section(
          title: l10n.scanAdvIssues,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: ScanIssueChips(
                issueKeys: computeIssueKeys(bss, allBss ?? const []),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.title,
    required this.children,
    this.initiallyExpanded = false,
  });

  final String title;
  final List<Widget> children;
  final bool initiallyExpanded;

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      tilePadding: EdgeInsets.zero,
      initiallyExpanded: initiallyExpanded,
      title: Text(title, style: Theme.of(context).textTheme.titleSmall),
      children: children,
    );
  }
}
