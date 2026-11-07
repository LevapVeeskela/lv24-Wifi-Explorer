/// One row in the BSS compare table (label + aligned cell values).
class BssCompareFieldRow {
  const BssCompareFieldRow({
    required this.id,
    required this.label,
    required this.values,
    required this.differs,
    this.mono = false,
  });

  final String id;
  final String label;
  final List<String> values;
  final bool differs;
  final bool mono;
}
