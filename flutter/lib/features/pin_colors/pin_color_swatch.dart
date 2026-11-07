import 'package:flutter/material.dart';

/// 8×8 series / pin color marker (Electron `seriesSwatchSx`).
class PinColorSwatch extends StatelessWidget {
  const PinColorSwatch({
    super.key,
    required this.color,
    this.size = 8,
  });

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: ColoredBox(color: color),
    );
  }
}
