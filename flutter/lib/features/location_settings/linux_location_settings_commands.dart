/// Best-effort Linux Settings / NetworkManager launchers for the denied sheet.
///
/// Tried in order; missing binaries fail soft. Desktop-specific URIs vary, so
/// this is GNOME Wi‑Fi / privacy, then one Plasma Settings command, then
/// `nm-connection-editor` and xdg settings.
const List<List<String>> linuxLocationSettingsCommands = [
  ['gnome-control-center', 'wifi'],
  ['gnome-control-center', 'privacy'],
  ['systemsettings'],
  ['nm-connection-editor'],
  ['xdg-open', 'settings://'],
];

typedef LinuxSettingsCommandRunner = Future<bool> Function(
  String executable,
  List<String> arguments,
);

/// Runs [linuxLocationSettingsCommands] until one launch succeeds.
Future<bool> tryLinuxLocationSettingsCommands(
  LinuxSettingsCommandRunner run,
) async {
  for (final command in linuxLocationSettingsCommands) {
    try {
      if (await run(command.first, command.sublist(1))) {
        return true;
      }
    } catch (_) {
      // Missing binary or failed launch — try the next command.
    }
  }
  return false;
}
