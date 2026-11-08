import 'dart:async';

import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../../features/annotations/annotations.dart';
import '../../features/export/export.dart';
import '../../features/print_export/print_export.dart';
import '../../features/column_rules/column_rules.dart';
import '../../features/scan_columns/scan_columns.dart';
import '../../features/snapshot/snapshot.dart';
import '../../features/bss_compare/bss_compare.dart';
import '../../features/scan_filters/apply_scan_filters.dart';
import '../../features/scan_filters/filter_presets/filter_presets.dart';
import '../../features/scan_filters/scan_workbench_filters.dart';
import '../../features/scan_organize/group_scan_rows.dart';
import '../../features/scan_organize/organize_by.dart';
import '../../features/scan_organize/organize_persist.dart';
import '../../features/scan_search/scan_search.dart';
import '../../features/scan_sort/scan_sort.dart';
import '../../features/scan_filters/workbench_filters_from_scan_settings.dart';
import '../../features/scan_settings/persist.dart';
import '../../features/scan_shortcuts/scan_shortcuts.dart';
import '../../features/onboarding/onboarding.dart';
import 'scan_degradation_resolve.dart';
import '../../features/scan_session/bss_display.dart';
import '../../features/scan_session/demo_scan_session.dart';
import '../../features/scan_session/scan_session_factory.dart';
import '../../features/scan_session/scan_workbench_session.dart';
import '../../features/scan_settings/apply_auto_start_scan.dart';
import '../../features/scan_settings/scan_settings_controller.dart';
import '../../features/scan_settings/scan_settings_scope.dart';
import '../../features/scan_settings/types.dart';
import '../../shared/i18n/app_localizations.dart';
import '../../widgets/filter_sidebar/filter_sidebar.dart';
import '../../widgets/location_banner.dart';
import '../../widgets/scan_app_bar.dart';
import '../../widgets/scan_data_table.dart';
import '../../widgets/scan_details_pane.dart';
import '../../widgets/scan_status_bar.dart';

class ScanWorkbenchPage extends StatefulWidget {
  const ScanWorkbenchPage({super.key, this.session});

  final ScanWorkbenchSession? session;

  @override
  State<ScanWorkbenchPage> createState() => _ScanWorkbenchPageState();
}

class _ScanWorkbenchPageState extends State<ScanWorkbenchPage> {
  late final ScanWorkbenchSession _session;
  late final AnnotationsController _annotations = AnnotationsController();
  late final bool _ownsSession;
  ScanSettingsController? _scanSettingsListen;
  bool _autoStartAttempted = false;
  ScanWorkbenchFilters _filters = workbenchFiltersFromScanSettings(
    loadScanWorkbenchSettings(),
  );
  ScanDetailsTab _detailsTab = ScanDetailsTab.details;
  List<ObservedBss>? _snapshotRows;
  LocationAuthorization? _snapshotLocation;
  DateTime? _snapshotCapturedAt;
  String? _snapshotSelectedKey;
  final ScanWorkbenchCompareSelection _compareSelection =
      ScanWorkbenchCompareSelection();
  final OrganizePersist _organizePersist = const OrganizePersist();
  final FilterPresetsStore _presetsStore = const FilterPresetsStore();
  ScanSortState _sort = ScanSortState.defaults;
  OrganizeByValue _organizeBy = OrganizeByValue.none;
  FilterPresetsStoreV1 _presets = FilterPresetsStoreV1.empty;

  @override
  void initState() {
    super.initState();
    _ownsSession = widget.session == null;
    _session = widget.session ?? createScanWorkbenchSession();
    _session.addListener(_onSession);
    _compareSelection.addListener(_onCompareSelection);
    _annotations.addListener(_onAnnotationsChanged);
    unawaited(_hydrateWorkbenchPrefs());
  }

  Future<void> _hydrateWorkbenchPrefs() async {
    final organizeBy = await _organizePersist.load();
    final presets = await _presetsStore.load();
    if (!mounted) return;
    setState(() {
      _organizeBy = organizeBy;
      _presets = presets;
    });
  }

  void _setOrganizeBy(OrganizeByValue value) {
    if (value == _organizeBy) return;
    setState(() => _organizeBy = value);
    unawaited(_organizePersist.save(value));
  }

  void _onSortChange(ScanSortField field) {
    setState(() => _sort = _sort.toggle(field));
  }

  Future<void> _savePreset(String name) async {
    final next = createFilterPreset(_presets, name, _filters);
    if (identical(next, _presets)) return;
    setState(() => _presets = next);
    await _presetsStore.save(next);
  }

