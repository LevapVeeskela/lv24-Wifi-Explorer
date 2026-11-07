import 'package:flutter/material.dart';

import '../shared/i18n/app_localizations.dart';

/// Labeled issue chips for the details pane (Electron advanced issues row).
class ScanIssueChips extends StatelessWidget {
  const ScanIssueChips({
    super.key,
    required this.issueKeys,
  });

  final List<String> issueKeys;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    if (issueKeys.isEmpty) {
      return Text(
        '—',
        style: theme.textTheme.bodyMedium?.copyWith(
          color: theme.colorScheme.onSurfaceVariant,
        ),
      );
    }

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        for (final key in issueKeys)
          Chip(
            label: Text(l10n.scanMessage(key)),
            visualDensity: VisualDensity.compact,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
      ],
    );
  }
}
