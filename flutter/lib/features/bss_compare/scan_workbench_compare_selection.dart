import 'package:flutter/foundation.dart';

/// Up to [maxCompareBss] row keys held for side-by-side BSS compare.
///
/// Primary inspector selection stays on the workbench session; this set is
/// toggled with modifier+click on grid rows (Electron compare inspector).
class ScanWorkbenchCompareSelection extends ChangeNotifier {
  ScanWorkbenchCompareSelection({this.maxCompareBss = 3});

  final int maxCompareBss;

  final List<String> _keysInOrder = [];

  List<String> get keysInOrder => List.unmodifiable(_keysInOrder);

  int get length => _keysInOrder.length;

  bool get canCompare => _keysInOrder.length >= 2;

  bool contains(String rowKey) => _keysInOrder.contains(rowKey);

  /// Adds or removes [rowKey]. When full, drops the oldest entry before add.
  void toggle(String rowKey) {
    if (rowKey.isEmpty) return;
    final idx = _keysInOrder.indexOf(rowKey);
    if (idx >= 0) {
      _keysInOrder.removeAt(idx);
    } else {
      while (_keysInOrder.length >= maxCompareBss) {
        _keysInOrder.removeAt(0);
      }
      _keysInOrder.add(rowKey);
    }
    notifyListeners();
  }

  void remove(String rowKey) {
    if (!_keysInOrder.remove(rowKey)) return;
    notifyListeners();
  }

  void clear() {
    if (_keysInOrder.isEmpty) return;
    _keysInOrder.clear();
    notifyListeners();
  }

  void pruneMissing(Set<String> validKeys) {
    final before = _keysInOrder.length;
    _keysInOrder.removeWhere((k) => !validKeys.contains(k));
    if (_keysInOrder.length != before) notifyListeners();
  }
}