  Future<void> _deletePreset(String id) async {
    final next = deleteFilterPreset(_presets, id);
    if (identical(next, _presets)) return;
    setState(() => _presets = next);
    await _presetsStore.save(next);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final controller = ScanSettingsScope.maybeOf(context);
    if (controller == null) return;
    if (_scanSettingsListen != controller) {
      _scanSettingsListen?.removeListener(_onScanSettingsChanged);
      _scanSettingsListen = controller;
      controller.addListener(_onScanSettingsChanged);
    }
    _applyScanSettings(controller.settings);
  }

  void _onSession() {
    _compareSelection.pruneMissing(_activeRows.map(_rowKey).toSet());
    if (mounted) setState(() {});
  }

  void _onCompareSelection() {
    if (mounted) setState(() {});
  }

  void _onAnnotationsChanged() {
    if (mounted) setState(() {});
  }

  ScanSearchMatchContext _searchContextFor(ObservedBss row) {
    final gated = row.identity.bssid;
    if (gated is! LocationAvailable<String>) {
      return const ScanSearchMatchContext();
    }
    final text = _annotations.textFor(gated.value);
    if (text == null || text.isEmpty) {
      return const ScanSearchMatchContext();
    }
    return ScanSearchMatchContext(annotation: text);
  }

  List<ObservedBss> _filteredRows() {
    return applyScanFilters(
      _activeRows,
      _filters,
      searchContext: _searchContextFor,
    );
  }

  void _onScanSettingsChanged() {
    final settings = _scanSettingsListen?.settings;
    if (settings != null) _applyScanSettings(settings);
  }

  void _applyScanSettings(ScanWorkbenchSettings settings) {
    final demo = _session;
    if (demo is DemoScanSession) {
      demo.applySettings(settings);
    }
    final nextFilters = syncWorkbenchFiltersFromScanSettings(
      _filters,
      settings,
    );
    if (settingsOwnedFiltersChanged(_filters, nextFilters)) {
      if (mounted) {
        setState(() => _filters = nextFilters);
      } else {
        _filters = nextFilters;
      }
    }
    _maybeAutoStartOnLoad(settings);
  }

  void _maybeAutoStartOnLoad(ScanWorkbenchSettings settings) {
    if (_autoStartAttempted) return;
    final hydrated = _scanSettingsListen?.hydrated ?? true;
    if (!shouldAutoStartScanOnLaunch(settings.autoStartScanOnLaunch)) {
      if (hydrated) _autoStartAttempted = true;
      return;
    }
    _autoStartAttempted = true;
    unawaited(_startScan());
  }

  void _onFiltersChange(ScanWorkbenchFilters next) {
    setState(() => _filters = next);
    final controller = _scanSettingsListen;
    if (controller == null) return;
    if (next.minRssiDbm != controller.settings.minRssiDbm) {
      controller.patch(
        minRssiDbm: next.minRssiDbm,
        clearMinRssi: next.minRssiDbm == null,
      );
    }
  }

  @override
  void dispose() {
    _scanSettingsListen?.removeListener(_onScanSettingsChanged);
    _compareSelection.removeListener(_onCompareSelection);
    _annotations.removeListener(_onAnnotationsChanged);
    _session.removeListener(_onSession);
    if (_ownsSession) _session.dispose();
    super.dispose();
  }

  void _toggleScan() {
    if (_session.isRunning) {
      unawaited(_session.stop());
    } else {
      setState(() => _clearSnapshotOverride());
      unawaited(_startScan());
    }
  }

  Future<void> _startScan() async {
    await _session.requestLocation();
    await _session.start();
    if (mounted) setState(() {});
  }

  void _clearSnapshotOverride() {
    _snapshotRows = null;
    _snapshotLocation = null;
    _snapshotCapturedAt = null;
    _snapshotSelectedKey = null;
  }

  List<ObservedBss> get _activeRows => _snapshotRows ?? _session.rows;

  LocationAuthorization get _activeLocation =>
      _snapshotLocation ?? _session.location;

  DateTime? get _activeCapturedAt =>
      _snapshotCapturedAt ?? _session.lastSnapshotAt;

  DateTime? get _activeLatestRowLastSeenAt => _snapshotRows == null
      ? _session.latestRowLastSeenAt
      : maxLastSeenAtForRows(_activeRows);

  bool get _snapshotDemo => _snapshotRows != null || _session.demo;

  String _rowKey(ObservedBss row) => rowKey(row);

  void _selectRow(ObservedBss row, {required bool compareToggle}) {
    if (compareToggle) {
      _compareSelection.toggle(_rowKey(row));
    }
    if (_snapshotRows != null) {
      setState(() => _snapshotSelectedKey = _rowKey(row));
    } else {
      _session.select(row);
    }
  }

