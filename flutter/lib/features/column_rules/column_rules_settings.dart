import 'package:flutter/material.dart';

import '../../shared/i18n/app_localizations.dart';
import 'column_rules_config.dart';
import 'column_rules_controller.dart';
import 'column_rules_scope.dart';

/// Electron [ColumnRulesHighlight] toggle helper (`withHighlightToggled`).
List<ColumnRulesHighlight> withHighlightToggled(
  List<ColumnRulesHighlight> highlights,
  ColumnRulesHighlight key,
  bool on,
) {
  final next = <ColumnRulesHighlight>{...highlights};
  if (on) {
    next.add(key);
  } else {
    next.remove(key);
  }
  return next.toList();
}

/// Scan-settings / columns-panel switches for [ColumnRulesController.setConfig].
class ColumnRulesSettingsSection extends StatelessWidget {
  const ColumnRulesSettingsSection({super.key, this.controller});

  final ColumnRulesController? controller;

  @override
  Widget build(BuildContext context) {
    final resolved = controller ?? ColumnRulesScope.maybeOf(context);
    if (resolved == null) return const SizedBox.shrink();
    final l10n = AppLocalizations.of(context);

    return ListenableBuilder(
      listenable: resolved,
      builder: (context, _) {
        final config = resolved.config;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.scanSettingsColumnsCellRules,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: Text(l10n.scanSettingsColumnsCellRulesEnabled),
              value: config.enabled,
              onChanged: (checked) {
                resolved.setConfig(config.copyWith(enabled: checked));
              },
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: Text(l10n.scanSettingsColumnsCellRulesRssi),
              value: config.highlights.contains(ColumnRulesHighlight.rssi),
              onChanged: config.enabled
                  ? (checked) {
                      resolved.setConfig(
                        config.copyWith(
                          highlights: withHighlightToggled(
                            config.highlights,
                            ColumnRulesHighlight.rssi,
                            checked,
                          ),
                        ),
                      );
                    }
                  : null,
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: Text(l10n.scanSettingsColumnsCellRulesSecurity),
              value: config.highlights.contains(ColumnRulesHighlight.security),
              onChanged: config.enabled
                  ? (checked) {
                      resolved.setConfig(
                        config.copyWith(
                          highlights: withHighlightToggled(
                            config.highlights,
                            ColumnRulesHighlight.security,
                            checked,
                          ),
                        ),
                      );
                    }
                  : null,
            ),
          ],
        );
      },
    );
  }
}
