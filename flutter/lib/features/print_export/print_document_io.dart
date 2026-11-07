import 'dart:io';
import 'dart:typed_data';

import 'package:printing/printing.dart';

bool get printExportSupported =>
    Platform.isMacOS || Platform.isLinux || Platform.isWindows;

Future<void> printPdfDocument(Uint8List pdfBytes, String documentTitle) async {
  await Printing.layoutPdf(
    name: documentTitle,
    onLayout: (_) async => pdfBytes,
  );
}
