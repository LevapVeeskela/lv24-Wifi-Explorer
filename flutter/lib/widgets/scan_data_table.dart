import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lv24_sunset_theme/lv24_sunset_theme.dart';
import 'package:scan_domain/scan_domain.dart';

import '../features/column_rules/column_rules.dart';
import '../features/pin_colors/pin_colors.dart';
import '../features/scan_columns/scan_column_id.dart';
import '../features/scan_columns/scan_column_visibility.dart';
import '../features/scan_issues/compute_issue_keys.dart';
import '../features/scan_organize/group_scan_rows.dart';
import '../features/scan_session/bss_display.dart';
import '../features/scan_settings/signal_unit.dart';
import '../features/scan_settings/types.dart';
import '../features/scan_sort/scan_sort.dart';
import '../shared/i18n/app_localizations.dart';
import '../shared/oui/display_scan_vendor.dart';
import 'scan_grid_display.dart';
import 'scan_issue_count_chip.dart';

class ScanDataTable extends StatelessWidget {
  const ScanDataTable({
    super.key,
    required this.rows,
    required this.selected,
    required this.onSelect,
    required this.columnVisibility,
    this.connectedBssid,
    this.pinnedColors,
    this.compareRowKeys = const {},
    this.signalUnit = SignalDisplayUnit.percent,
    this.sort,
    this.onSort,
    this.groups,
  });

  final List<ObservedBss> rows;
  final ObservedBss? selected;
  final void Function(ObservedBss row, {required bool compareToggle}) onSelect;
  final Set<String> compareRowKeys;
  final ScanColumnVisibility columnVisibility;

  /// Normalized BSSID of the associated link (Electron `connectedBssid`).
  final String? connectedBssid;

  /// Per-BSSID pinned chart colors (`AnnotationsController.pinnedColors`).
  final Map<String, String>? pinnedColors;

  /// Settings → General signal unit (dBm vs percent).
  final SignalDisplayUnit signalUnit;

  /// Active sort column (header arrow) — rows are sorted by the caller.
  final ScanSortState? sort;

  /// Header click handler; omitted disables sortable headers.
  final ValueChanged<ScanSortField>? onSort;

  /// Optional grouped rows; `null` renders [rows] flat.
  final List<ScanRowGroup>? groups;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final selectedKey = selected == null ? null : rowKey(selected!);
    final scheme = Theme.of(context).colorScheme;
    final tokens = Theme.of(context).extension<LvTokens>() ?? LvTokens.light;
    final columnRules =
        ColumnRulesScope.maybeOf(context)?.config ?? defaultColumnRules;
    final columns = _buildColumns(l10n);
    if (columns.isEmpty) {
      return const SizedBox.shrink();
    }

