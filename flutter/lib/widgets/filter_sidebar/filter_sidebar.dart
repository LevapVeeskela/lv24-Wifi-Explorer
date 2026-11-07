import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../features/scan_filters/scan_workbench_filters.dart';
import '../../shared/i18n/app_localizations.dart';
import 'build_auto_filter_facets.dart';
import 'filter_sidebar_constants.dart';

export 'build_auto_filter_facets.dart';
export 'filter_sidebar_constants.dart';

class FilterSidebar extends StatefulWidget {
  const FilterSidebar({
    super.key,
    required this.rows,
    required this.filters,
    required this.onFiltersChange,
  });

  final List<ObservedBss> rows;
  final ScanWorkbenchFilters filters;
  final ValueChanged<ScanWorkbenchFilters> onFiltersChange;

  @override
  State<FilterSidebar> createState() => _FilterSidebarState();
}

class _FilterSidebarState extends State<FilterSidebar> {
  bool _collapsed = false;
  bool _loadedCollapsed = false;

  @override
  void initState() {
    super.initState();
    _loadCollapsed();
  }

  Future<void> _loadCollapsed() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final collapsed = prefs.getString(filterSidebarCollapsedStorageKey) == '1';
      if (mounted) {
        setState(() {
          _collapsed = collapsed;
          _loadedCollapsed = true;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadedCollapsed = true);
    }
  }

