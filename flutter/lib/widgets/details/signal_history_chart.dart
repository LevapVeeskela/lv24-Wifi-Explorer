import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../../features/scan_details/bss_accessors.dart';
import '../../features/scan_details/chart_timescale.dart';
import '../../features/scan_details/series_color.dart';
import '../../features/scan_details/signal_series.dart';
import '../../features/scan_settings/graph_label_for_row.dart';
import '../../features/scan_settings/types.dart';
import '../../shared/i18n/app_localizations.dart';
import 'chart_panel.dart';
import 'sparkline_painter.dart';

class SignalHistoryChart extends StatefulWidget {
  const SignalHistoryChart({
    super.key,
    required this.bss,
    required this.unit,
    required this.onUnitChange,
    required this.timescale,
    this.onTimescaleChange,
    this.height = 160,
    this.pinnedColors,
    this.graphLabelMode = GraphLabelMode.ssid,
    this.annotation = '',
  });

  final ObservedBss? bss;
  final Map<String, String>? pinnedColors;
  final GraphLabelMode graphLabelMode;
  final String annotation;
  final SignalChartUnit unit;
  final ValueChanged<SignalChartUnit> onUnitChange;
  final ChartTimescale timescale;
  final ValueChanged<ChartTimescale>? onTimescaleChange;
  final double height;

  @override
  State<SignalHistoryChart> createState() => _SignalHistoryChartState();
}

class _SignalHistoryChartState extends State<SignalHistoryChart> {
  late ChartTimescale _localTimescale;

  @override
  void initState() {
    super.initState();
    _localTimescale = widget.timescale;
  }

  @override
  void didUpdateWidget(covariant SignalHistoryChart oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.onTimescaleChange == null) {
      _localTimescale = widget.timescale;
    }
  }

  ChartTimescale get _timescale =>
      widget.onTimescaleChange != null ? widget.timescale : _localTimescale;

  void _setTimescale(ChartTimescale value) {
    if (widget.onTimescaleChange != null) {
      widget.onTimescaleChange!(value);
    } else {
      setState(() => _localTimescale = value);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final series = buildSignalSeries(widget.bss, widget.unit, timescale: _timescale);
    final color = seriesColorForBss(bssidOf(widget.bss), pinnedColors: widget.pinnedColors);
    final yMin = widget.unit == SignalChartUnit.dbm ? -100.0 : 0.0;
    final yMax = widget.unit == SignalChartUnit.dbm ? 0.0 : 100.0;
    final graphLabel = graphLabelForBss(
      widget.bss,
      l10n,
      mode: widget.graphLabelMode,
      annotation: widget.annotation,
    );
    final title = graphLabel.isEmpty ? l10n.scanChartSignal : graphLabel;

    final normalized = _normalizeSeries(series);

    return ChartPanel(
      semanticsLabel: title,
      title: title,
      toolbar: SegmentedButton<SignalChartUnit>(
        showSelectedIcon: false,
        segments: [
          ButtonSegment(value: SignalChartUnit.pct, label: Text(l10n.scanChartUnitPct)),
          ButtonSegment(value: SignalChartUnit.dbm, label: Text(l10n.scanChartUnitDbm)),
        ],
        selected: {widget.unit},
        onSelectionChanged: (next) {
          if (next.isNotEmpty) widget.onUnitChange(next.first);
        },
      ),
      footer: Text(
        '${l10n.scanChartTimescale}: ${chartTimescaleLabel(_timescale)}',
        style: Theme.of(context).textTheme.labelSmall,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: 4,
            runSpacing: 4,
            children: [
              for (final scale in chartTimescaleOrder)
                ChoiceChip(
                  label: Text(chartTimescaleLabel(scale)),
                  selected: _timescale == scale,
                  onSelected: (_) => _setTimescale(scale),
                  visualDensity: VisualDensity.compact,
                ),
            ],
          ),
          const SizedBox(height: 6),
          SizedBox(
            height: widget.height - 88,
            child: normalized.isEmpty
                ? Center(
                    child: Text(l10n.scanChartEmpty, style: Theme.of(context).textTheme.bodySmall),
                  )
                : CustomPaint(
                    painter: SparklinePainter(
                      points: normalized,
                      color: color,
                      yMin: yMin,
                      yMax: yMax,
                    ),
                    child: const SizedBox.expand(),
                  ),
          ),
        ],
      ),
    );
  }

  List<Offset> _normalizeSeries(List<SignalSeriesPoint> series) {
    if (series.isEmpty) return const [];
    final start = series.first.at.millisecondsSinceEpoch;
    final end = series.last.at.millisecondsSinceEpoch;
    final span = (end - start).abs();
    return [
      for (final point in series)
        Offset(
          span == 0 ? 0.5 : (point.at.millisecondsSinceEpoch - start) / span,
          point.y,
        ),
    ];
  }
}
