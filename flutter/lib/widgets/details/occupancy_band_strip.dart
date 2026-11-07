import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../../features/channel_occupancy/band_visibility.dart';
import '../../features/scan_details/bss_accessors.dart';
import '../../features/scan_details/series_color.dart';
import '../../shared/i18n/app_localizations.dart';
import 'occupancy_chart.dart';

class OccupancyBandStrip extends StatefulWidget {
  const OccupancyBandStrip({
    super.key,
    required this.allBss,
    required this.bss,
    this.height = 280,
    this.pinnedColors,
    this.hideEmptyBands = false,
  });

  final List<ObservedBss> allBss;
  final ObservedBss? bss;
  final double height;
  final Map<String, String>? pinnedColors;
  final bool hideEmptyBands;

  @override
  State<OccupancyBandStrip> createState() => _OccupancyBandStripState();
}

class _OccupancyBandStripState extends State<OccupancyBandStrip> {
  WifiBand _band = WifiBand.ghz5;

  @override
  void initState() {
    super.initState();
    _syncBand(force: true);
  }

  @override
  void didUpdateWidget(covariant OccupancyBandStrip oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.allBss != widget.allBss ||
        oldWidget.bss != widget.bss ||
        oldWidget.hideEmptyBands != widget.hideEmptyBands) {
      _syncBand(force: false);
    }
  }

  void _syncBand({required bool force}) {
    final visible = visibleOccupancyBands(widget.allBss, widget.hideEmptyBands);
    final preferred = widget.bss?.channel.band;
    final anchor = preferred ?? _band;
    final next = pickOccupancyBand(
      anchor,
      visible,
      fallback: force ? WifiBand.ghz5 : _band,
    );
    if (next != _band) {
      setState(() => _band = next);
    }
  }

  String _bandTabLabel(AppLocalizations l10n, WifiBand band) {
    return switch (band) {
      WifiBand.ghz24 => l10n.scanFilterBand24,
      WifiBand.ghz5 => l10n.scanFilterBand5,
      WifiBand.ghz6 => l10n.scanFilterBand6,
    };
  }

  String _emptyMessage(AppLocalizations l10n, WifiBand band, bool noVisible) {
    if (noVisible) return l10n.scanChartEmpty;
    if (band == WifiBand.ghz6) return l10n.scanFilterBand6Empty;
    final bandStr = band.asDouble.toString();
    return l10n.localeName.startsWith('ru')
        ? 'В этом скане нет сетей $bandStr ГГц'
        : 'No $bandStr GHz networks in this scan';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final visible = visibleOccupancyBands(widget.allBss, widget.hideEmptyBands);
    final noVisible = visible.isEmpty;
    final activeBand =
        noVisible ? _band : pickOccupancyBand(_band, visible, fallback: _band);
    final showBandTabs = visible.length > 1;
    final bandEmpty = noVisible || !bandHasBss(widget.allBss, activeBand);
    final selectedOnBand = widget.bss?.channel.band == activeBand;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (showBandTabs)
          Align(
            alignment: Alignment.centerLeft,
            child: SegmentedButton<WifiBand>(
              showSelectedIcon: false,
              segments: [
                for (final band in visible)
                  ButtonSegment(
                    value: band,
                    label: Text(_bandTabLabel(l10n, band)),
                  ),
              ],
              selected: {activeBand},
              onSelectionChanged: (next) {
                if (next.isEmpty) return;
                setState(() => _band = next.first);
              },
            ),
          ),
        if (showBandTabs) const SizedBox(height: 8),
        if (bandEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Text(
              _emptyMessage(l10n, activeBand, noVisible),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          )
        else
          OccupancyChart(
            bssList: widget.allBss,
            band: activeBand,
            height: widget.height,
            showBandInTitle: !showBandTabs,
            selectedChannel:
                selectedOnBand ? widget.bss?.channel.number : null,
            selectedColor: selectedOnBand
                ? seriesColorForBss(
                    bssidOf(widget.bss),
                    pinnedColors: widget.pinnedColors,
                  )
                : null,
          ),
      ],
    );
  }
}
