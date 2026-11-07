import 'package:flutter/material.dart';

import '../../shared/i18n/app_localizations.dart';
import 'scan_workbench_filters.dart';

class ScanMinRssiFilter extends StatelessWidget {
  const ScanMinRssiFilter({
    super.key,
    required this.minRssiDbm,
    required this.onChanged,
  });

  final int? minRssiDbm;
  final ValueChanged<int?> onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final scheme = Theme.of(context).colorScheme;
    final sliderValue = minRssiSliderValue(minRssiDbm).toDouble();

    return Semantics(
      label: l10n.scanMessage('scan.filter.minRssi'),
      child: SizedBox(
        width: 180,
        child: Row(
          children: [
            Text(
              l10n.scanMessage('scan.filter.minRssi'),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
            ),
            Expanded(
              child: Slider(
                min: minRssiSliderMinDbm.toDouble(),
                max: minRssiSliderMaxDbm.toDouble(),
                divisions: minRssiSliderMaxDbm - minRssiSliderMinDbm,
                value: sliderValue,
                label: '${sliderValue.round()}',
                onChanged: (value) {
                  onChanged(minRssiDbmFromSlider(value));
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
