import 'scan_column_defaults.dart';
import 'scan_column_id.dart';

class ScanColumnVisibility {
  const ScanColumnVisibility(this._visible);

  ScanColumnVisibility.defaults()
      : _visible = Map<ScanColumnId, bool>.from(defaultScanColumnVisibility);

  final Map<ScanColumnId, bool> _visible;

  bool isVisible(ScanColumnId id) => _visible[id] ?? defaultScanColumnVisibility[id] ?? true;

  ScanColumnVisibility withVisible(ScanColumnId id, bool visible) {
    final next = Map<ScanColumnId, bool>.from(_visible);
    next[id] = visible;
    return ScanColumnVisibility(next);
  }

  ScanColumnVisibility mergeRaw(Map<String, bool> raw) {
    final next = Map<ScanColumnId, bool>.from(defaultScanColumnVisibility);
    next.addAll(_visible);
    for (final entry in raw.entries) {
      final id = ScanColumnId.tryParse(entry.key);
      if (id != null) next[id] = entry.value;
    }
    return ScanColumnVisibility(next);
  }

  Map<String, bool> toStorageMap() {
    return {
      for (final id in ScanColumnId.ordered) id.storageKey: isVisible(id),
    };
  }

  static ScanColumnVisibility fromStorageMap(Map<String, bool> raw) {
    return ScanColumnVisibility(defaultScanColumnVisibility).mergeRaw(raw);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ScanColumnVisibility &&
        ScanColumnId.ordered.every((id) => other.isVisible(id) == isVisible(id));
  }

  @override
  int get hashCode => Object.hashAll(
        ScanColumnId.ordered.map(isVisible),
      );
}
