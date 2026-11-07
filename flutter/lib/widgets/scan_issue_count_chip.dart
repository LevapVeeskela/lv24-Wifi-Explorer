import 'package:flutter/material.dart';

import '../shared/i18n/app_localizations.dart';

/// Count chip for the grid issues column (Electron `issueCountChip` parity).
class ScanIssueCountChip extends StatelessWidget {
  const ScanIssueCountChip({
    super.key,
    required this.issueKeys,
  });

  final List<String> issueKeys;

  @override
  Widget build(BuildContext context) {
    if (issueKeys.isEmpty) {
      return Text(
        '—',
        style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
      );
    }

    final l10n = AppLocalizations.of(context);
    final labels = issueKeys.map(l10n.scanMessage).toList();
    final tooltip = labels.join('\n');

    return Tooltip(
      message: tooltip,
      child: Align(
        alignment: Alignment.centerLeft,
        child: Semantics(
          label: l10n.scanColIssues,
          child: Chip(
            label: Text('${issueKeys.length}'),
            labelStyle: Theme.of(context).textTheme.labelSmall,
            visualDensity: VisualDensity.compact,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            side: BorderSide(color: Theme.of(context).colorScheme.tertiary),
            backgroundColor: Theme.of(context).colorScheme.surface,
            labelPadding: const EdgeInsets.symmetric(horizontal: 4),
            padding: EdgeInsets.zero,
          ),
        ),
      ),
    );
  }
}
