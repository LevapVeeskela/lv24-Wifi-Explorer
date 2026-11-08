import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_columns/scan_column_id.dart';
import 'package:lv24_wifi_explorer/features/scan_columns/scan_column_persistence.dart';
import 'package:lv24_wifi_explorer/features/scan_columns/scan_column_profile.dart';
import 'package:lv24_wifi_explorer/features/scan_columns/scan_column_store.dart';
import 'package:lv24_wifi_explorer/features/scan_columns/scan_column_visibility.dart';
import 'package:lv24_wifi_explorer/features/scan_columns/scan_columns_controller.dart';

void main() {
  test('decodes legacy flat column map', () {
    final parsed = ScanColumnPersistence.decode({
      'ssid': true,
      'bssid': false,
      'rssi': true,
    });
    expect(parsed, isNotNull);
    expect(parsed!.visibility.isVisible(ScanColumnId.ssid), isTrue);
    expect(parsed.visibility.isVisible(ScanColumnId.bssid), isFalse);
    expect(parsed.profiles, isEmpty);
  });

  test('round-trips profiles through stub store', () async {
    final store = ScanColumnStore(
      file: File('${Directory.systemTemp.path}/lv24-columns-test-${DateTime.now().microsecondsSinceEpoch}.json'),
    );
    final visibility = ScanColumnVisibility.defaults().withVisible(
      ScanColumnId.vendor,
      false,
    );
    await store.write(
      ScanColumnPersistence(
        visibility: visibility,
        activeProfileId: 'audit',
        profiles: [
          ScanColumnProfile(
            id: 'audit',
            name: 'Audit',
            visibility: visibility,
          ),
        ],
      ),
    );

    final loaded = await store.read();
    expect(loaded, isNotNull);
    expect(loaded!.activeProfileId, 'audit');
    expect(loaded.profiles.single.name, 'Audit');
    expect(loaded.visibility.isVisible(ScanColumnId.vendor), isFalse);
  });

  test('controller saves and switches named profiles', () async {
    final store = ScanColumnStore(
      file: File('${Directory.systemTemp.path}/lv24-columns-test-${DateTime.now().microsecondsSinceEpoch}.json'),
    );
    final controller = ScanColumnsController(store: store);
    await controller.load();

    final custom = ScanColumnVisibility.defaults().withVisible(
      ScanColumnId.phy,
      false,
    );
    await controller.saveNamedProfile('Minimal', custom);
    expect(controller.customProfiles.single.name, 'Minimal');
    expect(controller.activeProfileId, isNotNull);
    expect(controller.visibility.isVisible(ScanColumnId.phy), isFalse);

    await controller.switchProfile(ScanColumnProfile.defaultId);
    expect(controller.visibility.isVisible(ScanColumnId.phy), isTrue);

    await controller.switchProfile(controller.customProfiles.single.id);
    expect(controller.visibility.isVisible(ScanColumnId.phy), isFalse);
  });
}