  ObservedBss? _selectedVisible(List<ObservedBss> visibleRows) {
    if (_snapshotRows != null) {
      final key = _snapshotSelectedKey;
      if (key == null) return null;
      for (final row in visibleRows) {
        if (_rowKey(row) == key) return row;
      }
      return null;
    }
    final selected = _session.selected;
    if (selected == null) return null;
    final key = _rowKey(selected);
    for (final row in visibleRows) {
      if (_rowKey(row) == key) return row;
    }
    return null;
  }

  List<String> _selectedExportIds() {
    if (_snapshotRows != null) {
      final key = _snapshotSelectedKey;
      return key == null ? const [] : [key];
    }
    final selected = _session.selected;
    if (selected == null) return const [];
    final ids = <String>[rowKey(selected)];
    final bssid = selected.identity.bssid;
    if (bssid is LocationAvailable<String>) {
      final normalized = normalizeBssid(bssid.value);
      if (normalized != null) ids.add(normalized);
    }
    return ids;
  }

  SignalDisplayUnit get _signalUnit =>
      _scanSettingsListen?.settings.signalUnit ?? SignalDisplayUnit.percent;

  Widget _workbenchToolbar(AppLocalizations l10n) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: scheme.outline)),
      ),
      child: Row(
        children: [
          Text(l10n.organizeBy, style: theme.textTheme.bodySmall),
          const SizedBox(width: 8),
          DropdownButtonHideUnderline(
            child: DropdownButton<OrganizeByValue>(
              value: _organizeBy,
              isDense: true,
              style: theme.textTheme.bodySmall,
              onChanged: (value) {
                if (value != null) _setOrganizeBy(value);
              },
              items: [
                for (final value in OrganizeByValue.values)
                  DropdownMenuItem(
                    value: value,
                    child: Text(_organizeLabel(l10n, value)),
                  ),
              ],
            ),
          ),
          const Spacer(),
          FilterPresetsMenu(
            presets: _presets.presets,
            onApply: (preset) => _onFiltersChange(preset.filters),
            onDelete: (id) => unawaited(_deletePreset(id)),
            onSave: (name) => unawaited(_savePreset(name)),
          ),
        ],
      ),
    );
  }

  String _organizeLabel(AppLocalizations l10n, OrganizeByValue value) {
    return switch (value) {
      OrganizeByValue.none => l10n.organizeNone,
      OrganizeByValue.ssid => l10n.organizeSsid,
      OrganizeByValue.ap => l10n.organizeAp,
      OrganizeByValue.vendor => l10n.organizeVendor,
    };
  }

  Future<void> _printVisible() async {
    final l10n = AppLocalizations.of(context);
    await printVisibleTable(
      PrintVisibleTableRequest(
        productTitle: l10n.scanAboutTitle,
        rows: _filteredRows(),
        allRows: _activeRows,
        columnVisibility: ScanColumnsScope.visibilityOf(context),
        connectedBssid: _session.connectedBssid,
        signalUnit: _signalUnit,
        l10n: l10n,
      ),
    );
  }

  Future<void> _exportCsv(CsvExportScope scope) async {
    final l10n = AppLocalizations.of(context);
    final visibleRows = _filteredRows();
    final bundle = buildWorkbenchCsv(
      scope: scope,
      allRows: _activeRows,
      visibleRows: visibleRows,
      selectedIds: _selectedExportIds(),
      l10n: l10n,
      signalUnit: _signalUnit,
    );
    await showExportCsvDialog(context, bundle: bundle);
  }

  Future<void> _saveSnapshot() async {
    final bundle = buildWorkbenchSnapshot(
      networks: _activeRows,
      location: _activeLocation,
      annotations: _annotations.snapshotAnnotations(),
      pinnedColors: _annotations.snapshotPinnedColors(),
    );
    await showSaveSnapshotDialog(context, bundle: bundle);
  }

  Future<void> _openSnapshot() async {
    final document = await showOpenSnapshotDialog(context);
    if (!mounted || document == null) return;
    await _session.stop();
    if (!mounted) return;
    _annotations.loadFromSnapshot(document);
    setState(() {
      _snapshotRows = document.networks;
      _snapshotLocation = document.metadata.location ?? _session.location;
      _snapshotCapturedAt = DateTime.tryParse(document.metadata.capturedAt);
      _snapshotSelectedKey = document.networks.isEmpty
          ? null
          : _rowKey(document.networks.first);
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final wide = MediaQuery.sizeOf(context).width >= 900;
    final visibleRows = _filteredRows();
    final sortedRows = sortScanRows(visibleRows, _sort);
    final groups = _organizeBy == OrganizeByValue.none
        ? null
        : groupScanRows(
            sortedRows,
            _organizeBy,
            labelFor: (row) => organizeGroupLabel(
              row,
              _organizeBy,
              hiddenSsid: l10n.hiddenSsid,
              redacted: l10n.redacted,
              unknown: l10n.emDash,
            ),
          );
    final selectedVisible = _selectedVisible(sortedRows);
    final compareNetworks = resolveCompareNetworks(
      _activeRows,
      _compareSelection.keysInOrder,
    );
    final showCompare = compareNetworks.length >= 2;
    final compareKeys = _compareSelection.keysInOrder.toSet();
    final table = ColoredBox(
      color: Theme.of(context).colorScheme.surface,
      child: Column(
        children: [
          _workbenchToolbar(l10n),
          Expanded(
            child: ScanDataTable(
              rows: sortedRows,
              sort: _sort,
              onSort: _onSortChange,
              groups: groups,
              selected: selectedVisible,
              connectedBssid: _session.connectedBssid,
              columnVisibility: ScanColumnsScope.visibilityOf(context),
              pinnedColors: _annotations.pinnedColors,
              compareRowKeys: compareKeys,
              signalUnit: _signalUnit,
              onSelect: _selectRow,
            ),
          ),
        ],
      ),
    );
    final details = ColoredBox(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: showCompare
          ? BssComparePane(
              networks: compareNetworks,
              pinnedColors: _annotations.pinnedColors,
              onClear: _compareSelection.clear,
              signalUnit: _signalUnit,
            )
          : ScanDetailsPane(
              bss: selectedVisible,
              allBss: _activeRows,
              annotations: _annotations,
              tab: _detailsTab,
              onTabChange: (tab) => setState(() => _detailsTab = tab),
            ),
    );

    return AnnotationsScope(
      controller: _annotations,
      child: PersistedColumnRules(
        child: ScanWorkbenchShortcuts(
          onToggleScan: _toggleScan,
          onDetailsTabIndex: (index) =>
              setState(() => _detailsTab = ScanDetailsTab.values[index]),
          child: Scaffold(
            appBar: ScanAppBar(
              running: _session.isRunning,
              demo: _snapshotDemo,
              filters: _filters,
              onFiltersChange: _onFiltersChange,
              onStart: () {
                setState(() => _clearSnapshotOverride());
                unawaited(_startScan());
              },
              onStop: _session.stop,
              onOpenSnapshot: _openSnapshot,
              onSaveSnapshot: _saveSnapshot,
              onExportCsv: _exportCsv,
              onPrintVisible: printExportSupported ? _printVisible : null,
              exportSelectedEnabled: _selectedExportIds().isNotEmpty,
            ),
            body: Column(
              children: [
                LocationOnboarding(
                  location: _activeLocation,
                  viewingSnapshot: _snapshotRows != null,
                  onContinue: () {
                    setState(() => _clearSnapshotOverride());
                    unawaited(_startScan());
                  },
                  onRetry: () {
                    setState(() => _clearSnapshotOverride());
                    unawaited(_startScan());
                  },
                ),
                LocationBanner(
                  location: _activeLocation,
                  degradation: scanDegradationForWorkbench(
                    session: _session,
                    viewingSnapshot: _snapshotRows != null,
                  ),
                  onRetry: () {
                    setState(() => _clearSnapshotOverride());
                    unawaited(_startScan());
                  },
                ),
                Expanded(
                  child: Row(
                    children: [
                      FilterSidebar(
                        rows: _activeRows,
                        filters: _filters,
                        onFiltersChange: _onFiltersChange,
                      ),
                      Expanded(
                        child: wide
                            ? Row(
                                children: [
                                  Expanded(flex: 3, child: table),
                                  VerticalDivider(
                                    width: 1,
                                    color: Theme.of(context)
                                        .colorScheme
                                        .outline,
                                  ),
                                  Expanded(flex: 2, child: details),
                                ],
                              )
                            : Column(
                                children: [
                                  Expanded(flex: 3, child: table),
                                  Divider(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .outline,
                                  ),
                                  Expanded(flex: 2, child: details),
                                ],
                              ),
                      ),
                    ],
                  ),
                ),
                ScanStatusBar(
                  networkCount: _activeRows.length,
                  displayedCount: visibleRows.length,
                  selectedCount: showCompare
                      ? compareNetworks.length
                      : (selectedVisible == null ? 0 : 1),
                  running: _session.isRunning,
                  demo: _snapshotDemo,
                  scanCoreError: _session.scanCoreError,
                  location: _activeLocation,
                  lastSnapshotAt: _activeCapturedAt,
                  latestRowLastSeenAt: _activeLatestRowLastSeenAt,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
