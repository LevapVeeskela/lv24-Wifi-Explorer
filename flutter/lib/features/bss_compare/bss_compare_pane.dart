import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';
import 'package:scan_l10n/scan_l10n.dart';

import '../pin_colors/pin_color_swatch.dart';
import '../pin_colors/pin_colors.dart';
import '../scan_session/bss_display.dart';
import '../scan_settings/types.dart';
import 'build_bss_compare_rows.dart';

/// Side-by-side field compare for 2–3 [networks].
class BssComparePane extends StatelessWidget {
  const BssComparePane({
    super.key,
    required this.networks,
    this.pinnedColors,
    this.onClear,
    this.signalUnit = SignalDisplayUnit.percent,
  });

  final List<ObservedBss> networks;
  final Map<String, String>? pinnedColors;
  final VoidCallback? onClear;
  final SignalDisplayUnit signalUnit;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final rows = buildBssCompareRows(networks, l10n, signalUnit: signalUnit);

    if (networks.length < 2 || rows.isEmpty) {
      return Center(
        child: Text(
          l10n.scanCompareHint,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
          textAlign: TextAlign.center,
        ),
      );
    }

    final diffColor = theme.colorScheme.tertiaryContainer.withValues(alpha: 0.55);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  l10n.scanTabCompare,
                  style: theme.textTheme.titleSmall,
                ),
              ),
              if (onClear != null)
                TextButton.icon(
                  onPressed: onClear,
                  icon: const Icon(Icons.close, size: 18),
                  label: Text(MaterialLocalizations.of(context).closeButtonLabel),
                ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            l10n.scanCompareDiffLegend,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 16),
            children: [
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  showCheckboxColumn: false,
                  headingRowHeight: 48,
                  dataRowMinHeight: 36,
                  dataRowMaxHeight: 72,
                  columns: [
                    DataColumn(label: Text(l10n.scanCompareField)),
                    for (final bss in networks)
                      DataColumn(
                        label: _NetworkHeader(
                          bss: bss,
                          pinnedColors: pinnedColors,
                          l10n: l10n,
                        ),
                      ),
                  ],
                  rows: [
                    for (final field in rows)
                      DataRow(
                        color: field.differs
                            ? WidgetStatePropertyAll(diffColor)
                            : null,
                        cells: [
                          DataCell(
                            Text(
                              field.label,
                              style: theme.textTheme.bodySmall?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          for (final value in field.values)
                            DataCell(
                              SelectableText(
                                value,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  fontFamily: field.mono ? 'monospace' : null,
                                ),
                              ),
                            ),
                        ],
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _NetworkHeader extends StatelessWidget {
  const _NetworkHeader({
    required this.bss,
    required this.pinnedColors,
    required this.l10n,
  });

  final ObservedBss bss;
  final Map<String, String>? pinnedColors;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      width: 140,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              PinColorSwatch(
                color: seriesColorForRow(bss, pinnedColors: pinnedColors),
              ),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  displaySsid(bss, l10n),
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.labelLarge,
                ),
              ),
            ],
          ),
          Text(
            displayBssid(bss, l10n),
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.labelSmall?.copyWith(
              fontFamily: 'monospace',
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
