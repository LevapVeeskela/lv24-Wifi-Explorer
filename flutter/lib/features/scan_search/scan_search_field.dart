import 'dart:async';

import 'package:flutter/material.dart';

import '../../shared/i18n/app_localizations.dart';
import '../scan_filters/scan_workbench_filters.dart';
import 'scan_search_history.dart';
import 'scan_search_history_store.dart';

/// App bar search field with debounced filter updates and recent-query autocomplete.
class ScanSearchField extends StatefulWidget {
  const ScanSearchField({
    super.key,
    required this.searchQuery,
    required this.onChanged,
    this.width = 240,
  });

  final String searchQuery;
  final ValueChanged<String> onChanged;
  final double width;

  @override
  State<ScanSearchField> createState() => _ScanSearchFieldState();
}

class _ScanSearchFieldState extends State<ScanSearchField> {
  late final TextEditingController _searchController;
  late final FocusNode _focusNode;
  Timer? _searchDebounce;
  List<String> _history = const [];

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: widget.searchQuery);
    _focusNode = FocusNode();
    unawaited(_loadHistory());
  }

  Future<void> _loadHistory() async {
    final loaded = await loadScanSearchHistory();
    if (!mounted) return;
    setState(() => _history = loaded);
  }

  @override
  void didUpdateWidget(covariant ScanSearchField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.searchQuery != widget.searchQuery &&
        widget.searchQuery != _searchController.text) {
      _searchController.text = widget.searchQuery;
    }
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _focusNode.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _recordHistoryCommit(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return;
    final next = pushScanSearchHistory(_history, trimmed);
    var same = next.length == _history.length;
    if (same) {
      for (var i = 0; i < next.length; i++) {
        if (next[i] != _history[i]) {
          same = false;
          break;
        }
      }
    }
    if (same) return;
    setState(() => _history = next);
    unawaited(persistScanSearchHistory(next));
  }

  void _scheduleSearchCommit(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: searchDebounceMs), () {
      if (!mounted) return;
      if (widget.searchQuery == value) {
        _recordHistoryCommit(value);
        return;
      }
      widget.onChanged(value);
      _recordHistoryCommit(value);
    });
  }

  void _onSearchChanged(String value) {
    _scheduleSearchCommit(value);
    setState(() {});
  }

  void _clearSearch() {
    _searchController.clear();
    _scheduleSearchCommit('');
    setState(() {});
  }

  void _applySelection(String value) {
    _searchController.text = value;
    _searchController.selection = TextSelection.collapsed(offset: value.length);
    _scheduleSearchCommit(value);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Semantics(
      label: l10n.scanMessage('scan.search.placeholder'),
      child: SizedBox(
        width: widget.width,
        child: RawAutocomplete<String>(
          textEditingController: _searchController,
          focusNode: _focusNode,
          optionsBuilder: (textEditingValue) {
            return filterScanSearchHistoryForAutocomplete(
              _history,
              textEditingValue.text,
            );
          },
          onSelected: _applySelection,
          fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
            return TextField(
              controller: controller,
              focusNode: focusNode,
              decoration: InputDecoration(
                isDense: true,
                hintText: l10n.scanMessage('scan.search.placeholder'),
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isEmpty
                    ? null
                    : IconButton(
                        tooltip: l10n.scanMessage('scan.search.clear'),
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: _clearSearch,
                      ),
                border: const OutlineInputBorder(),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
              ),
              onChanged: _onSearchChanged,
              onSubmitted: (value) {
                onFieldSubmitted();
                _scheduleSearchCommit(value);
              },
            );
          },
          optionsViewBuilder: (context, onSelected, options) {
            if (options.isEmpty) {
              return const SizedBox.shrink();
            }
            return Align(
              alignment: Alignment.topLeft,
              child: Material(
                elevation: 4,
                borderRadius: BorderRadius.circular(4),
                clipBehavior: Clip.antiAlias,
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight: 240,
                    maxWidth: widget.width,
                  ),
                  child: ListView.builder(
                    padding: EdgeInsets.zero,
                    shrinkWrap: true,
                    itemCount: options.length,
                    itemBuilder: (context, index) {
                      final option = options.elementAt(index);
                      return ListTile(
                        dense: true,
                        visualDensity: VisualDensity.compact,
                        leading: const Icon(Icons.history, size: 18),
                        title: Text(
                          option,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        onTap: () => onSelected(option),
                      );
                    },
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
