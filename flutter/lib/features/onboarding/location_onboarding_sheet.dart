import 'package:flutter/material.dart';
import 'package:lv24_sunset_theme/lv24_sunset_theme.dart';
import 'package:scan_domain/scan_domain.dart';

import '../../shared/i18n/app_localizations.dart';
import 'location_platform_copy.dart';

/// Electron `LocationOnboardingSheet` — first-run / denied Location dialog.
class LocationOnboardingSheet extends StatelessWidget {
  const LocationOnboardingSheet({
    super.key,
    required this.location,
    required this.onClose,
    required this.onContinue,
    this.onRetry,
    this.onOpenLocationSettings,
    this.canOpenSettings = false,
    this.platform,
  });

  final LocationAuthorization location;
  final VoidCallback onClose;
  final VoidCallback onContinue;
  final VoidCallback? onRetry;
  final VoidCallback? onOpenLocationSettings;
  final bool canOpenSettings;
  final TargetPlatform? platform;

  bool get _denied => location == LocationAuthorization.denied;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final tokens = LvTokens.of(context);
    final copy = LocationPlatformCopy.of(l10n, platform: platform);
    final scheme = Theme.of(context).colorScheme;
    final showSettings = canOpenSettings && onOpenLocationSettings != null;

    return AlertDialog(
      key: const ValueKey('location-onboarding-sheet'),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(tokens.radius20),
        side: BorderSide(color: scheme.outline.withValues(alpha: 0.35)),
      ),
      title: Text(copy.sheetTitle(location)),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(copy.body, style: Theme.of(context).textTheme.bodyMedium),
            SizedBox(height: tokens.space12),
            Text(
              copy.settingsHint,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            SizedBox(height: tokens.space12),
            Text(
              _denied
                  ? l10n.permissionsDeniedBody
                  : l10n.permissionsOnboardingBody,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          key: const ValueKey('location-onboarding-later'),
          onPressed: onClose,
          child: Text(l10n.onboardingLocationLater),
        ),
        if (showSettings)
          OutlinedButton(
            key: const ValueKey('location-onboarding-settings'),
            onPressed: onOpenLocationSettings,
            child: Text(l10n.permissionsOpenSettings),
          ),
        if (_denied)
          FilledButton(
            key: const ValueKey('location-onboarding-retry'),
            onPressed: onRetry ?? onContinue,
            child: Text(l10n.onboardingLocationRetry),
          )
        else
          FilledButton(
            key: const ValueKey('location-onboarding-continue'),
            onPressed: onContinue,
            child: Text(l10n.onboardingLocationContinue),
          ),
      ],
    );
  }
}
