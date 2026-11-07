import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

class OccupancyBarPainter extends CustomPainter {
  OccupancyBarPainter({
    required this.bars,
    required this.barColor,
    required this.selectedColor,
    required this.mutedColor,
    required this.tickEvery,
  });

  final List<OccupancyBar> bars;
  final Color barColor;
  final Color selectedColor;
  final Color mutedColor;
  final int tickEvery;

  @override
  void paint(Canvas canvas, Size size) {
    if (bars.isEmpty) return;

    const leftPad = 28.0;
    const bottomPad = 18.0;
    const topPad = 4.0;
    final plotW = size.width - leftPad;
    final plotH = size.height - bottomPad - topPad;
    if (plotW <= 0 || plotH <= 0) return;

    final barW = plotW / bars.length;
    final axisPaint = Paint()
      ..color = mutedColor
      ..strokeWidth = 1;

    canvas.drawLine(
      Offset(leftPad, topPad + plotH),
      Offset(size.width, topPad + plotH),
      axisPaint,
    );

    final textStyle = TextStyle(color: mutedColor, fontSize: 9);
    for (var i = 0; i <= 4; i++) {
      final yVal = 100 - i * 25;
      final y = topPad + plotH * (i / 4);
      canvas.drawLine(Offset(leftPad - 4, y), Offset(leftPad, y), axisPaint);
      _paintText(canvas, '$yVal', Offset(2, y - 6), textStyle);
    }

    for (var i = 0; i < bars.length; i++) {
      final bar = bars[i];
      final x = leftPad + i * barW;
      final h = plotH * (bar.score / 100).clamp(0.0, 1.0);
      final rect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x + 0.5, topPad + plotH - h, barW - 1, h),
        const Radius.circular(1),
      );
      final paint = Paint()
        ..color = bar.selected ? selectedColor : barColor.withValues(alpha: 0.85);
      canvas.drawRRect(rect, paint);
      if (bar.selected) {
        canvas.drawRRect(
          rect,
          Paint()
            ..color = selectedColor
            ..style = PaintingStyle.stroke
            ..strokeWidth = 1.5,
        );
      }
      if (i % tickEvery == 0) {
        _paintText(
          canvas,
          '${bar.channel}',
          Offset(x, topPad + plotH + 2),
          textStyle,
        );
      }
    }
  }

  void _paintText(Canvas canvas, String text, Offset offset, TextStyle style) {
    final painter = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: TextDirection.ltr,
    )..layout();
    painter.paint(canvas, offset);
  }

  @override
  bool shouldRepaint(covariant OccupancyBarPainter oldDelegate) {
    return oldDelegate.bars != bars ||
        oldDelegate.barColor != barColor ||
        oldDelegate.selectedColor != selectedColor;
  }
}
