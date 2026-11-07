import 'package:flutter/foundation.dart';
import 'package:scan_domain/scan_domain.dart';

import '../../shared/i18n/app_localizations.dart';

/// Host used to pick honest Location / scan-limit copy.
enum LocationPlatformKind { macos, ios, android, linux, windows, other }

LocationPlatformKind locationPlatformKindFor(TargetPlatform platform) {
  return switch (platform) {
    TargetPlatform.iOS => LocationPlatformKind.ios,
    TargetPlatform.android => LocationPlatformKind.android,
    TargetPlatform.macOS => LocationPlatformKind.macos,
    TargetPlatform.linux => LocationPlatformKind.linux,
    TargetPlatform.windows => LocationPlatformKind.windows,
    _ => LocationPlatformKind.other,
  };
}

bool locationNeedsOnboardingSheet(LocationAuthorization location) {
  return location == LocationAuthorization.notDetermined ||
      location == LocationAuthorization.denied;
}

class LocationPlatformCopy {
  const LocationPlatformCopy(this.l10n, this.kind);

  final AppLocalizations l10n;
  final LocationPlatformKind kind;

  factory LocationPlatformCopy.of(
    AppLocalizations l10n, {
    TargetPlatform? platform,
  }) {
    return LocationPlatformCopy(
      l10n,
      locationPlatformKindFor(platform ?? defaultTargetPlatform),
    );
  }

  String get title => switch (kind) {
    LocationPlatformKind.macos => l10n.permissionsPlatformMacosTitle,
    LocationPlatformKind.ios => l10n.permissionsPlatformIosTitle,
    LocationPlatformKind.android => l10n.permissionsPlatformAndroidTitle,
    LocationPlatformKind.linux => l10n.permissionsPlatformLinuxTitle,
    LocationPlatformKind.windows => l10n.permissionsPlatformWindowsTitle,
    LocationPlatformKind.other => l10n.permissionsPlatformOtherTitle,
  };

  String get body => switch (kind) {
    LocationPlatformKind.macos => l10n.permissionsPlatformMacosBody,
    LocationPlatformKind.ios => l10n.permissionsPlatformIosBody,
    LocationPlatformKind.android => l10n.permissionsPlatformAndroidBody,
    LocationPlatformKind.linux => l10n.permissionsPlatformLinuxBody,
    LocationPlatformKind.windows => l10n.permissionsPlatformWindowsBody,
    LocationPlatformKind.other => l10n.permissionsPlatformOtherBody,
  };

  String get settingsHint => switch (kind) {
    LocationPlatformKind.macos => l10n.permissionsPlatformMacosSettingsHint,
    LocationPlatformKind.ios => l10n.permissionsPlatformIosSettingsHint,
    LocationPlatformKind.android => l10n.permissionsPlatformAndroidSettingsHint,
    LocationPlatformKind.linux => l10n.permissionsPlatformLinuxSettingsHint,
    LocationPlatformKind.windows => l10n.permissionsPlatformWindowsSettingsHint,
    LocationPlatformKind.other => l10n.permissionsPlatformOtherSettingsHint,
  };

  String sheetTitle(LocationAuthorization location) {
    if (location == LocationAuthorization.denied) {
      return l10n.permissionsDeniedTitle;
    }
    return title;
  }
}
