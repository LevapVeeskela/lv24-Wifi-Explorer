import 'package:flutter_test/flutter_test.dart';
import 'package:scan_domain/scan_domain.dart';
import 'package:scan_l10n/scan_l10n.dart';

import 'package:lv24_wifi_explorer/features/ie_view/ie_l10n.dart';

List<int> _tlv(int id, List<int> payload) => [id, payload.length, ...payload];

void main() {
  group('scan_domain IE decode (Flutter consumer)', () {
    test('TIM / Power Constraint / Ext Caps / WPA / EHT / buildIeTree', () {
      final extCap = List<int>.filled(4, 0)..[0] = 1 << 4;
      const wpaBody = <int>[
        0x00, 0x50, 0xf2, 0x01, 0x01, 0x00, 0x00, 0x0f, 0xac, 0x04, 0x01, 0x00,
        0x00, 0x0f, 0xac, 0x04, 0x01, 0x00, 0x00, 0x0f, 0xac, 0x02,
      ];
      final afterExt = List<int>.filled(13, 0);
      var rx = 0;
      for (var i = 0; i < 8; i += 1) {
        final bits = i < 2 ? 2 : 3;
        rx |= bits << (i * 2);
      }
      afterExt[11] = rx & 0xff;
      afterExt[12] = (rx >> 8) & 0xff;

      final result = decodeInformationElements([
        ..._tlv(5, [2, 3, 0x00, 0xff]),
        ..._tlv(32, [4]),
        ..._tlv(127, extCap),
        ..._tlv(221, wpaBody),
        ..._tlv(255, [108, ...afterExt]),
      ]);

      expect(result.elements.map((e) => e.kind), [
        IeKind.tim,
        IeKind.powerConstraint,
        IeKind.extendedCapabilities,
        IeKind.vendorWpa,
        IeKind.ehtCapabilities,
      ]);
      expect(result.shallow.wpaVendorIe, isTrue);
      expect(result.shallow.ehtCapabilities, isTrue);

      final tree = buildIeTree(result);
      expect(tree.first.label, 'Parse level');
      expect(tree.any((n) => n.label.startsWith('TIM')), isTrue);
      expect(tree.any((n) => n.label.startsWith('Power Constraint')), isTrue);
      expect(tree.any((n) => n.label.startsWith('EHT Capabilities')), isTrue);
    });

    test('tree labels localize via scan_l10n', () {
      final result = decodeInformationElements(_tlv(0, [0x78]));
      final tree = buildIeTree(result);
      final ru = ScanL10n(ScanLocale.ru);
      final en = ScanL10n(ScanLocale.en);
      expect(localizeIeTreeLabel(en, tree.first), 'Parse level');
      expect(localizeIeTreeLabel(ru, tree.first), 'Уровень разбора');
      expect(localizeIeTreeValue(ru, 'yes'), 'да');
      expect(localizeIeTreeValue(en, 'shallow-tags'), 'shallow-tags');
    });
  });
}
