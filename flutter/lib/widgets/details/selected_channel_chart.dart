import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../../features/scan_details/bss_accessors.dart';
import '../../features/scan_details/chart_timescale.dart';
import '../../features/scan_details/series_color.dart';
import '../../features/scan_settings/graph_label_for_row.dart';
import '../../features/scan_settings/signal_unit.dart';
import '../../features/scan_settings/types.dart';
import '../../shared/i18n/app_localizations.dart';
import 'chart_panel.dart';

class SelectedChannelChart extends StatelessWidget {
  const SelectedChannelChart({
    super.key,
    required this.bss,
    this.height = 160,
    this.pinnedColors,
    this.graphLabelMode = GraphLabelMode.ssid,
    this.annotation = '',
    this.unit = SignalChartUnit.pct,
  });

  final ObservedBss? bss;
  final double height;
  final Map<String, String>? pinnedColors;
  final GraphLabelMode graphLabelMode;
  final String annotation;
  final SignalChartUnit unit;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final pct = bss == null ? 0 : percentFromDbm(bss!.signal.rssiDbm);
    final strengthLabel = bss == null
        ? ''
        : formatSignalDisplay(
            bss!.signal.rssiDbm,
            chartUnitToSignalDisplay(unit),
          );
    final color = seriesColorForBss(bssidOf(bss), pinnedColors: pinnedColors);
    final label = graphLabelForBss(
      bss,
      l10n,
      mode: graphLabelMode,
      annotation: annotation,
    );

    return ChartPanel(
      semanticsLabel: l10n.scanChartSelected,
      title: l10n.scanChartSelected,
      footer: bss == null
          ? null
          : Text(
              '${l10n.detailsChannel} ${bss!.channel.number}',
              style: Theme.of(context).textTheme.labelSmall,
            ),
      child: SizedBox(
        height: height - 48,
        child: bss == null
            ? Center(child: Text(l10n.detailsEmpty, style: Theme.of(context).textTheme.bodySmall))
            : CustomPaint(
                painter: _SingleBarPainter(
                  value: pct / 100,
                  color: color,
                  label: label,
                  strengthLabel: strengthLabel,
                ),
                child: const SizedBox.expand(),
              ),
      ),
    );
  }
}

class _SingleBarPainter extends CustomPainter {
  _SingleBarPainter({
    required this.value,
    required this.color,
    required this.label,
    required this.strengthLabel,
  });

  final double value;
  final Color color;
  final String label;
  final String strengthLabel;

  @override
  void paint(Canvas canvas, Size size) {
    const left = 36.0;
    const bottom = 20.0;
    final plotW = size.width - left - 8;
    final plotH = size.height - bottom - 8;
    final barH = plotH * value.clamp(0.0, 1.0);
    final rect = RRect.fromRectAndRadius(
      Rect.fromLTWH(left, 8 + plotH - barH, plotW * 0.35, barH),
      const Radius.circular(4),
    );
    canvas.drawRRect(rect, Paint()..color = color);

    void paintText(String text, Offset offset, TextStyle style) {
      final painter = TextPainter(
        text: TextSpan(text: text, style: style),
        textDirection: TextDirection.ltr,
      )..layout(maxWidth: plotW);
      painter.paint(canvas, offset);
    }

    paintText(
      strengthLabel,
      Offset(left, 8 + plotH - barH - 14),
      TextStyle(color: color.withValues(alpha: 0.9), fontSize: 10),
    );
    final shortLabel = label.length > 18 ? '${label.substring(0, 18)}…' : label;
    paintText(
      shortLabel,
      Offset(left, 8 + plotH + 2),
      TextStyle(color: color.withValues(alpha: 0.7), fontSize: 9),
    );
  }

  @override
  bool shouldRepaint(covariant _SingleBarPainter oldDelegate) =>
      oldDelegate.value != value ||
      oldDelegate.color != color ||
      oldDelegate.label != label ||
      oldDelegate.strengthLabel != strengthLabel;
}
