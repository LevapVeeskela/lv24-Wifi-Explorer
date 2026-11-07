import 'package:flutter/material.dart';

import '../../shared/i18n/app_localizations.dart';
import '../../shared/oui/scan_oui_registry.dart';

class ScanSettingsVendorPanel extends StatelessWidget {
  const ScanSettingsVendorPanel({super.key});

  String _formatGeneratedAt(String iso) {
    if (iso.isEmpty) return '—';
    final parsed = DateTime.tryParse(iso);
    if (parsed == null) return iso;
    return parsed.toLocal().toString();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final muted = theme.textTheme.bodyMedium?.copyWith(
      color: theme.colorScheme.onSurfaceVariant,
    );
    final meta = scanOuiRegistry()?.meta;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(l10n.scanSettingsVendorBundled),
        if (meta != null) ...[
          const SizedBox(height: 8),
          Text(l10n.scanSettingsVendorEntries(meta.entryCount)),
          const SizedBox(height: 4),
          Text(
            l10n.scanSettingsVendorUpdated(_formatGeneratedAt(meta.generatedAt)),
            style: muted,
          ),
          if (meta.sourceUrl != null && meta.sourceUrl!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(meta.sourceUrl!, style: theme.textTheme.bodySmall),
          ],
          if (meta.note != null && meta.note!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(meta.note!, style: theme.textTheme.bodySmall),
          ],
        ],
        const SizedBox(height: 12),
        Text(l10n.scanSettingsVendorRefreshHint, style: muted),
      ],
    );
  }
}
