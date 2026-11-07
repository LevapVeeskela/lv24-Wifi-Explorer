import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_colors.dart';
import 'lv_motion.dart';
import 'lv_tokens.dart';

/// Material 3 light + dark themes for LV24 «Sunset» Flutter clients.
///
/// Color identity matches web «Sunset» (`frontend/src/shared/lib/theme.ts`).
/// Body/title = bundled Manrope; display/headline = bundled Plus Jakarta Sans.
/// Fonts are local assets (`fonts/`) — no `google_fonts` / runtime network.
abstract final class AppTheme {
  static const double borderRadius = 10;

  static const String fontFamilyBody = 'Manrope';
  static const String fontFamilyDisplay = 'PlusJakartaSans';

  /// Slightly tight tracking on display + headline roles.
  static const double headlineLetterSpacing = -0.2;

  static ThemeData get light => _build(
        brightness: Brightness.light,
        scheme: const ColorScheme(
          brightness: Brightness.light,
          primary: AppColors.coral,
          onPrimary: Color(0xFFFFFFFF),
          primaryContainer: Color(0xFFFFDBD0),
          onPrimaryContainer: AppColors.coralDark,
          secondary: AppColors.violet,
          onSecondary: Color(0xFFFFFFFF),
          secondaryContainer: Color(0xFFEDE4FF),
          onSecondaryContainer: AppColors.violetDark,
          tertiary: AppColors.info,
          onTertiary: Color(0xFFFFFFFF),
          tertiaryContainer: Color(0xFFCFF4FC),
          onTertiaryContainer: Color(0xFF155E75),
          error: AppColors.error,
          onError: Color(0xFFFFFFFF),
          errorContainer: Color(0xFFFFDAD9),
          onErrorContainer: Color(0xFFBE123C),
          surface: AppColors.paperLight,
          onSurface: AppColors.textPrimaryLight,
          surfaceContainerHighest: Color(0xFFF3EEE7),
          onSurfaceVariant: AppColors.textSecondaryLight,
          outline: AppColors.dividerLight,
          outlineVariant: Color(0xFFE7E0D7),
          shadow: Color(0xFF1C1917),
          scrim: Color(0xFF000000),
          inverseSurface: AppColors.paperDark,
          onInverseSurface: AppColors.textPrimaryDark,
          inversePrimary: AppColors.coralDarkMode,
        ),
        scaffoldBackground: AppColors.bgLight,
        divider: AppColors.dividerLight,
        statusBarIconBrightness: Brightness.dark,
      );

  static ThemeData get dark => _build(
        brightness: Brightness.dark,
        scheme: const ColorScheme(
          brightness: Brightness.dark,
          primary: AppColors.coralDarkMode,
          onPrimary: Color(0xFF231A15),
          primaryContainer: AppColors.coralDarkModeDark,
          onPrimaryContainer: Color(0xFFFFDBD0),
          secondary: AppColors.violetLight,
          onSecondary: Color(0xFF1B1030),
          secondaryContainer: AppColors.violet,
          onSecondaryContainer: Color(0xFFEDE4FF),
          tertiary: AppColors.infoDark,
          onTertiary: Color(0xFF04121B),
          tertiaryContainer: Color(0xFF0EA5E9),
          onTertiaryContainer: Color(0xFFCFF4FC),
          error: AppColors.errorDark,
          onError: Color(0xFF2A0910),
          errorContainer: AppColors.error,
          onErrorContainer: Color(0xFFFFDAD9),
          surface: AppColors.paperDark,
          onSurface: AppColors.textPrimaryDark,
          surfaceContainerHighest: Color(0xFF2C2620),
          onSurfaceVariant: AppColors.textSecondaryDark,
          outline: AppColors.dividerDark,
          outlineVariant: Color(0xFF3F3630),
          shadow: Color(0xFF000000),
          scrim: Color(0xFF000000),
          inverseSurface: AppColors.paperLight,
          onInverseSurface: AppColors.textPrimaryLight,
          inversePrimary: AppColors.coral,
        ),
        scaffoldBackground: AppColors.bgDark,
        divider: AppColors.dividerDark,
        statusBarIconBrightness: Brightness.light,
      );

