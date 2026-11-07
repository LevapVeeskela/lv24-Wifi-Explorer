import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_search/scan_search.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_networks.dart';
import 'package:scan_domain/scan_domain.dart';

void main() {
  late List<ObservedBss> networks;
  late ObservedBss lab;
  late ObservedBss guest;
  late ObservedBss harbor;
  late ObservedBss studio;
  late ObservedBss hidden;
  late ObservedBss ciscoLab;

  setUp(() {
    networks = bundledDemoObservedBss();
    lab = _bySsid(networks, 'LV24-Lab');
    guest = _bySsid(networks, 'Sunset-Guest');
    harbor = _bySsid(networks, 'Harbor-IoT');
    studio = _bySsid(networks, 'Studio-6');
    hidden = _hidden(networks);
    ciscoLab = _withVendor(lab, 'Cisco Systems');
  });

  group('parseScanQuery', () {
    test('empty query is match-all', () {
      final r = parseScanQuery('   ');
      expect(r, isA<ParseScanQueryOk>());
      expect((r as ParseScanQueryOk).ast.type, ScanQueryAstType.all);
    });

    test('rejects unclosed quote', () {
      expect(parseScanQuery('"foo'), isA<ParseScanQueryErr>());
    });

    test('rejects trailing boolean operator', () {
      expect(parseScanQuery('LV24 AND'), isA<ParseScanQueryErr>());
    });

    test('parses implicit AND', () {
      final r = parseScanQuery('hidden 5ghz');
      expect(r, isA<ParseScanQueryOk>());
      final ast = (r as ParseScanQueryOk).ast;
      expect(ast.type, ScanQueryAstType.boolNode);
      expect(ast.boolOp, 'and');
    });

    test('parses keyed signal compare', () {
      final r = parseScanQuery('signal>=-60');
      expect(r, isA<ParseScanQueryOk>());
      final pred = (r as ParseScanQueryOk).ast.pred;
      expect(pred?.kind, ScanPredicateKind.keyed);
      expect(pred?.keyedField, 'signal');
      expect(pred?.compareOp, CompareOp.gte);
      expect(pred?.keyedValue, '-60');
    });

    test('parses compare-only RSSI and quoted phrase', () {
      final cmp = parseScanQuery('>=-50');
      expect(cmp, isA<ParseScanQueryOk>());
      expect(
        (cmp as ParseScanQueryOk).ast.pred?.kind,
        ScanPredicateKind.signal,
      );

      final phrase = parseScanQuery('"LV24-Lab"');
      expect(phrase, isA<ParseScanQueryOk>());
      expect(
        (phrase as ParseScanQueryOk).ast.pred?.kind,
        ScanPredicateKind.phrase,
      );
    });

    test('bare digit-leading MAC prefix is a single bssid token', () {
      final prefix = parseScanQuery('3c:5a') as ParseScanQueryOk;
      expect(prefix.ast.type, ScanQueryAstType.pred);
      expect(prefix.ast.pred?.kind, ScanPredicateKind.bssidOctet);
      expect(prefix.ast.pred?.bssidFragment, '3c:5a');

      final full = parseScanQuery('3c:5a:b0:11:22:33') as ParseScanQueryOk;
      expect(full.ast.type, ScanQueryAstType.pred);
      expect(full.ast.pred?.kind, ScanPredicateKind.bssidOctet);
      expect(full.ast.pred?.bssidFragment, '3c:5a:b0:11:22:33');
    });

    test('bare digits stay channel queries', () {
      final ch3 = parseScanQuery('3') as ParseScanQueryOk;
      expect(ch3.ast.type, ScanQueryAstType.pred);
      expect(ch3.ast.pred?.kind, ScanPredicateKind.channel);
      expect(ch3.ast.pred?.channel, 3);

      final ch36 = parseScanQuery('36') as ParseScanQueryOk;
      expect(ch36.ast.type, ScanQueryAstType.pred);
      expect(ch36.ast.pred?.kind, ScanPredicateKind.channel);
      expect(ch36.ast.pred?.channel, 36);
    });

    test('hyphenated IEEE MAC is a single bssid token; digit ranges stay channels', () {
      final prefix = parseScanQuery('3c-5a') as ParseScanQueryOk;
      expect(prefix.ast.type, ScanQueryAstType.pred);
      expect(prefix.ast.pred?.kind, ScanPredicateKind.bssidOctet);
      expect(prefix.ast.pred?.bssidFragment, '3c-5a');

      final full = parseScanQuery('3c-5a-b0-11-22-33') as ParseScanQueryOk;
      expect(full.ast.type, ScanQueryAstType.pred);
      expect(full.ast.pred?.kind, ScanPredicateKind.bssidOctet);
      expect(full.ast.pred?.bssidFragment, '3c-5a-b0-11-22-33');

      final range = parseScanQuery('36-48') as ParseScanQueryOk;
      expect(range.ast.pred?.kind, ScanPredicateKind.channelRange);
    });

    test('parses channel range and band shortcut', () {
      final range = parseScanQuery('36-48');
      expect(range, isA<ParseScanQueryOk>());
      expect(
        (range as ParseScanQueryOk).ast.pred?.kind,
        ScanPredicateKind.channelRange,
      );

      final band = parseScanQuery('5ghz');
      expect(band, isA<ParseScanQueryOk>());
      expect((band as ParseScanQueryOk).ast.pred?.kind, ScanPredicateKind.band);
      expect((band as ParseScanQueryOk).ast.pred?.band, 5);
    });
  });

  group('matchesScanSearch — keywords and phrases', () {
    test('keyword contains ssid/vendor (case insensitive)', () {
      expect(matchesScanSearch(ciscoLab, 'lab'), isTrue);
      expect(matchesScanSearch(ciscoLab, 'CISCO'), isTrue);
      expect(matchesScanSearch(ciscoLab, 'nokia'), isFalse);
    });

    test('phrase requires exact field match', () {
      expect(matchesScanSearch(lab, '"LV24-Lab"'), isTrue);
      expect(matchesScanSearch(lab, '"lv24-lab"'), isTrue);
      expect(matchesScanSearch(lab, '"LV24"'), isFalse);
    });

    test('annotation participates in keyword search', () {
      expect(
        matchesScanSearch(
          lab,
          'lab-ap',
          context: const ScanSearchMatchContext(annotation: 'lab-ap-01'),
        ),
        isTrue,
      );
      expect(matchesScanSearch(lab, 'lab-ap'), isFalse);
    });
  });

  group('matchesScanSearch — boolean logic', () {
    test('AND combines predicates', () {
      expect(matchesScanSearch(lab, 'LV24 AND 5ghz'), isTrue);
      expect(matchesScanSearch(lab, 'LV24 AND 2.4ghz'), isFalse);
    });

    test('OR matches when either side matches', () {
      expect(matchesScanSearch(lab, 'open OR ssid:LV24-Lab'), isTrue);
      expect(matchesScanSearch(guest, 'open OR ssid:LV24-Lab'), isTrue);
      expect(matchesScanSearch(guest, 'ssid:LV24-Lab OR ssid:Harbor-IoT'), isFalse);
    });

    test('NOT negates predicate', () {
      expect(matchesScanSearch(lab, 'NOT open'), isTrue);
      expect(matchesScanSearch(guest, 'NOT open'), isFalse);
    });

    test('parentheses group OR before AND', () {
      expect(
        matchesScanSearch(lab, '(open OR ssid:LV24-Lab) AND 5ghz'),
        isTrue,
      );
      expect(
        matchesScanSearch(guest, '(open OR ssid:LV24-Lab) AND 5ghz'),
        isFalse,
      );
    });

    test('implicit AND between adjacent terms', () {
      expect(matchesScanSearch(lab, 'hidden 5ghz'), isFalse);
      expect(matchesScanSearch(hidden, 'hidden 5ghz'), isTrue);
    });
  });

  group('matchesScanSearch — shortcuts', () {
    test('band shortcuts', () {
      expect(matchesScanSearch(guest, '2.4ghz'), isTrue);
      expect(matchesScanSearch(lab, '2.4ghz'), isFalse);
      expect(matchesScanSearch(lab, '5ghz'), isTrue);
      expect(matchesScanSearch(lab, '5'), isFalse);
    });

    test('width and channel', () {
      expect(matchesScanSearch(guest, '20mhz'), isTrue);
      expect(matchesScanSearch(lab, '80'), isTrue);
      expect(matchesScanSearch(lab, '36'), isTrue);
      expect(matchesScanSearch(lab, '36-48'), isTrue);
      expect(matchesScanSearch(hidden, '36-48'), isFalse);
    });

    test('bssid octet fragments', () {
      expect(matchesScanSearch(guest, 'aa:'), isTrue);
      expect(matchesScanSearch(guest, 'aa:10:'), isTrue);
      expect(matchesScanSearch(guest, ':01'), isTrue);
      expect(matchesScanSearch(lab, 'aa:'), isFalse);
    });

    test('digit-leading bare MAC matches without bssid:', () {
      expect(matchesScanSearch(lab, '3c:5a'), isTrue);
      expect(matchesScanSearch(lab, '3c:5a:b4:10:01:01'), isTrue);
      expect(matchesScanSearch(lab, '3c:5a:b0:11:22:33'), isFalse);
      expect(matchesScanSearch(guest, '3c:5a'), isFalse);
    });

    test('hyphenated IEEE MAC matches colon BSSID; 36-48 stays a channel range', () {
      expect(matchesScanSearch(lab, '3c-5a'), isTrue);
      expect(matchesScanSearch(lab, '3c-5a-b4-10-01-01'), isTrue);
      expect(matchesScanSearch(lab, '3c-5a-b0-11-22-33'), isFalse);
      expect(matchesScanSearch(guest, '3c-5a'), isFalse);
      expect(matchesScanSearch(lab, '36-48'), isTrue);
      expect(matchesScanSearch(hidden, '36-48'), isFalse);
    });

    test('bare channel digits still match channel', () {
      expect(matchesScanSearch(lab, '36'), isTrue);
      expect(matchesScanSearch(lab, '3'), isFalse);
    });

    test('RSSI comparison without key', () {
      expect(matchesScanSearch(lab, '>=-50'), isTrue);
      expect(matchesScanSearch(lab, '>=-40'), isFalse);
      expect(matchesScanSearch(guest, '>=-50'), isFalse);
    });

    test('security tokens', () {
      expect(matchesScanSearch(guest, 'open'), isTrue);
      expect(matchesScanSearch(lab, 'open'), isFalse);
      expect(matchesScanSearch(lab, 'secure'), isTrue);
      expect(matchesScanSearch(lab, 'wpa2'), isTrue);
      expect(matchesScanSearch(studio, 'wpa3'), isTrue);
    });

    test('hidden shortcut', () {
      expect(matchesScanSearch(hidden, 'hidden'), isTrue);
      expect(matchesScanSearch(hidden, '<hidden>'), isTrue);
      expect(matchesScanSearch(lab, 'hidden'), isFalse);
    });
  });

  group('matchesScanSearch — keyed fields', () {
    test('ssid, bssid, vendor, channel, band', () {
      expect(matchesScanSearch(lab, 'ssid:lv24'), isTrue);
      expect(matchesScanSearch(lab, 'ssid=LV24-Lab'), isTrue);
      expect(matchesScanSearch(lab, 'bssid:3c:5a:b4'), isTrue);
      expect(matchesScanSearch(guest, 'bssid:3c:5a:b4'), isFalse);
      expect(matchesScanSearch(ciscoLab, 'vendor:cisco'), isTrue);
      expect(matchesScanSearch(lab, 'channel:36'), isTrue);
      expect(matchesScanSearch(lab, 'band:5'), isTrue);
      expect(matchesScanSearch(guest, 'band:2.4'), isTrue);
    });

    test('snr, signal, and noise comparisons', () {
      expect(matchesScanSearch(lab, 'snr>=40'), isTrue);
      expect(matchesScanSearch(lab, 'snr>=50'), isFalse);
      expect(matchesScanSearch(lab, 'signal>=-50'), isTrue);
      expect(matchesScanSearch(lab, 'signal>=-40'), isFalse);
      expect(matchesScanSearch(lab, 'noise<=-90'), isTrue);
      expect(matchesScanSearch(lab, 'noise<=-100'), isFalse);
    });

    test('mode and country', () {
      expect(matchesScanSearch(studio, 'mode:ax'), isTrue);
      expect(matchesScanSearch(lab, 'mode:ax'), isFalse);
      expect(matchesScanSearch(harbor, 'country:FI'), isTrue);
      expect(matchesScanSearch(lab, 'country:FI'), isFalse);
      expect(matchesScanSearch(lab, 'country:RU'), isTrue);
    });
  });

  group('matchesScanSearch — phy and generation', () {
    test('phy shortcuts', () {
      expect(matchesScanSearch(studio, 'ax'), isTrue);
      expect(matchesScanSearch(lab, '802.11ac'), isTrue);
      expect(matchesScanSearch(guest, '802.11ac'), isFalse);
    });

    test('generation', () {
      expect(matchesScanSearch(studio, 'wifi6'), isTrue);
      expect(matchesScanSearch(studio, 'wifi6e'), isTrue);
      expect(matchesScanSearch(lab, 'wifi6e'), isFalse);
      expect(matchesScanSearch(lab, 'wifi5'), isTrue);
      expect(matchesScanSearch(guest, 'wifi4'), isTrue);
    });
  });

  group('matchesScanSearch — parse failure fallback', () {
    test('invalid DSL does not throw', () {
      expect(parseScanQuery('('), isA<ParseScanQueryErr>());
      expect(() => matchesScanSearch(lab, '('), returnsNormally);
    });

    test('falls back to haystack contains', () {
      const broken = '3c:5a:b4:10:01:01 (';
      expect(parseScanQuery(broken), isA<ParseScanQueryErr>());
      expect(matchesScanSearch(lab, broken), isFalse);
      expect(matchesScanSearch(lab, 'bssid:3c:5a:b4:10:01:01'), isTrue);
      expect(matchesScanSearch(guest, 'aa:10:20:30:40:01'), isTrue);
    });

    test('malformed query rejects DSL parse without breaking search', () {
      expect(parseScanQuery('bssid:3c:5a:b4 AND'), isA<ParseScanQueryErr>());
      expect(parseScanQuery('LV24-Lab'), isA<ParseScanQueryOk>());
      expect(matchesScanSearch(lab, 'LV24-Lab'), isTrue);
    });

    test('fallback haystack includes annotation text', () {
      const broken = 'lab-note (';
      expect(parseScanQuery(broken), isA<ParseScanQueryErr>());
      expect(
        matchesScanSearch(
          lab,
          broken,
          context: const ScanSearchMatchContext(annotation: 'lab-note ('),
        ),
        isTrue,
      );
    });
  });
}

ObservedBss _bySsid(List<ObservedBss> rows, String ssid) {
  return rows.firstWhere((r) => r.lastRaw.ssid == ssid);
}

ObservedBss _hidden(List<ObservedBss> rows) {
  return rows.firstWhere((r) => r.lastRaw.ssid == null);
}

ObservedBss _withVendor(ObservedBss base, String organization) {
  return ObservedBss(
    identity: base.identity,
    ibss: base.ibss,
    countryCode: base.countryCode,
    beaconIntervalMs: base.beaconIntervalMs,
    signal: base.signal,
    channel: base.channel,
    security: base.security,
    phy: base.phy,
    maxRate: base.maxRate,
    vendor: VendorView(
      oui: base.vendor.oui,
      locallyAdministered: base.vendor.locallyAdministered,
      multicast: base.vendor.multicast,
      organization: organization,
      match: base.vendor.match,
    ),
    ie: base.ie,
    presence: base.presence,
    rssiHistory: base.rssiHistory,
    lastRaw: base.lastRaw,
  );
}
