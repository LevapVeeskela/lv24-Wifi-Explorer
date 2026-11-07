import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../../shared/i18n/app_localizations.dart';
import 'chart_panel.dart';
import 'occupancy_bar_painter.dart';

class OccupancyChart extends StatelessWidget {
  const OccupancyChart({
    super.key,
    required this.bssList,
    required this.band,
    this.selectedChannel,
    this.selectedColor,
    this.height = 160,
    this.showBandInTitle = true,
  });

  final List<ObservedBss> bssList;
  final WifiBand band;
  final int? selectedChannel;
  final Color? selectedColor;
  final double height;
  final bool showBandInTitle;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final bars = computeBandOccupancy(
      bssList,
      band,
      selectedChannel: selectedChannel,
    );
    final tickEvery = band == WifiBand.ghz6 ? 8 : (band == WifiBand.ghz5 ? 2 : 1);
    final title = showBandInTitle
        ? '${band.asDouble} GHz · ${l10n.scanChartOccupancy}'
        : l10n.scanChartOccupancy;

    return ChartPanel(
      semanticsLabel: l10n.scanChartOccupancy,
      title: title,
      footer: Text(l10n.scanChartOccupancyHint, style: theme.textTheme.labelSmall),
      child: SizedBox(
        height: height - 56,
        child: CustomPaint(
          painter: OccupancyBarPainter(
            bars: bars,
            barColor: theme.colorScheme.secondary.withValues(alpha: 0.55),
            selectedColor: selectedColor ?? theme.colorScheme.primary,
            mutedColor: theme.colorScheme.onSurfaceVariant,
            tickEvery: tickEvery,
          ),
          child: const SizedBox.expand(),
        ),
      ),
    );
  }
}
