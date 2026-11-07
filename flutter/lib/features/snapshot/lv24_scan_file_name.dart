import 'lv24_scan_constants.dart';

String _lastSegment(String fileName) {
  final trimmed = fileName.trim();
  final slash = trimmed.lastIndexOf('/');
  final back = trimmed.lastIndexOf('\\');
  final cut = slash > back ? slash : back;
  return (cut >= 0 ? trimmed.substring(cut + 1) : trimmed).toLowerCase();
}

bool isLv24ScanFileName(String fileName) {
  return _lastSegment(fileName).endsWith(lv24ScanExtension);
}

bool isForeignScanFileName(String fileName) {
  final name = _lastSegment(fileName);
  return foreignScanExtensions.any(name.endsWith);
}

String suggestLv24ScanFileName([String? capturedAt]) {
  final iso = capturedAt ?? DateTime.now().toUtc().toIso8601String();
  final stamp = iso
      .replaceAll(RegExp(r'[:.]'), '')
      .replaceAll(RegExp(r'z$', caseSensitive: false), 'Z');
  return 'lv24-scan-$stamp$lv24ScanExtension';
}
