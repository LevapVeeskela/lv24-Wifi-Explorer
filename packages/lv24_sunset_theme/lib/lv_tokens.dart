import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';

import 'app_colors.dart';

/// City Canvas radii / space / semantic colors (U5, no vendor fonts).
///
/// Attached to [ThemeData.extensions] for light and dark. Radii and space are
/// shared; semantic colors follow [AppColors] light/dark pairs.
@immutable
class LvTokens extends ThemeExtension<LvTokens> {
  const LvTokens({
    required this.radius8,
    required this.radius10,
    required this.radius14,
    required this.radius20,
    required this.radius999,
    required this.space4,
    required this.space8,
    required this.space12,
    required this.space16,
    required this.space24,
    required this.space32,
    required this.success,
    required this.warning,
    required this.info,
    required this.online,
  });

  static const LvTokens light = LvTokens(
    radius8: 8,
    radius10: 10,
    radius14: 14,
    radius20: 20,
    radius999: 999,
    space4: 4,
    space8: 8,
    space12: 12,
    space16: 16,
    space24: 24,
    space32: 32,
    success: AppColors.success,
    warning: AppColors.warning,
    info: AppColors.info,
    online: AppColors.servicesTeal,
  );

  static const LvTokens dark = LvTokens(
    radius8: 8,
    radius10: 10,
    radius14: 14,
    radius20: 20,
    radius999: 999,
    space4: 4,
    space8: 8,
    space12: 12,
    space16: 16,
    space24: 24,
    space32: 32,
    success: AppColors.successDark,
    warning: AppColors.warningDark,
    info: AppColors.infoDark,
    online: AppColors.servicesTealDark,
  );

  final double radius8;
  final double radius10;
  final double radius14;
  final double radius20;
  final double radius999;

  final double space4;
  final double space8;
  final double space12;
  final double space16;
  final double space24;
  final double space32;

  final Color success;
  final Color warning;
  final Color info;

  /// Services / live-presence teal (not raw [Colors.green]).
  final Color online;

  /// Falls back to [light] when the theme has no extension (bare [MaterialApp]).
  static LvTokens of(BuildContext context) {
    return Theme.of(context).extension<LvTokens>() ?? LvTokens.light;
  }

  RoundedRectangleBorder cardShape({required Color outline}) {
    return RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(radius14),
      side: BorderSide(color: outline, width: 1),
    );
  }

  @override
  LvTokens copyWith({
    double? radius8,
    double? radius10,
    double? radius14,
    double? radius20,
    double? radius999,
    double? space4,
    double? space8,
    double? space12,
    double? space16,
    double? space24,
    double? space32,
    Color? success,
    Color? warning,
    Color? info,
    Color? online,
  }) {
    return LvTokens(
      radius8: radius8 ?? this.radius8,
      radius10: radius10 ?? this.radius10,
      radius14: radius14 ?? this.radius14,
      radius20: radius20 ?? this.radius20,
      radius999: radius999 ?? this.radius999,
      space4: space4 ?? this.space4,
      space8: space8 ?? this.space8,
      space12: space12 ?? this.space12,
      space16: space16 ?? this.space16,
      space24: space24 ?? this.space24,
      space32: space32 ?? this.space32,
      success: success ?? this.success,
      warning: warning ?? this.warning,
      info: info ?? this.info,
      online: online ?? this.online,
    );
  }

  @override
  LvTokens lerp(ThemeExtension<LvTokens>? other, double t) {
    if (other is! LvTokens) return this;
    return LvTokens(
      radius8: lerpDouble(radius8, other.radius8, t) ?? radius8,
      radius10: lerpDouble(radius10, other.radius10, t) ?? radius10,
      radius14: lerpDouble(radius14, other.radius14, t) ?? radius14,
      radius20: lerpDouble(radius20, other.radius20, t) ?? radius20,
      radius999: lerpDouble(radius999, other.radius999, t) ?? radius999,
      space4: lerpDouble(space4, other.space4, t) ?? space4,
      space8: lerpDouble(space8, other.space8, t) ?? space8,
      space12: lerpDouble(space12, other.space12, t) ?? space12,
      space16: lerpDouble(space16, other.space16, t) ?? space16,
      space24: lerpDouble(space24, other.space24, t) ?? space24,
      space32: lerpDouble(space32, other.space32, t) ?? space32,
      success: Color.lerp(success, other.success, t) ?? success,
      warning: Color.lerp(warning, other.warning, t) ?? warning,
      info: Color.lerp(info, other.info, t) ?? info,
      online: Color.lerp(online, other.online, t) ?? online,
    );
  }
}

extension LvTokensContext on BuildContext {
  LvTokens get lvTokens => LvTokens.of(this);
}
