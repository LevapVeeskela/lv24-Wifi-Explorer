import 'package:file_picker/file_picker.dart';

/// Native save dialog; returns a path chosen by the user (desktop/mobile with IO).
Future<String?> pickWorkbenchSavePath({
  required String dialogTitle,
  required String fileName,
  required List<String> allowedExtensions,
}) {
  return FilePicker.platform.saveFile(
    dialogTitle: dialogTitle,
    fileName: fileName,
    type: FileType.custom,
    allowedExtensions: allowedExtensions,
  );
}

/// Native open dialog; returns a filesystem path when available.
Future<String?> pickWorkbenchOpenPath({
  required String dialogTitle,
  required List<String> allowedExtensions,
}) async {
  final result = await FilePicker.platform.pickFiles(
    dialogTitle: dialogTitle,
    type: FileType.custom,
    allowedExtensions: allowedExtensions,
    allowMultiple: false,
    withData: false,
  );
  if (result == null || result.files.isEmpty) return null;
  return result.files.single.path;
}

String ensureFileExtension(String path, String extension) {
  final ext = extension.startsWith('.') ? extension.substring(1) : extension;
  final lower = path.toLowerCase();
  if (lower.endsWith('.$ext')) return path;
  return '$path.$ext';
}
