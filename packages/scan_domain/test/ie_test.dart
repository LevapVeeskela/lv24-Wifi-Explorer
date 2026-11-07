import 'dart:convert';

import 'package:scan_domain/scan_domain.dart';
import 'package:test/test.dart';

List<int> tlv(int id, List<int> payload) => [id, payload.length, ...payload];

List<int> htCapabilitiesIe(int nss) {
  final mcs = List<int>.filled(16, 0);
  for (var i = 0; i < nss; i += 1) {
    mcs[i] = 0xff;
  }
  return tlv(45, [0x00, 0x00, 0x00, ...mcs]);
}

List<int> htOperationIe(int primary, int secondary) {
  final offsetBits = secondary == 1
      ? 1
      : secondary == -1
          ? 3
          : 0;
  return tlv(61, [primary, offsetBits]);
}

List<int> vhtCapabilitiesIe(int nss, [int maxMcsBits = 2]) {
  var rx = 0;
  for (var i = 0; i < 8; i += 1) {
    final bits = i < nss ? maxMcsBits : 3;
    rx |= bits << (i * 2);
  }
  return tlv(191, [0, 0, 0, 0, rx & 0xff, (rx >> 8) & 0xff, 0, 0, 0, 0, 0, 0]);
}

List<int> vhtOperationIe(int ccfs0, [int widthCode = 1]) {
  return tlv(192, [widthCode, ccfs0, 0]);
}

List<int> heCapabilitiesIe(int nss, [int maxMcsBits = 2]) {
  final afterExt = List<int>.filled(19, 0);
  var rx = 0;
  for (var i = 0; i < 8; i += 1) {
    final bits = i < nss ? maxMcsBits : 3;
    rx |= bits << (i * 2);
  }
  afterExt[17] = rx & 0xff;
  afterExt[18] = (rx >> 8) & 0xff;
  return tlv(255, [35, ...afterExt]);
}

List<int> heOperationIe([int color = 7]) {
  return tlv(255, [36, 0, 0, 0, color & 0x3f, 0, 0]);
}

const rsnWpa2PskCcmp = <int>[
  0x01, 0x00, 0x00, 0x0f, 0xac, 0x04, 0x01, 0x00, 0x00, 0x0f, 0xac, 0x04, 0x01,
  0x00, 0x00, 0x0f, 0xac, 0x02, 0x80, 0x00,
];

