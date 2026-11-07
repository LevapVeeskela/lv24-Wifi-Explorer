import 'dart:convert';
import 'dart:io';

import 'constants.dart';
import 'persist_backend_mobile.dart';

bool get _isDesktop =>
    Platform.isMacOS || Platform.isLinux || Platform.isWindows;

ScanSettingsFileBackend createScanSettingsFileBackend() {
  if (!_isDesktop) {
    return ScanSettingsFileBackend.mobile();
  }
  try {
    final file = _resolveSettingsFile();
    if (file == null) return const ScanSettingsFileBackend.unavailable();
    return ScanSettingsFileBackend._(file);
  } catch (_) {
    return const ScanSettingsFileBackend.unavailable();
  }
}

File? _resolveSettingsFile() {
  final home = Platform.environment['HOME'] ??
      Platform.environment['USERPROFILE'] ??
      Platform.environment['APPDATA'];
  if (home == null || home.isEmpty) return null;
  final dir = Directory('$home/.config/lv24-wifi-explorer');
  if (!dir.existsSync()) {
    dir.createSync(recursive: true);
  }
  return File('${dir.path}/$scanSettingsFileName');
}

class ScanSettingsFileBackend {
  const ScanSettingsFileBackend.unavailable()
      : _file = null,
        _mobile = null;

  ScanSettingsFileBackend._(this._file) : _mobile = null;

  ScanSettingsFileBackend.mobile()
      : _file = null,
        _mobile = ScanSettingsMobileBackend.instance;

  final File? _file;
  final ScanSettingsMobileBackend? _mobile;

  bool get isAvailable => _file != null || _mobile != null;

  bool get isMobile => _mobile != null;

  String? readSync() {
    final mobile = _mobile;
    if (mobile != null) return mobile.readSync();
    final file = _file;
    if (file == null || !file.existsSync()) return null;
    try {
      return file.readAsStringSync(encoding: utf8);
    } catch (_) {
      return null;
    }
  }

  void writeSync(String contents) {
    final mobile = _mobile;
    if (mobile != null) {
      mobile.writeSync(contents);
      return;
    }
    final file = _file;
    if (file == null) return;
    try {
      file.writeAsStringSync(contents, encoding: utf8, flush: true);
    } catch (_) {
      // quota / permissions
    }
  }
}
