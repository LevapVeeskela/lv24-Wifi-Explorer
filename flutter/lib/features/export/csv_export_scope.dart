enum CsvExportScope {
  visible,
  selected,
  all,
}

String csvFileName(CsvExportScope scope) {
  return 'lv24-export-${scope.name}.csv';
}
