import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';

/// Motion durations / curves (U5).
///
/// Attached to [ThemeData.extensions]. Use [duration] so reduced-motion
/// ([MediaQuery.disableAnimationsOf]) collapses to [Duration.zero].
@immutable
class LvMotion extends ThemeExtension<LvMotion> {
  const LvMotion({
    required this.fast,
    required this.base,
    required this.sheet,
    required this.page,
    required this.enter,
    required this.exit,
  });

  static const LvMotion standard = LvMotion(
    fast: Duration(milliseconds: 120),
    base: Duration(milliseconds: 200),
    sheet: Duration(milliseconds: 280),
    page: Duration(milliseconds: 320),
    enter: Curves.easeOutCubic,
    exit: Curves.easeInCubic,
  );

  /// 120ms — chips, icon swaps, selection.
  final Duration fast;

  /// 200ms — default list / peek.
  final Duration base;

  /// 280ms — sheets / modal present.
  final Duration sheet;

  /// 320ms — full-page transitions.
  final Duration page;

  final Curve enter;
  final Curve exit;

  /// Falls back to [standard] when the theme has no extension.
  static LvMotion of(BuildContext context) {
    return Theme.of(context).extension<LvMotion>() ?? LvMotion.standard;
  }

  /// [token] duration, or [Duration.zero] when animations are disabled.
  static Duration duration(BuildContext context, Duration token) {
    if (MediaQuery.disableAnimationsOf(context)) {
      return Duration.zero;
    }
    return token;
  }

  @override
  LvMotion copyWith({
    Duration? fast,
    Duration? base,
    Duration? sheet,
    Duration? page,
    Curve? enter,
    Curve? exit,
  }) {
    return LvMotion(
      fast: fast ?? this.fast,
      base: base ?? this.base,
      sheet: sheet ?? this.sheet,
      page: page ?? this.page,
      enter: enter ?? this.enter,
      exit: exit ?? this.exit,
    );
  }

  @override
  LvMotion lerp(ThemeExtension<LvMotion>? other, double t) {
    if (other is! LvMotion) return this;
    return LvMotion(
      fast: _lerpDuration(fast, other.fast, t),
      base: _lerpDuration(base, other.base, t),
      sheet: _lerpDuration(sheet, other.sheet, t),
      page: _lerpDuration(page, other.page, t),
      enter: t < 0.5 ? enter : other.enter,
      exit: t < 0.5 ? exit : other.exit,
    );
  }
}

extension LvMotionContext on BuildContext {
  LvMotion get lvMotion => LvMotion.of(this);
}

Duration _lerpDuration(Duration a, Duration b, double t) {
  final microseconds = lerpDouble(
    a.inMicroseconds.toDouble(),
    b.inMicroseconds.toDouble(),
    t,
  );
  return Duration(
    microseconds: (microseconds ?? a.inMicroseconds.toDouble()).round(),
  );
}
