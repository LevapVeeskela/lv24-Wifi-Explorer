import 'package:flutter/material.dart';

/// LV24 «Sunset» color tokens — ported from web `frontend/src/shared/lib/theme.ts`.
///
/// Warm coral + violet identity with stone neutrals. Use these tokens (or
/// [ColorScheme] from [AppTheme]) instead of raw hex in features.
abstract final class AppColors {
  // ── Brand ─────────────────────────────────────────────────────────────
  static const Color coral = Color(0xFFCE4420);
  static const Color coralLight = Color(0xFFF15A36);
  static const Color coralDark = Color(0xFFB8420F);

  static const Color coralDarkMode = Color(0xFFFB6E4A);
  static const Color coralDarkModeLight = Color(0xFFFCA98B);
  static const Color coralDarkModeDark = Color(0xFFE9542E);

  static const Color violet = Color(0xFF7C3AED);
  static const Color violetLight = Color(0xFFA78BFA);
  static const Color violetDark = Color(0xFF5B21B6);

  // ── Semantic ──────────────────────────────────────────────────────────
  static const Color success = Color(0xFF15803D);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFE11D48);
  static const Color info = Color(0xFF0E7490);

  static const Color successDark = Color(0xFF34D399);
  static const Color warningDark = Color(0xFFFBBF24);
  static const Color errorDark = Color(0xFFFB7185);
  static const Color infoDark = Color(0xFF38BDF8);

  /// Services Live / map services layer (web `#0D9488`).
  static const Color servicesTeal = Color(0xFF0D9488);
  static const Color servicesTealDark = Color(0xFF2DD4BF);

  // ── Surfaces — light ──────────────────────────────────────────────────
  static const Color bgLight = Color(0xFFFCFAF7);
  static const Color paperLight = Color(0xFFFFFFFF);
  static const Color textPrimaryLight = Color(0xFF1C1917);
  static const Color textSecondaryLight = Color(0xFF57534E);
  static const Color textDisabledLight = Color(0xFFA8A29E);
  static const Color dividerLight = Color(0xFFEEE9E2);

  // ── Surfaces — dark ───────────────────────────────────────────────────
  static const Color bgDark = Color(0xFF17130F);
  static const Color paperDark = Color(0xFF221D18);
  static const Color textPrimaryDark = Color(0xFFF6F0E9);
  static const Color textSecondaryDark = Color(0xFFD6CBC0);
  static const Color textDisabledDark = Color(0xFF9A9086);
  static const Color dividerDark = Color(0xFF352D25);

  /// Seed for Material 3 [ColorScheme.fromSeed] fallback (brand coral).
  static const Color seed = coral;
}