    return SingleChildScrollView(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          showCheckboxColumn: false,
          columns: columns,
          rows: _buildRows(
            context: context,
            l10n: l10n,
            scheme: scheme,
            tokens: tokens,
            columnRules: columnRules,
            selectedKey: selectedKey,
          ),
        ),
      ),
    );
  }

  List<DataRow> _buildRows({
    required BuildContext context,
    required AppLocalizations l10n,
    required ColorScheme scheme,
    required LvTokens tokens,
    required ColumnRulesConfig columnRules,
    required String? selectedKey,
  }) {
    final out = <DataRow>[];
    void addRow(ObservedBss row) {
      final hidden = ssidHiddenFromBss(row);
      final connected = scanGridRowConnected(row, connectedBssid);
      final stale = scanGridRowStale(row);
      final ssidStyle = scanGridSsidTextStyle(
        base: Theme.of(context).textTheme.bodyMedium ?? const TextStyle(),
        connected: connected,
        hidden: hidden,
      );
      final rowSelected = rowKey(row) == selectedKey;
      Widget cell(Widget child) => scanGridRowCell(child, stale: stale);
      Color? columnTint(ScanColumnId columnId) {
        if (rowSelected) return null;
        final ruleClass = columnRuleClassForCell(
          row,
          columnId.storageKey,
          columnRules,
        );
        return columnRuleCellBackground(scheme, tokens, ruleClass);
      }

      Widget tinted(ScanColumnId columnId, Widget child) {
        final tint = columnTint(columnId);
        if (tint == null) return child;
        return ColoredBox(color: tint, child: child);
      }

      out.add(
        DataRow(
          selected: rowSelected,
          color: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return scheme.primary.withValues(alpha: 0.16);
            }
            final inCompare = compareRowKeys.contains(rowKey(row));
            if (inCompare) {
              return scheme.secondaryContainer.withValues(alpha: 0.35);
            }
            return null;
          }),
          onSelectChanged: (_) {
            final compareToggle =
                HardwareKeyboard.instance.isMetaPressed ||
                HardwareKeyboard.instance.isControlPressed;
            onSelect(row, compareToggle: compareToggle);
          },
          cells: _buildCells(
            row: row,
            rows: rows,
            l10n: l10n,
            ssidStyle: ssidStyle,
            cell: cell,
            tinted: tinted,
            pinnedColors: pinnedColors,
          ),
        ),
      );
    }

    final groups = this.groups;
    if (groups == null) {
      rows.forEach(addRow);
      return out;
    }
    for (final group in groups) {
      out.add(_buildGroupHeaderRow(group, scheme));
      group.rows.forEach(addRow);
    }
    return out;
  }

  DataRow _buildGroupHeaderRow(ScanRowGroup group, ColorScheme scheme) {
    final visibleCount = ScanColumnId.ordered
        .where(columnVisibility.isVisible)
        .length;
    return DataRow(
      color: WidgetStatePropertyAll(
        scheme.surfaceContainerHighest.withValues(alpha: 0.55),
      ),
      cells: [
        DataCell(
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Text(
              group.label,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: scheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
        for (var i = 1; i < visibleCount; i++)
          const DataCell(SizedBox.shrink()),
      ],
    );
  }

  List<DataColumn> _buildColumns(AppLocalizations l10n) {
    final out = <DataColumn>[];
    for (final id in ScanColumnId.ordered) {
      if (!columnVisibility.isVisible(id)) continue;
      final field = _sortFieldFor(id);
      final sortable = field != null && onSort != null;
      final active = sortable && sort?.field == field;
      Widget label = Text(_headerLabel(l10n, id));
      if (active) {
        label = Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            label,
            const SizedBox(width: 4),
            Icon(
              sort!.ascending ? Icons.arrow_upward : Icons.arrow_downward,
              size: 14,
            ),
          ],
        );
      }
      out.add(
        DataColumn(
          label: label,
          numeric:
              id == ScanColumnId.rssi ||
              id == ScanColumnId.channel ||
              id == ScanColumnId.issues,
          onSort: sortable ? (_, _) => onSort!(field) : null,
        ),
      );
    }
    return out;
  }

  ScanSortField? _sortFieldFor(ScanColumnId id) {
    return switch (id) {
      ScanColumnId.ssid => ScanSortField.ssid,
      ScanColumnId.bssid => ScanSortField.bssid,
      ScanColumnId.rssi => ScanSortField.rssi,
      ScanColumnId.channel => ScanSortField.channel,
      ScanColumnId.band => ScanSortField.band,
      ScanColumnId.security => ScanSortField.security,
      ScanColumnId.issues => ScanSortField.issues,
      ScanColumnId.vendor => ScanSortField.vendor,
      ScanColumnId.phy => null,
    };
  }

  List<DataCell> _buildCells({
    required ObservedBss row,
    required List<ObservedBss> rows,
    required AppLocalizations l10n,
    required TextStyle ssidStyle,
    required Widget Function(Widget child) cell,
    required Widget Function(ScanColumnId columnId, Widget child) tinted,
    Map<String, String>? pinnedColors,
  }) {
    final out = <DataCell>[];
    for (final id in ScanColumnId.ordered) {
      if (!columnVisibility.isVisible(id)) continue;
      out.add(switch (id) {
        ScanColumnId.ssid => DataCell(
          cell(
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                PinColorSwatch(
                  color: seriesColorForRow(row, pinnedColors: pinnedColors),
                ),
                const SizedBox(width: 4),
                Text(
                  ssidGridLabel(row, l10n),
                  style: ssidStyle,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
        ScanColumnId.bssid => DataCell(cell(Text(displayBssid(row, l10n)))),
        ScanColumnId.rssi => DataCell(
          cell(
            tinted(
              ScanColumnId.rssi,
              Text(formatSignalDisplay(row.signal.rssiDbm, signalUnit)),
            ),
          ),
        ),
        ScanColumnId.channel => DataCell(cell(Text('${row.channel.number}'))),
        ScanColumnId.band => DataCell(
          cell(Text(displayBand(row.channel.band, l10n))),
        ),
        ScanColumnId.security => DataCell(
          cell(
            tinted(
              ScanColumnId.security,
              Text(displaySecurity(row.security.primary)),
            ),
          ),
        ),
        ScanColumnId.phy => DataCell(
          cell(Text(row.phy.display.isEmpty ? l10n.emDash : row.phy.display)),
        ),
        ScanColumnId.issues => DataCell(
          cell(ScanIssueCountChip(issueKeys: computeIssueKeys(row, rows))),
        ),
        ScanColumnId.vendor => DataCell(
          cell(
            Text(displayScanVendor(row, l10n), overflow: TextOverflow.ellipsis),
          ),
        ),
      });
    }
    return out;
  }

  String _headerLabel(AppLocalizations l10n, ScanColumnId id) {
    return switch (id) {
      ScanColumnId.ssid => l10n.colSsid,
      ScanColumnId.bssid => l10n.colBssid,
      ScanColumnId.rssi => l10n.colRssi,
      ScanColumnId.channel => l10n.colChannel,
      ScanColumnId.band => l10n.colBand,
      ScanColumnId.security => l10n.colSecurity,
      ScanColumnId.phy => l10n.colPhy,
      ScanColumnId.issues => l10n.scanColIssues,
      ScanColumnId.vendor => l10n.scanMessage('scan.col.vendor'),
    };
  }
}
