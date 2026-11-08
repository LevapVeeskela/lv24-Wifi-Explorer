import 'package:flutter/material.dart';

import '../../shared/i18n/app_localizations.dart';
import '../scan_filters/scan_workbench_filters.dart';
import 'constants.dart';
import 'types.dart';

class ScanSettingsGeneralPanel extends StatelessWidget {
  const ScanSettingsGeneralPanel({
    super.key,
    required this.settings,
    required this.onChanged,
  });

  final ScanWorkbenchSettings settings;
  final ValueChanged<ScanWorkbenchSettings> onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final sliderValue = minRssiSliderValue(settings.minRssiDbm).toDouble();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          l10n.scanSettingsSignalUnit,
          style: Theme.of(context).textTheme.titleSmall
              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 8),
        SegmentedButton<SignalDisplayUnit>(
          showSelectedIcon: false,
          segments: [
            ButtonSegment(
              value: SignalDisplayUnit.dbm,
              label: Text(l10n.scanSettingsSignalUnitDbm),
            ),
            ButtonSegment(
              value: SignalDisplayUnit.percent,
              label: Text(l10n.scanSettingsSignalUnitPercent),
            ),
          ],
          selected: {settings.signalUnit},
          onSelectionChanged: (next) {
            if (next.isEmpty) return;
            onChanged(settings.copyWith(signalUnit: next.first));
          },
        ),
        const SizedBox(height: 20),
        Text(
          l10n.scanFilterMinRssi,
          style: Theme.of(context).textTheme.titleSmall
              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
        Slider(
          min: minRssiFilterMinDbm.toDouble(),
          max: minRssiFilterMaxDbm.toDouble(),
          divisions: minRssiFilterMaxDbm - minRssiFilterMinDbm,
          value: sliderValue,
          label: '${sliderValue.round()}',
          onChanged: (value) {
            final next = minRssiDbmFromSlider(value);
            if (next == null) {
              onChanged(settings.copyWith(clearMinRssi: true));
            } else {
              onChanged(settings.copyWith(minRssiDbm: next));
            }
          },
        ),
        const SizedBox(height: 8),
        Text(
          l10n.scanSettingsScanInterval,
          style: Theme.of(context).textTheme.titleSmall
              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<int>(
          value: settings.scanIntervalSec,
          decoration: InputDecoration(
            isDense: true,
            labelText: l10n.scanSettingsScanInterval,
          ),
          items: [
            for (final sec in scanIntervalSecOptions)
              DropdownMenuItem(
                value: sec,
                child: Text(l10n.scanSettingsScanIntervalSec(sec)),
              ),
          ],
          onChanged: (sec) {
            if (sec == null) return;
            onChanged(settings.copyWith(scanIntervalSec: sec));
          },
        ),
        const SizedBox(height: 8),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(l10n.scanSettingsAutoStart),
          value: settings.autoStartScanOnLaunch,
          onChanged: (checked) {
            onChanged(settings.copyWith(autoStartScanOnLaunch: checked));
          },
        ),
        const SizedBox(height: 20),
        Text(
          l10n.scanSettingsDataSource,
          style: Theme.of(context).textTheme.titleSmall
              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 8),
        SegmentedButton<bool>(
          showSelectedIcon: false,
          segments: [
            ButtonSegment(value: true, label: Text(l10n.scanTitleDemo)),
            ButtonSegment(value: false, label: Text(l10n.scanSettingsLiveScan)),
          ],
          selected: {settings.preferDemo},
          onSelectionChanged: (next) {
            if (next.isEmpty) return;
            onChanged(settings.copyWith(preferDemo: next.first));
          },
        ),
        const SizedBox(height: 20),
        Text(
          l10n.scanSettingsLanguage,
          style: Theme.of(context).textTheme.titleSmall
              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 8),
        SegmentedButton<String>(
          showSelectedIcon: false,
          segments: [
            for (final option in supportedLanguageOptions)
              ButtonSegment(
                value: option.languageCode,
                label: Text(option.label),
              ),
          ],
          selected: {settings.languageCode},
          onSelectionChanged: (next) {
            if (next.isEmpty) return;
            onChanged(settings.copyWith(languageCode: next.first));
          },
        ),
        const SizedBox(height: 12),
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          controlAffinity: ListTileControlAffinity.leading,
          title: Text(l10n.scanSettingsIncludeHiddenSsid),
          value: settings.includeHiddenSsid,
          onChanged: (checked) {
            if (checked == null) return;
            onChanged(settings.copyWith(includeHiddenSsid: checked));
          },
        ),
      ],
    );
  }
}
