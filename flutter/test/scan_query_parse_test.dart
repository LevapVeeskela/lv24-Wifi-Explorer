import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_search/parse_scan_query.dart';
import 'package:lv24_wifi_explorer/features/scan_search/scan_query_ast.dart';

void main() {
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
      expect(range.ast.type, ScanQueryAstType.pred);
      expect(range.ast.pred?.kind, ScanPredicateKind.channelRange);
      expect(range.ast.pred?.channelFrom, 36);
      expect(range.ast.pred?.channelTo, 48);
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

    test('parses AND/OR/NOT with parentheses', () {
      final r = parseScanQuery('(open OR ssid:LV24-Lab) AND 5ghz');
      expect(r, isA<ParseScanQueryOk>());
      final ast = (r as ParseScanQueryOk).ast;
      expect(ast.type, ScanQueryAstType.boolNode);
      expect(ast.boolOp, 'and');
    });
  });
}
