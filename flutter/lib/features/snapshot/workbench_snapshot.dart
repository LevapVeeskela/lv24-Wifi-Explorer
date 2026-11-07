import 'package:scan_domain/scan_domain.dart';

import '../../widgets/about_dialog.dart';
import 'create_lv24_scan_document.dart';
import 'lv24_scan_file_name.dart';
import 'lv24_scan_types.dart';
import 'parse_lv24_scan.dart';
import 'serialize_lv24_scan.dart';

class WorkbenchSnapshotBundle {
  const WorkbenchSnapshotBundle({
    required this.fileName,
    required this.text,
    required this.document,
  });

  final String fileName;
  final String text;
  final Lv24ScanDocument document;
}

WorkbenchSnapshotBundle buildWorkbenchSnapshot({
  required List<ObservedBss> networks,
  LocationAuthorization? location,
  String? appVersion,
  String? os,
  List<Lv24ScanAnnotation> annotations = const [],
  List<Lv24PinnedColor> pinnedColors = const [],
}) {
  final document = createLv24ScanDocument(
    networks: networks,
    appVersion: appVersion ?? kWorkbenchDefaultVersion,
    os: os,
    location: location,
    annotations: annotations,
    pinnedColors: pinnedColors,
  );
  return WorkbenchSnapshotBundle(
    document: document,
    fileName: suggestLv24ScanFileName(document.metadata.capturedAt),
    text: serializeLv24Scan(document),
  );
}

Lv24ScanParseResult parseWorkbenchSnapshot(String text, {String? fileName}) {
  return parseLv24Scan(text, fileName: fileName);
}