void main() {
  group('decodeInformationElements', () {
    test('is absent when bytes are missing', () {
      expect(decodeInformationElements(null).level, IeParseLevel.absent);
      expect(decodeInformationElements(<int>[]).level, IeParseLevel.absent);
      expect(parseShallowIe(null).level, 'absent');
    });

    test('is raw-only when the buffer is not a complete TLV', () {
      final result = decodeInformationElements([48, 20]);
      expect(result.level, IeParseLevel.rawOnly);
      expect(result.elements, isEmpty);
    });

    test('decodes SSID(0), including hidden empty', () {
      final visible = decodeInformationElements(
        tlv(0, utf8.encode('LV24')),
      );
      final ssid = visible.elements[0];
      expect(ssid.kind, IeKind.ssid);
      expect(ssid.ssid, 'LV24');
      expect(ssid.hidden, isFalse);

      final hidden = decodeInformationElements(tlv(0, []));
      expect(hidden.elements[0].kind, IeKind.ssid);
      expect(hidden.elements[0].hidden, isTrue);
      expect(hidden.elements[0].ssid, '');
    });

    test('decodes Rates(1/50) with basic bit = 500 kbps units', () {
      final rates = decodeInformationElements([
        ...tlv(1, [0x8c, 0x12]),
        ...tlv(50, [0x24]),
      ]);
      final basic = rates.elements.firstWhere((e) => e.id == 1);
      final ext = rates.elements.firstWhere((e) => e.id == 50);
      expect(basic.kind, IeKind.rates);
      expect(basic.ratesMbps, [6, 9]);
      expect(basic.basicRatesMbps, [6]);
      expect(ext.kind, IeKind.rates);
      expect(ext.ratesMbps, [18]);
      expect(ext.basicRatesMbps, isEmpty);
    });

    test('decodes DS(3), Country(7), BSS Load(11)', () {
      final buf = [
        ...tlv(3, [6]),
        ...tlv(7, [0x52, 0x55, 0x20, 1, 13, 20]),
        ...tlv(11, [0x04, 0x00, 51, 0x00, 0x00]),
      ];
      final result = decodeInformationElements(buf);
      expect(result.elements[0].kind, IeKind.ds);
      expect(result.elements[0].channel, 6);
      expect(result.elements[1].kind, IeKind.country);
      expect(result.elements[1].countryCode, 'RU');
      expect(result.elements[1].triplets, hasLength(1));
      expect(result.elements[1].triplets[0].firstChannel, 1);
      expect(result.elements[1].triplets[0].channelCount, 13);
      expect(result.elements[1].triplets[0].maxTxPowerDbm, 20);
      final load = result.elements[2];
      expect(load.kind, IeKind.bssLoad);
      expect(load.stationCount, 4);
      expect(load.channelUtilization, 51);
      expect(load.channelUtilPct, closeTo((51 * 100) / 255, 0.0001));
      expect(result.shallow.countryFromIe, 'RU');
    });

    test('decodes HT Cap(45), RSN(48), HT Op(61)', () {
      final buf = [
        ...htCapabilitiesIe(2),
        ...tlv(48, rsnWpa2PskCcmp),
        ...htOperationIe(36, 1),
      ];
      final result = decodeInformationElements(buf);
      final ht = result.elements.firstWhere((e) => e.kind == IeKind.htCapabilities);
      final rsn = result.elements.firstWhere((e) => e.kind == IeKind.rsn);
      final op = result.elements.firstWhere((e) => e.kind == IeKind.htOperation);
      expect(ht.nss, 2);
      expect(rsn.rsnVersion, 1);
      expect(rsn.groupCipher?.name, CipherName.ccmp128);
      expect(rsn.groupCipher?.oui, '00:0f:ac');
      expect(rsn.mfpc, isTrue);
      expect(rsn.mfpr, isFalse);
      expect(rsn.pairwise.map((s) => s.name), [CipherName.ccmp128]);
      expect(rsn.akm.map((s) => s.name), [AkmName.psk]);
      expect(op.primaryChannel, 36);
      expect(op.secondaryOffset, 1);
      expect(result.shallow.nssHint, 2);
      expect(result.shallow.rsnIe, isTrue);
      expect(result.shallow.htPrimaryChannel, 36);
      expect(result.shallow.htSecondaryOffset, 1);
    });

    test('decodes VHT Cap/Op 191/192', () {
      final result = decodeInformationElements([
        ...vhtCapabilitiesIe(2),
        ...vhtOperationIe(42, 1),
      ]);
      expect(result.elements[0].kind, IeKind.vhtCapabilities);
      expect(result.elements[0].nss, 2);
      expect(result.elements[0].maxMcs, 9);
      expect(result.elements[1].kind, IeKind.vhtOperation);
      expect(result.elements[1].widthMhz, 80);
      expect(result.elements[1].ccfs0, 42);
      expect(result.shallow.ccfs0, 42);
      expect(result.shallow.vhtCapabilities, isTrue);
    });

    test('decodes RSNX 244 (SAE H2E bit)', () {
      final result = decodeInformationElements(tlv(244, [1 << 5]));
      expect(result.elements[0].kind, IeKind.rsnx);
      expect(result.elements[0].saeHashToElement, isTrue);
    });

    test('decodes HE 255/35-36 shallow', () {
      final result = decodeInformationElements([
        ...heCapabilitiesIe(2),
        ...heOperationIe(12),
      ]);
      expect(result.elements[0].kind, IeKind.heCapabilities);
      expect(result.elements[0].nss, 2);
      expect(result.elements[0].maxMcs, 11);
      expect(result.elements[0].extId, 35);
      expect(result.elements[1].kind, IeKind.heOperation);
      expect(result.elements[1].bssColor, 12);
      expect(result.elements[1].extId, 36);
      expect(result.shallow.heCapabilities, isTrue);
      expect(result.shallow.nssHint, 2);
    });

    test('decodes vendor 221 as WPA 00:50:f2', () {
      const wpaBody = <int>[
        0x00, 0x50, 0xf2, 0x01, 0x01, 0x00, 0x00, 0x0f, 0xac, 0x04, 0x01, 0x00,
        0x00, 0x0f, 0xac, 0x04, 0x01, 0x00, 0x00, 0x0f, 0xac, 0x02,
      ];
      final result = decodeInformationElements(tlv(221, wpaBody));
      expect(result.elements[0].kind, IeKind.vendorWpa);
      expect(result.elements[0].oui, '00:50:f2');
      expect(result.elements[0].wpaVersion, 1);
      expect(result.elements[0].groupCipher?.name, CipherName.ccmp128);
      expect(result.shallow.wpaVendorIe, isTrue);
    });

    test('decodes TIM(5), Power Constraint(32), Extended Capabilities(127)', () {
      final extCap = List<int>.filled(4, 0);
      extCap[0] = 1 << 4;
      final buf = [
        ...tlv(5, [2, 3, 0x00, 0xff]),
        ...tlv(32, [4]),
        ...tlv(127, extCap),
      ];
      final result = decodeInformationElements(buf);
      expect(result.elements[0].kind, IeKind.tim);
      expect(result.elements[0].dtimCount, 2);
      expect(result.elements[0].dtimPeriod, 3);
      expect(result.elements[0].partialBitmapLength, 1);
      expect(result.elements[1].kind, IeKind.powerConstraint);
      expect(result.elements[1].localPowerConstraintDb, 4);
      final ext = result.elements[2];
      expect(ext.kind, IeKind.extendedCapabilities);
      expect(ext.setFlags.any((f) => f.name == 'BSS transition'), isTrue);
    });

    test('decodes EHT Capabilities 255/108 when MCS map present', () {
      final afterExt = List<int>.filled(13, 0);
      var rx = 0;
      for (var i = 0; i < 8; i += 1) {
        final bits = i < 2 ? 2 : 3;
        rx |= bits << (i * 2);
      }
      afterExt[11] = rx & 0xff;
      afterExt[12] = (rx >> 8) & 0xff;
      final result = decodeInformationElements(tlv(255, [108, ...afterExt]));
      expect(result.elements[0].kind, IeKind.ehtCapabilities);
      expect(result.elements[0].extId, 108);
      expect(result.elements[0].nss, 2);
      expect(result.elements[0].maxMcs, 13);
      expect(result.shallow.ehtCapabilities, isTrue);
    });

    test('buildIeTree lists meta and decoded fields', () {
      final result = decodeInformationElements(tlv(0, utf8.encode('x')));
      final tree = buildIeTree(result);
      expect(tree[0].label, 'Parse level');
      expect(tree[0].messageKey, 'scan.ie.parseLevel');
      expect(tree.any((n) => n.label.startsWith('SSID')), isTrue);
      final ssid = tree.firstWhere((n) => n.label.startsWith('SSID'));
      expect(ssid.children.any((c) => c.label == 'SSID' && c.value == 'x'), isTrue);
    });

    test('unknown IE is id + hex, no invented name', () {
      const payload = [0xde, 0xad];
      final result = decodeInformationElements(tlv(42, payload));
      final el = result.elements[0];
      expect(el.id, 42);
      expect(el.extId, isNull);
      expect(el.kind, IeKind.unknown);
      expect(el.raw, payload);
      expect(el.rawHex, 'dead');
      expect(ieTreeTitle(200, null), 'Element (200)');
    });

    test('unknown extension IE keeps extId + hex', () {
      const payload = [99, 0xaa];
      final result = decodeInformationElements(tlv(255, payload));
      expect(result.elements[0].kind, IeKind.unknown);
      expect(result.elements[0].id, 255);
      expect(result.elements[0].extId, 99);
      expect(result.elements[0].rawHex, '63aa');
    });

    test('toHex is lowercase without separators', () {
      expect(toHex([0xde, 0xad]), 'dead');
    });
  });
}
