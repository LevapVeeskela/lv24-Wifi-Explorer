import 'dart:io';

Future<String?> readSnapshotFile(String path) async {
  final trimmed = path.trim();
  if (trimmed.isEmpty) return null;
  try {
    return await File(trimmed).readAsString();
  } catch (_) {
    return null;
  }
}

Future<bool> writeSnapshotFile(String path, String contents) async {
  final trimmed = path.trim();
  if (trimmed.isEmpty) return false;
  try {
    await File(trimmed).writeAsString(contents);
    return true;
  } catch (_) {
    return false;
  }
}

bool get snapshotFileIoSupported => true;