  Future<void> _setCollapsed(bool next) async {
    setState(() => _collapsed = next);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(filterSidebarCollapsedStorageKey, next ? '1' : '0');
    } catch (_) {
      // ignore
    }
  }

  bool get _sidebarFiltersActive =>
      widget.filters.band != BandFilterValue.all ||
      widget.filters.security.isNotEmpty ||
      widget.filters.vendorQuery.trim().isNotEmpty;

  void _onBandChip(BandFilterValue band) {
    widget.onFiltersChange(
      widget.filters.copyWith(
        band: widget.filters.band == band ? BandFilterValue.all : band,
      ),
    );
  }

  void _onSecurityChip(SecurityFilterValue id) {
    final current = widget.filters.security;
    final next = current.contains(id)
        ? current.where((value) => value != id).toList(growable: false)
        : [...current, id];
    widget.onFiltersChange(widget.filters.copyWith(security: next));
  }

  void _onVendorChip(String label) {
    final active = vendorQueryMatchesLabel(widget.filters.vendorQuery, label);
    widget.onFiltersChange(
      widget.filters.copyWith(vendorQuery: active ? '' : label),
    );
  }

  void _clearSidebarFilters() {
    widget.onFiltersChange(
      widget.filters.copyWith(
        band: ScanWorkbenchFilters.defaults.band,
        security: ScanWorkbenchFilters.defaults.security,
        vendorQuery: ScanWorkbenchFilters.defaults.vendorQuery,
      ),
    );
  }

  String _bandLabel(AppLocalizations l10n, BandFilterValue band) {
    return switch (band) {
      BandFilterValue.ghz24 => l10n.scanMessage('scan.filter.band.24'),
      BandFilterValue.ghz5 => l10n.scanMessage('scan.filter.band.5'),
      BandFilterValue.ghz6 => l10n.scanMessage('scan.filter.band.6'),
      BandFilterValue.all => l10n.scanMessage('scan.filter.band.all'),
    };
  }

  String _chipCount(AppLocalizations l10n, String label, int count) {
    return l10n.scanMessage(
      'scan.filterSidebar.chipCount',
      {'label': label, 'count': count},
    );
  }

  String _vendorDisplay(AppLocalizations l10n, String label) {
    if (label.isNotEmpty) return label;
    return l10n.scanMessage('scan.filterSidebar.vendor.unknown');
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final facets = buildAutoFilterFacets(widget.rows);
    final width =
        _collapsed ? filterSidebarCollapsedWidth : filterSidebarWidth;
    final borderColor = theme.dividerColor;

    if (!_loadedCollapsed) {
      return SizedBox(
        width: filterSidebarWidth,
        child: ColoredBox(color: theme.colorScheme.surface),
      );
    }

    if (_collapsed) {
      return Semantics(
        label: l10n.scanMessage('scan.filterSidebar.title'),
        child: Material(
          color: theme.colorScheme.surface,
          child: Container(
            width: width,
            decoration: BoxDecoration(
              border: Border(right: BorderSide(color: borderColor)),
            ),
            child: Column(
              children: [
                const SizedBox(height: 8),
                Tooltip(
                  message: l10n.scanMessage('scan.filterSidebar.expand'),
                  child: IconButton(
                    icon: const Icon(Icons.chevron_right, size: 20),
                    tooltip: l10n.scanMessage('scan.filterSidebar.expand'),
                    onPressed: () => _setCollapsed(false),
                  ),
                ),
                Tooltip(
                  message: l10n.scanMessage('scan.filterSidebar.title'),
                  child: Icon(
                    Icons.filter_list,
                    size: 20,
                    color: _sidebarFiltersActive
                        ? theme.colorScheme.primary
                        : theme.iconTheme.color,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Semantics(
      label: l10n.scanMessage('scan.filterSidebar.title'),
      child: Material(
        color: theme.colorScheme.surface,
        child: Container(
          width: width,
          decoration: BoxDecoration(
            border: Border(right: BorderSide(color: borderColor)),
          ),
          child: Column(
            children: [
              _FilterSidebarHeader(
                l10n: l10n,
                sidebarFiltersActive: _sidebarFiltersActive,
                onClear: _clearSidebarFilters,
                onCollapse: () => _setCollapsed(true),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 8,
                  ),
                  children: [
                    if (facets.bands.isNotEmpty)
                      _FilterSection(
                        title: l10n.scanMessage(
                          'scan.filterSidebar.section.band',
                        ),
                        children: [
                          _FilterChip(
                            label: _chipCount(
                              l10n,
                              l10n.scanMessage('scan.filter.band.all'),
                              widget.rows.length,
                            ),
                            selected: widget.filters.band == BandFilterValue.all,
                            onTap: () => widget.onFiltersChange(
                              widget.filters.copyWith(
                                band: BandFilterValue.all,
                              ),
                            ),
                          ),
                          for (final facet in facets.bands)
                            _FilterChip(
                              label: _chipCount(
                                l10n,
                                _bandLabel(l10n, facet.id),
                                facet.count,
                              ),
                              selected: widget.filters.band == facet.id,
                              onTap: () => _onBandChip(facet.id),
                            ),
                        ],
                      ),
                    if (facets.security.isNotEmpty)
                      _FilterSection(
                        title: l10n.scanMessage(
                          'scan.filterSidebar.section.security',
                        ),
                        children: [
                          for (final facet in facets.security)
                            _FilterChip(
                              label: _chipCount(
                                l10n,
                                l10n.scanMessage(
                                  facet.id == SecurityFilterValue.open
                                      ? 'scan.filter.open'
                                      : 'scan.filter.secure',
                                ),
                                facet.count,
                              ),
                              selected: widget.filters.security
                                  .contains(facet.id),
                              onTap: () => _onSecurityChip(facet.id),
                            ),
                        ],
                      ),
                    if (facets.vendors.isNotEmpty)
                      _FilterSection(
                        title: l10n.scanMessage(
                          'scan.filterSidebar.section.vendor',
                        ),
                        children: [
                          for (final facet in facets.vendors)
                            _FilterChip(
                              label: _chipCount(
                                l10n,
                                _vendorDisplay(l10n, facet.label),
                                facet.count,
                              ),
                              selected: vendorQueryMatchesLabel(
                                widget.filters.vendorQuery,
                                facet.label,
                              ),
                              onTap: () => _onVendorChip(facet.label),
                            ),
                        ],
                      ),
                    if (widget.rows.isEmpty)
                      Text(
                        l10n.scanMessage('scan.filterSidebar.empty'),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FilterSidebarHeader extends StatelessWidget {
  const _FilterSidebarHeader({
    required this.l10n,
    required this.sidebarFiltersActive,
    required this.onClear,
    required this.onCollapse,
  });

  final AppLocalizations l10n;
  final bool sidebarFiltersActive;
  final VoidCallback onClear;
  final VoidCallback onCollapse;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: theme.dividerColor)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              l10n.scanMessage('scan.filterSidebar.title'),
              style: theme.textTheme.titleSmall,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (sidebarFiltersActive)
            Tooltip(
              message: l10n.scanMessage('scan.filterSidebar.clear'),
              child: IconButton(
                icon: const Icon(Icons.filter_alt_off, size: 20),
                tooltip: l10n.scanMessage('scan.filterSidebar.clear'),
                onPressed: onClear,
              ),
            ),
          Tooltip(
            message: l10n.scanMessage('scan.filterSidebar.collapse'),
            child: IconButton(
              icon: const Icon(Icons.chevron_left, size: 20),
              tooltip: l10n.scanMessage('scan.filterSidebar.collapse'),
              onPressed: onCollapse,
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterSection extends StatelessWidget {
  const _FilterSection({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Text(
              title.toUpperCase(),
              style: theme.textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.w600,
                letterSpacing: 0.32,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Wrap(spacing: 4, runSpacing: 4, children: children),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      showCheckmark: false,
      labelStyle: const TextStyle(height: 1.25),
      onSelected: (_) => onTap(),
    );
  }
}
