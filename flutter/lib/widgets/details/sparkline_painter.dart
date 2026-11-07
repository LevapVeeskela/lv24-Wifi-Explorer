import 'package:flutter/material.dart';

class SparklinePainter extends CustomPainter {
  SparklinePainter({
    required this.points,
    required this.color,
    required this.yMin,
    required this.yMax,
    this.strokeWidth = 2,
  });

  final List<Offset> points;
  final Color color;
  final double yMin;
  final double yMax;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    if (points.length < 2) {
      if (points.length == 1) {
        final p = Offset(
          size.width * points.first.dx,
          size.height * (1 - _normY(points.first.dy)),
        );
        canvas.drawCircle(p, 3, Paint()..color = color);
      }
      return;
    }

    final path = Path();
    for (var i = 0; i < points.length; i++) {
      final x = points[i].dx.clamp(0.0, 1.0) * size.width;
      final y = size.height * (1 - _normY(points[i].dy));
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(path, paint);

    final fillPath = Path.from(path)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(
      fillPath,
      Paint()
        ..color = color.withValues(alpha: 0.12)
        ..style = PaintingStyle.fill,
    );
  }

  double _normY(double y) {
    if (yMax <= yMin) return 0.5;
    return ((y - yMin) / (yMax - yMin)).clamp(0.0, 1.0);
  }

  @override
  bool shouldRepaint(covariant SparklinePainter oldDelegate) {
    return oldDelegate.points != points ||
        oldDelegate.color != color ||
        oldDelegate.yMin != yMin ||
        oldDelegate.yMax != yMax;
  }
}
