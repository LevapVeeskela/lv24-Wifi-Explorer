import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../features/annotations/annotations.dart';
import '../features/scan_details/bss_accessors.dart';
import '../features/scan_details/chart_timescale.dart';
import '../features/scan_settings/scan_settings_scope.dart';
import '../features/scan_settings/signal_unit.dart';
import '../features/scan_settings/types.dart';
import '../shared/i18n/app_localizations.dart';
import 'details/advanced_details_tab.dart';
import 'details/chart_strip.dart';
import 'details/network_details_tab.dart';
import 'details/occupancy_band_strip.dart';
import 'details/signal_history_chart.dart';

enum ScanDetailsTab { details, signal, occupancy, advanced }

class ScanDetailsPane extends StatefulWidget {
  const ScanDetailsPane({
    super.key,
    required this.bss,
    required this.allBss,
    this.annotations,
    this.tab = ScanDetailsTab.details,
    this.onTabChange,
  });

  final ObservedBss? bss;
  final List<ObservedBss> allBss;
  final AnnotationsController? annotations;
  final ScanDetailsTab tab;
  final ValueChanged<ScanDetailsTab>? onTabChange;

  @override
  State<ScanDetailsPane> createState() => _ScanDetailsPaneState();
}

class _ScanDetailsPaneState extends State<ScanDetailsPane>
    with SingleTickerProviderStateMixin {
  late TabController _controller;
  SignalChartUnit _localChartUnit = SignalChartUnit.pct;
  ChartTimescale _timescale = ChartTimescale.m5;

  @override
  void initState() {
    super.initState();
    _controller = TabController(
      length: 4,
      vsync: this,
      initialIndex: widget.tab.index,
    );
    _controller.addListener(_onTabChanged);
  }

  @override
  void didUpdateWidget(covariant ScanDetailsPane oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.tab != widget.tab && _controller.index != widget.tab.index) {
      _controller.index = widget.tab.index;
    }
  }

  void _onTabChanged() {
    if (_controller.indexIsChanging) return;
    widget.onTabChange?.call(ScanDetailsTab.values[_controller.index]);
  }

  @override
  void dispose() {
    _controller.removeListener(_onTabChanged);
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    if (widget.bss == null) {
      return Center(
        child: Text(
          l10n.detailsEmpty,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      );
    }

    final bss = widget.bss!;
    final pinnedColors = widget.annotations?.pinnedColors;
    final settings = ScanSettingsScope.maybeOf(context)?.settings;
    final hideEmptyBands = settings?.hideEmptySpectrumBand ?? true;
    final graphLabelMode = settings?.graphLabelMode ?? GraphLabelMode.ssid;
    final signalUnit = settings?.signalUnit ?? SignalDisplayUnit.percent;
    final chartUnit = settings != null
        ? signalDisplayToChartUnit(settings.signalUnit)
        : _localChartUnit;

    void onChartUnitChange(SignalChartUnit unit) {
      final controller = ScanSettingsScope.maybeOf(context);
      if (controller != null) {
        controller.patch(signalUnit: chartUnitToSignalDisplay(unit));
      } else {
        setState(() => _localChartUnit = unit);
      }
    }
    final selectedBssid = bssidOf(bss);
    final annotation = selectedBssid == null
        ? ''
        : (widget.annotations?.textFor(selectedBssid) ?? '');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Material(
          color: theme.scaffoldBackgroundColor,
          child: TabBar(
            controller: _controller,
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            tabs: [
              Tab(text: l10n.scanTabDetails),
              Tab(text: l10n.scanTabSignal),
              Tab(text: l10n.scanTabOccupancy),
              Tab(text: l10n.scanTabAdvanced),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _controller,
            children: [
              ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                children: [
                  NetworkDetailsTab(
                    bss: bss,
                    annotations: widget.annotations,
                    signalUnit: signalUnit,
                  ),
                  const SizedBox(height: 16),
                  ChartStrip(
                    bss: bss,
                    allBss: widget.allBss,
                    pinnedColors: pinnedColors,
                    hideEmptyBands: hideEmptyBands,
                    graphLabelMode: graphLabelMode,
                    annotation: annotation,
                    chartUnit: chartUnit,
                    onChartUnitChange: onChartUnitChange,
                    timescale: _timescale,
                    onTimescaleChange: (ts) => setState(() => _timescale = ts),
                  ),
                ],
              ),
              ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                children: [
                  SignalHistoryChart(
                    bss: bss,
                    pinnedColors: pinnedColors,
                    unit: chartUnit,
                    onUnitChange: onChartUnitChange,
                    timescale: _timescale,
                    onTimescaleChange: (ts) => setState(() => _timescale = ts),
                    height: 280,
                    graphLabelMode: graphLabelMode,
                    annotation: annotation,
                  ),
                ],
              ),
              ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                children: [
                  OccupancyBandStrip(
                    allBss: widget.allBss,
                    bss: bss,
                    pinnedColors: pinnedColors,
                    hideEmptyBands: hideEmptyBands,
                    height: 280,
                  ),
                ],
              ),
              ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                children: [
                  AdvancedDetailsTab(bss: bss, allBss: widget.allBss),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
