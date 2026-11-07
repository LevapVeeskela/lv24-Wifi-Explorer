import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/location_settings/location_settings.dart';

void main() {
  test('macOS location settings URL matches Electron IPC constant', () {
    expect(
      macosLocationSettingsUrl,
      'x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices',
    );
  });

  test(
    'Linux settings commands are GNOME, Plasma, NM, then xdg — fail soft',
    () {
      expect(linuxLocationSettingsCommands, [
        ['gnome-control-center', 'wifi'],
        ['gnome-control-center', 'privacy'],
        ['systemsettings'],
        ['nm-connection-editor'],
        ['xdg-open', 'settings://'],
      ]);
    },
  );

  test('Linux opener uses the first command that launches', () async {
    final tried = <String>[];
    final opened = await tryLinuxLocationSettingsCommands((exe, args) async {
      tried.add([exe, ...args].join(' '));
      return exe == 'nm-connection-editor';
    });
    expect(opened, isTrue);
    expect(tried, [
      'gnome-control-center wifi',
      'gnome-control-center privacy',
      'systemsettings',
      'nm-connection-editor',
    ]);
  });

  test('Linux opener fails soft when every launcher is missing', () async {
    final opened = await tryLinuxLocationSettingsCommands((exe, args) async {
      throw Exception('not found: $exe ${args.join(' ')}');
    });
    expect(opened, isFalse);
  });

  test('Windows settings URIs are network-wifi then privacy-location', () {
    expect(windowsLocationSettingsUrls, [
      'ms-settings:network-wifi',
      'ms-settings:privacy-location',
    ]);
  });

  test('Windows opener uses the first URI that launches', () async {
    final tried = <String>[];
    final opened = await tryWindowsLocationSettingsUrls((url) async {
      tried.add(url);
      return url == 'ms-settings:privacy-location';
    });
    expect(opened, isTrue);
    expect(tried, ['ms-settings:network-wifi', 'ms-settings:privacy-location']);
  });

  test('Windows opener fails soft when every URI fails', () async {
    final opened = await tryWindowsLocationSettingsUrls((url) async {
      throw Exception('not registered: $url');
    });
    expect(opened, isFalse);
  });
}
