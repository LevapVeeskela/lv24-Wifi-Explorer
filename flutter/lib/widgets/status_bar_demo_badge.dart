import 'package:flutter/material.dart';

import '../shared/i18n/app_localizations.dart';

/// Compact demo indicator for the status bar (toolbar chip parity, smaller).
class StatusBarDemoBadge extends StatelessWidget {
  const StatusBarDemoBadge({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Chip(
      visualDensity: VisualDensity.compact,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      padding: EdgeInsets.zero,
      labelPadding: const EdgeInsets.symmetric(horizontal: 6),
      label: Text(
        l10n.scanTitleDemo,
        style: Theme.of(context).textTheme.labelSmall,
      ),
      avatar: Icon(Icons.science_outlined, size: 14, color: Theme.of(context).colorScheme.primary),
    );
  }
}
