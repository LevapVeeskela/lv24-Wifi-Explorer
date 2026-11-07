import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../shared/i18n/app_localizations.dart';

/// Fallback when [PackageInfo] is unavailable (mirrors `version` in pubspec).
const String kWorkbenchDefaultVersion = '1.0.0';

const String _productNameFallback = 'LV24 WiFi Explorer';

/// Reads `version` from the built app package (pubspec `version`, without build).
Future<String> resolveWorkbenchAppVersion({String? override}) async {
  if (override != null && override.trim().isNotEmpty) {
    return override.trim();
  }
  try {
    final info = await PackageInfo.fromPlatform();
    final version = info.version.trim();
    if (version.isNotEmpty) {
      return version;
    }
  } catch (_) {
    // Plugin missing, unsupported platform, or channel failure.
  }
  return kWorkbenchDefaultVersion;
}

/// Opens the workbench About dialog (Electron [AboutDialog] parity, simplified).
void showScanAboutDialog(
  BuildContext context, {
  String? version,
  String? scanCoreVersion,
}) {
  showDialog<void>(
    context: context,
    builder: (context) => ScanAboutDialog(
      versionOverride: version,
      scanCoreVersion: scanCoreVersion,
    ),
  );
}

class ScanAboutDialog extends StatelessWidget {
  const ScanAboutDialog({
    super.key,
    this.versionOverride,
    this.scanCoreVersion,
  });

  /// When set, shown instead of [PackageInfo.version].
  final String? versionOverride;
  final String? scanCoreVersion;

  String _cleanRoomNote(AppLocalizations l10n) {
    final ru = l10n.localeName.startsWith('ru');
    if (ru) {
      return 'Оригинальный продукт LV24 (clean-room). Не основан на сторонних Wi‑Fi scanner apps, vendor databases или проприетарных форматах.';
    }
    return 'Original LV24 product (clean-room). Not derived from third-party Wi‑Fi scanner apps, vendor databases, or proprietary file formats.';
  }

  String _permissionsDocHint(AppLocalizations l10n) {
    final ru = l10n.localeName.startsWith('ru');
    if (ru) {
      return 'Разрешения, подпись и demo mode: docs/PERMISSIONS.md';
    }
    return 'Location, signing, and demo mode: docs/PERMISSIONS.md';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    final productName = l10n.scanAboutTitle.trim().isEmpty
        ? _productNameFallback
        : l10n.scanAboutTitle;

    final coreVersion = scanCoreVersion;
    final scanCoreLine = coreVersion != null && coreVersion.isNotEmpty
        ? '${l10n.scanAboutScanCore} ${l10n.scanMessage('scan.status.version', {'version': coreVersion})}'
        : l10n.scanAboutScanCore;

    final closeLabel = l10n.scanMessage('scan.status.about');

    return FutureBuilder<String>(
      future: resolveWorkbenchAppVersion(override: versionOverride),
      builder: (context, snapshot) {
        final version = snapshot.data ?? kWorkbenchDefaultVersion;
        final versionLine = l10n.scanMessage(
          'scan.status.version',
          {'version': version},
        );

        return AlertDialog(
          title: Text(productName, style: theme.textTheme.titleLarge),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(versionLine, style: theme.textTheme.bodyMedium),
                const SizedBox(height: 12),
                Text(scanCoreLine, style: theme.textTheme.bodyMedium),
                const SizedBox(height: 8),
                Text(l10n.scanAboutLocation, style: theme.textTheme.bodyMedium),
                const SizedBox(height: 8),
                Text(
                  _permissionsDocHint(l10n),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 12),
                Text(_cleanRoomNote(l10n), style: theme.textTheme.bodyMedium),
                const SizedBox(height: 12),
                Text(
                  l10n.scanAboutAttribution,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(closeLabel),
            ),
          ],
        );
      },
    );
  }
}
