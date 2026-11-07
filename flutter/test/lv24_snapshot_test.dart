import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/ie_view/ie_source.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_networks.dart';
import 'package:lv24_wifi_explorer/features/snapshot/lv24_scan_constants.dart';
import 'package:lv24_wifi_explorer/features/snapshot/lv24_scan_file_name.dart';
import 'package:lv24_wifi_explorer/features/snapshot/lv24_scan_types.dart';
import 'package:lv24_wifi_explorer/features/snapshot/parse_lv24_scan.dart';
import 'package:lv24_wifi_explorer/features/snapshot/observed_bss_json.dart';
import 'package:lv24_wifi_explorer/features/snapshot/workbench_snapshot.dart';
import 'package:scan_domain/scan_domain.dart';

void main() {
  test('lv24scan file names accept .lv24scan and reject wifiexplorer', () {
    expect(isLv24ScanFileName('campus.lv24scan'), isTrue);
    expect(isForeignScanFileName('old.wifiexplorer'), isTrue);
    expect(
      suggestLv24ScanFileName('2026-09-17T19:00:00.000Z').endsWith(lv24ScanExtension),
      isTrue,
    );
  });

  test('serialize → parse preserves demo networks', () {
    final networks = bundledDemoObservedBss();
    final bundle = buildWorkbenchSnapshot(
      networks: networks,
      location: LocationAuthorization.granted,
      appVersion: '1.0.0',
      os: 'darwin',
    );

    expect(bundle.text.contains(lv24ScanKind), isTrue);
    expect(bundle.text.toLowerCase().contains('wifiexplorer'), isFalse);

    final parsed = parseLv24Scan(bundle.text, fileName: 'campus.lv24scan');
    expect(parsed, isA<Lv24ScanParseOk>());
    final doc = (parsed as Lv24ScanParseOk).document;
    expect(doc.networks.length, networks.length);
    expect(doc.metadata.appVersion, '1.0.0');
    expect(doc.metadata.location, LocationAuthorization.granted);
    expect(bssidOfNetwork(doc.networks.first), isNotNull);
  });

  test('rejects foreign format', () {
    final foreign = parseLv24Scan(
      '{"kind":"wifiexplorer","networks":[]}',
    );
    expect(foreign, isA<Lv24ScanParseError>());
    expect(
      (foreign as Lv24ScanParseError).code,
      Lv24ScanParseCode.foreignFormat,
    );
  });

  test('ie snapshot persists Electron shallow fields and raw bytes', () {
    final lab = bundledDemoObservedBss().firstWhere((n) => n.lastRaw.ssid == 'LV24-Lab');
    final ieJson = observedBssToJson(lab)['ie'] as Map<String, dynamic>;

    expect(
      ieJson.keys,
      containsAll([
        'level',
        'byteLength',
        'presentIds',
        'wpaVendorIe',
        'rsnIe',
        'htCapabilities',
        'vhtCapabilities',
        'heCapabilities',
        'ehtCapabilities',
        'countryFromIe',
        'nssHint',
        'htPrimaryChannel',
        'htSecondaryOffset',
        'ccfs0',
        'informationElementData',
      ]),
    );
    expect(ieJson['presentIds'], isNotEmpty);
    expect(ieJson['htSecondaryOffset'], lab.ie.htSecondaryOffset);
    expect(ieJson['ccfs0'], lab.ie.ccfs0);
    expect(ieJson['nssHint'], lab.ie.nssHint);
    expect(ieJson['informationElementData'], lab.lastRaw.informationElementData);
  });

  test('serialize → parse rebuilds IE tree from persisted bytes', () {
    final networks = bundledDemoObservedBss();
    final lab = networks.firstWhere((n) => n.lastRaw.ssid == 'LV24-Lab');
    final originalTree = buildIeTree(decodeIesForObservedBss(lab));
    expect(originalTree.length, greaterThan(1));

    final bundle = buildWorkbenchSnapshot(
      networks: networks,
      location: LocationAuthorization.granted,
      appVersion: '1.0.0',
      os: 'darwin',
    );
    final parsed = parseLv24Scan(bundle.text, fileName: 'campus.lv24scan');
    final doc = (parsed as Lv24ScanParseOk).document;
    final restored = doc.networks.firstWhere((n) => n.lastRaw.ssid == 'LV24-Lab');

    expect(restored.ie.presentIds, lab.ie.presentIds);
    expect(restored.ie.nssHint, lab.ie.nssHint);
    expect(restored.ie.htSecondaryOffset, lab.ie.htSecondaryOffset);
    expect(restored.ie.ccfs0, lab.ie.ccfs0);
    expect(restored.ie.htCapabilities, isTrue);
    expect(restored.ie.vhtCapabilities, isTrue);
    expect(restored.lastRaw.informationElementData, lab.lastRaw.informationElementData);

    final restoredTree = buildIeTree(decodeIesForObservedBss(restored));
    expect(restoredTree.map((n) => n.key), originalTree.map((n) => n.key));
  });

  test('legacy 4-field ie rehydrates from lastRaw bytes', () {
    final lab = bundledDemoObservedBss().firstWhere((n) => n.lastRaw.ssid == 'LV24-Lab');
    final json = observedBssToJson(lab);
    json['ie'] = {
      'level': lab.ie.level,
      'byteLength': lab.ie.byteLength,
      'htSecondaryOffset': lab.ie.htSecondaryOffset,
      'ccfs0': lab.ie.ccfs0,
    };

    final restored = observedBssFromJson(json);
    expect(restored.ie.presentIds, isNotEmpty);
    expect(restored.ie.nssHint, lab.ie.nssHint);
    expect(restored.ie.countryFromIe, lab.ie.countryFromIe);
    expect(buildIeTree(decodeIesForObservedBss(restored)), isNotEmpty);
  });

  test('ie.informationElementData rebuilds lastRaw bytes and tree', () {
    final lab = bundledDemoObservedBss().firstWhere((n) => n.lastRaw.ssid == 'LV24-Lab');
    final json = observedBssToJson(lab);
    (json['lastRaw'] as Map)['informationElementData'] = null;

    final restored = observedBssFromJson(json);
    expect(restored.lastRaw.informationElementData, lab.lastRaw.informationElementData);
    expect(
      decodeIesForObservedBss(restored).elements.map((e) => e.kind),
      decodeIesForObservedBss(lab).elements.map((e) => e.kind),
    );
  });

  test('parseWorkbenchSnapshot round-trips buildWorkbenchSnapshot', () {
    final networks = bundledDemoObservedBss();
    final bundle = buildWorkbenchSnapshot(
      networks: networks,
      location: LocationAuthorization.denied,
      appVersion: '2.0.0',
      os: 'test',
    );

    expect(bundle.fileName.endsWith('.lv24scan'), isTrue);
    expect(bundle.document.networks.length, networks.length);

    final parsed = parseWorkbenchSnapshot(bundle.text, fileName: bundle.fileName);
    expect(parsed, isA<Lv24ScanParseOk>());
    final doc = (parsed as Lv24ScanParseOk).document;
    expect(doc.metadata.appVersion, '2.0.0');
    expect(doc.metadata.location, LocationAuthorization.denied);
    expect(doc.networks.length, networks.length);
  });
}
