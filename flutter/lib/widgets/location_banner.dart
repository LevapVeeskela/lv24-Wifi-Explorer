import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lv24_sunset_theme/lv24_sunset_theme.dart';
import 'package:scan_domain/scan_domain.dart';

import '../features/location_settings/location_settings.dart';
import '../features/onboarding/location_platform_copy.dart';
import '../features/scan_degradation/scan_degradation.dart';
import '../shared/i18n/app_localizations.dart';

/// Location + scan-honesty banners (Electron `LocationBanner` + Flutter v1).
///
/// Location denied/restricted stay visible even in demo. [demoMode] no longer
/// hides permission UX — it only implies [ScanDegradation.demoFallback] when
/// [degradation] is [ScanDegradation.none].
class LocationBanner extends StatelessWidget {
  const LocationBanner({
    super.key,
    required this.location,
    this.demoMode = false,
    this.degradation = ScanDegradation.none,
    this.onOpenLocationSettings,
    this.onRetry,
    this.platform,
  });

  final LocationAuthorization location;
  final bool demoMode;
  final ScanDegradation degradation;
  final VoidCallback? onOpenLocationSettings;
  final VoidCallback? onRetry;
  final TargetPlatform? platform;

  ScanDegradation get _effectiveDegradation {
    if (degradation != ScanDegradation.none) return degradation;
    return demoMode ? ScanDegradation.demoFallback : ScanDegradation.none;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final copy = LocationPlatformCopy.of(l10n, platform: platform);
    final openSettings =
        onOpenLocationSettings ??
        (canOpenLocationSettings
            ? () => unawaited(openLocationSettings())
            : null);

    final strips = <Widget>[
      if (location == LocationAuthorization.denied)
        _HonestyBanner(
          key: const ValueKey('location-banner-denied'),
          severity: _BannerSeverity.warning,
          title: l10n.permissionsDeniedTitle,
          body: copy.body,
          hint: '${l10n.permissionsDeniedBody} ${copy.settingsHint}',
          action: openSettings == null
              ? null
              : TextButton(
                  onPressed: openSettings,
                  child: Text(l10n.permissionsOpenSettings),
                ),
          secondary: onRetry == null
              ? null
              : TextButton(
                  onPressed: onRetry,
                  child: Text(l10n.onboardingLocationRetry),
                ),
        )
      else if (location == LocationAuthorization.restricted)
        _HonestyBanner(
          key: const ValueKey('location-banner-restricted'),
          severity: _BannerSeverity.error,
          title: l10n.permissionsRestrictedTitle,
          body: l10n.permissionsRestrictedBody,
        ),
    ];

    final degraded = _effectiveDegradation;
    if (degraded != ScanDegradation.none) {
      final degradedCopy = scanDegradationCopy(l10n, degraded);
      strips.add(
        _HonestyBanner(
          key: ValueKey('scan-degradation-banner-${degraded.name}'),
          severity: degraded == ScanDegradation.androidThrottled
              ? _BannerSeverity.warning
              : _BannerSeverity.info,
          title: degradedCopy.title,
          body: degradedCopy.body,
        ),
      );
    }

    if (strips.isEmpty) return const SizedBox.shrink();
    return Column(
      key: const ValueKey('location-honesty-banners'),
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: strips,
    );
  }
}

enum _BannerSeverity { info, warning, error }

class _HonestyBanner extends StatelessWidget {
  const _HonestyBanner({
    super.key,
    required this.severity,
    required this.title,
    required this.body,
    this.hint,
    this.action,
    this.secondary,
  });

  final _BannerSeverity severity;
  final String title;
  final String body;
  final String? hint;
  final Widget? action;
  final Widget? secondary;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final tokens = LvTokens.of(context);
    final (background, foreground, border) = switch (severity) {
      _BannerSeverity.info => (
        scheme.primaryContainer,
        scheme.onPrimaryContainer,
        scheme.outline.withValues(alpha: 0.45),
      ),
      _BannerSeverity.warning => (
        Color.alphaBlend(
          AppColors.warning.withValues(alpha: 0.18),
          scheme.surface,
        ),
        scheme.onSurface,
        tokens.warning.withValues(alpha: 0.45),
      ),
      _BannerSeverity.error => (
        scheme.errorContainer,
        scheme.onErrorContainer,
        scheme.error.withValues(alpha: 0.4),
      ),
    };

    return Material(
      color: background,
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: border)),
        ),
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: tokens.space16,
            vertical: tokens.space12,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(switch (severity) {
                _BannerSeverity.info => Icons.info_outline,
                _BannerSeverity.warning => Icons.location_off_outlined,
                _BannerSeverity.error => Icons.block,
              }, color: foreground),
              SizedBox(width: tokens.space12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: foreground,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(height: tokens.space4),
                    Text(body, style: TextStyle(color: foreground)),
                    if (hint != null && hint!.isNotEmpty) ...[
                      SizedBox(height: tokens.space8),
                      Text(
                        hint!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: foreground.withValues(alpha: 0.9),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (secondary != null) ...[
                SizedBox(width: tokens.space8),
                secondary!,
              ],
              if (action != null) ...[SizedBox(width: tokens.space8), action!],
            ],
          ),
        ),
      ),
    );
  }
}