  static ThemeData _build({
    required Brightness brightness,
    required ColorScheme scheme,
    required Color scaffoldBackground,
    required Color divider,
    required Brightness statusBarIconBrightness,
  }) {
    final tokens =
        brightness == Brightness.light ? LvTokens.light : LvTokens.dark;
    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      fontFamily: fontFamilyBody,
      scaffoldBackgroundColor: scaffoldBackground,
      visualDensity: VisualDensity.standard,
      extensions: <ThemeExtension<dynamic>>[tokens, LvMotion.standard],
    );
    final textTheme = _applyTypeRoles(base.textTheme);

    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(borderRadius),
    );

    return base.copyWith(
      textTheme: textTheme,
      primaryTextTheme: _applyTypeRoles(base.primaryTextTheme),
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 1,
        backgroundColor: scaffoldBackground,
        foregroundColor: scheme.onSurface,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: statusBarIconBrightness,
          statusBarBrightness: brightness == Brightness.light
              ? Brightness.light
              : Brightness.dark,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: tokens.cardShape(outline: scheme.outline),
        color: scheme.surface,
        margin: EdgeInsets.zero,
      ),
      chipTheme: base.chipTheme.copyWith(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: divider,
        thickness: 1,
        space: 1,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: brightness == Brightness.light
            ? const Color(0xFFF3EEE7)
            : const Color(0xFF2C2620),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadius),
          borderSide: BorderSide(color: divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadius),
          borderSide: BorderSide(color: divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadius),
          borderSide: BorderSide(color: scheme.primary, width: 2),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          shape: shape,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          shape: shape,
          minimumSize: const Size(48, 48),
          side: BorderSide(color: divider),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          shape: shape,
          minimumSize: const Size(48, 40),
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: scheme.primary,
        foregroundColor: scheme.onPrimary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 64,
        elevation: 0,
        backgroundColor: scheme.surface,
        indicatorColor: scheme.primary.withValues(alpha: 0.14),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            size: 24,
            color: selected ? scheme.primary : scheme.onSurfaceVariant,
          );
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return TextStyle(
            fontFamily: fontFamilyBody,
            fontSize: 12,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
            color: selected ? scheme.primary : scheme.onSurfaceVariant,
          );
        }),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: scheme.surface,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        showDragHandle: true,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
      dialogTheme: DialogThemeData(
        shape: shape,
        backgroundColor: scheme.surface,
      ),
      listTileTheme: ListTileThemeData(
        shape: shape,
        iconColor: scheme.onSurfaceVariant,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: scheme.primary,
      ),
    );
  }

  static TextTheme _applyTypeRoles(TextTheme base) {
    TextStyle display(TextStyle? style) {
      return (style ?? const TextStyle()).copyWith(
        fontFamily: fontFamilyDisplay,
        letterSpacing: headlineLetterSpacing,
      );
    }

    TextStyle body(TextStyle? style) {
      return (style ?? const TextStyle()).copyWith(
        fontFamily: fontFamilyBody,
      );
    }

    return base.copyWith(
      displayLarge: display(base.displayLarge),
      displayMedium: display(base.displayMedium),
      displaySmall: display(base.displaySmall),
      headlineLarge: display(base.headlineLarge),
      headlineMedium: display(base.headlineMedium),
      headlineSmall: display(base.headlineSmall),
      titleLarge: body(base.titleLarge),
      titleMedium: body(base.titleMedium),
      titleSmall: body(base.titleSmall),
      bodyLarge: body(base.bodyLarge),
      bodyMedium: body(base.bodyMedium),
      bodySmall: body(base.bodySmall),
      labelLarge: body(base.labelLarge),
      labelMedium: body(base.labelMedium),
      labelSmall: body(base.labelSmall),
    );
  }
}
