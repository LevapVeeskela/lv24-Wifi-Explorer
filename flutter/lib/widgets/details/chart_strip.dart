import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../../features/channel_occupancy/band_visibility.dart';
import '../../features/scan_details/bss_accessors.dart';
import '../../features/scan_details/chart_timescale.dart';
import '../../features/scan_details/series_color.dart';
import '../../features/scan_settings/types.dart';
import 'occupancy_chart.dart';
import 'selected_channel_chart.dart';
import 'signal_history_chart.dart';

class ChartStrip extends StatelessWidget {
  const ChartStrip({
    super.key,
    required this.bss,
    required this.allBss,
    required this.chartUnit,
    required this.onChartUnitChange,
    required this.timescale,
    this.onTimescaleChange,
    this.pinnedColors,
    this.hideEmptyBands = false,
    this.graphLabelMode = GraphLabelMode.ssid,
    this.annotation = '',
  });

  final ObservedBss? bss;
  final List<ObservedBss> allBss;
  final Map<String, String>? pinnedColors;
  final GraphLabelMode graphLabelMode;
  final String annotation;
  final SignalChartUnit chartUnit;
  final ValueChanged<SignalChartUnit> onChartUnitChange;
  final ChartTimescale timescale;
  final ValueChanged<ChartTimescale>? onTimescaleChange;
  final bool hideEmptyBands;

  @override
  Widget build(BuildContext context) {
    final rowBand = bss?.channel.band;
    final visibleBands = visibleOccupancyBands(allBss, hideEmptyBands);
    final occupancyBand = pickOccupancyBand(rowBand, visibleBands);
    final showOccupancy =
        !hideEmptyBands || visibleBands.contains(occupancyBand);
    final selectedChannel = bss?.channel.number;
    final selectedColor = seriesColorForBss(bssidOf(bss), pinnedColors: pinnedColors);

    return LayoutBuilder(
      builder: (context, constraints) {
        final stacked = constraints.maxWidth < 720;
        final children = <Widget>[
          SignalHistoryChart(
            bss: bss,
            pinnedColors: pinnedColors,
            unit: chartUnit,
            onUnitChange: onChartUnitChange,
            timescale: timescale,
            onTimescaleChange: onTimescaleChange,
            graphLabelMode: graphLabelMode,
            annotation: annotation,
          ),
          SelectedChannelChart(
            bss: bss,
            pinnedColors: pinnedColors,
            graphLabelMode: graphLabelMode,
            annotation: annotation,
            unit: chartUnit,
          ),
          if (showOccupancy)
            OccupancyChart(
              bssList: allBss,
              band: occupancyBand,
              selectedChannel: selectedChannel,
              selectedColor: selectedColor,
            ),
        ];
        if (stacked) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (var i = 0; i < children.length; i++) ...[
                if (i > 0) const SizedBox(height: 8),
                children[i],
              ],
            ],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var i = 0; i < children.length; i++) ...[
              if (i > 0) const SizedBox(width: 8),
              Expanded(child: children[i]),
            ],
          ],
        );
      },
    );
  }
}
