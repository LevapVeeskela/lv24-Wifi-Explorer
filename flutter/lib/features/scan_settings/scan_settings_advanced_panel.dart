import 'package:flutter/material.dart';

import '../../shared/i18n/app_localizations.dart';
import 'types.dart';

class ScanSettingsAdvancedPanel extends StatelessWidget {
  const ScanSettingsAdvancedPanel({
    super.key,
    required this.settings,
    required this.onChanged,
  });

  final ScanWorkbenchSettings settings;
  final ValueChanged<ScanWorkbenchSettings> onChanged;

  String _graphLabel(AppLocalizations l10n, GraphLabelMode mode) {
    return switch (mode) {
      GraphLabelMode.ssid => l10n.scanSettingsAdvancedGraphLabelsSsid,
      GraphLabelMode.apName => l10n.scanSettingsAdvancedGraphLabelsApName,
      GraphLabelMode.annotation =>
        l10n.scanSettingsAdvancedGraphLabelsAnnotation,
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(l10n.scanSettingsAdvancedHideEmptySpectrum),
          value: settings.hideEmptySpectrumBand,
          onChanged: (checked) {
            onChanged(settings.copyWith(hideEmptySpectrumBand: checked));
          },
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<GraphLabelMode>(
          value: settings.graphLabelMode,
          decoration: InputDecoration(
            isDense: true,
            labelText: l10n.scanSettingsAdvancedGraphLabels,
          ),
          items: [
            for (final mode in GraphLabelMode.values)
              DropdownMenuItem(
                value: mode,
                child: Text(_graphLabel(l10n, mode)),
              ),
          ],
          onChanged: (mode) {
            if (mode == null) return;
            onChanged(settings.copyWith(graphLabelMode: mode));
          },
        ),
        const SizedBox(height: 8),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(l10n.scanSettingsAdvancedFollowSystem),
          value: settings.appearanceFollowSystem,
          onChanged: (checked) {
            onChanged(settings.copyWith(appearanceFollowSystem: checked));
          },
        ),
      ],
    );
  }
}
