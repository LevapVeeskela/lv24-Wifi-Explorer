import 'dart:io';

import 'package:app_settings/app_settings.dart';
import 'package:url_launcher/url_launcher.dart';

import 'linux_location_settings_commands.dart';
import 'macos_location_settings_url.dart';
import 'windows_location_settings_urls.dart';

bool get canOpenLocationSettings =>
    Platform.isIOS ||
    Platform.isAndroid ||
    Platform.isMacOS ||
    Platform.isLinux ||
    Platform.isWindows;

Future<bool> openLocationSettings() async {
  if (Platform.isMacOS) {
    final uri = Uri.parse(macosLocationSettingsUrl);
    return launchUrl(uri);
  }
  if (Platform.isIOS) {
    await AppSettings.openAppSettings(type: AppSettingsType.settings);
    return true;
  }
  if (Platform.isAndroid) {
    await AppSettings.openAppSettings(type: AppSettingsType.location);
    return true;
  }
  if (Platform.isLinux) {
    return tryLinuxLocationSettingsCommands(_launchLinuxSettings);
  }
  if (Platform.isWindows) {
    return tryWindowsLocationSettingsUrls(_launchWindowsSettings);
  }
  return false;
}

Future<bool> _launchWindowsSettings(String url) async {
  try {
    return await launchUrl(
      Uri.parse(url),
      mode: LaunchMode.externalApplication,
    );
  } catch (_) {
    return false;
  }
}

Future<bool> _launchLinuxSettings(
  String executable,
  List<String> arguments,
) async {
  try {
    await Process.start(executable, arguments, mode: ProcessStartMode.detached);
    return true;
  } on ProcessException {
    return false;
  }
}
