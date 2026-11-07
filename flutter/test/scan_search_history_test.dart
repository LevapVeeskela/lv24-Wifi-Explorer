import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_search/scan_search_history.dart';
import 'package:lv24_wifi_explorer/features/scan_search/scan_search_history_storage_key.dart';

void main() {
  test('storage key matches Electron localStorage id', () {
    expect(
      scanSearchHistoryStorageKey,
      'lv24.wifi-explorer.search-history',
    );
    expect(scanSearchHistoryMaxEntries, 10);
    expect(scanSearchHistoryFileName, scanSearchHistoryStorageKey);
  });

  group('pushScanSearchHistory', () {
    test('ignores blank queries', () {
      const history = ['LV24'];
      expect(pushScanSearchHistory(history, '   '), history);
    });

    test('prepends and dedupes', () {
      expect(
        pushScanSearchHistory(['b', 'a'], 'c'),
        ['c', 'b', 'a'],
      );
      expect(
        pushScanSearchHistory(['b', 'a'], 'a'),
        ['a', 'b'],
      );
    });

    test('caps at max entries', () {
      final seed = List.generate(
        scanSearchHistoryMaxEntries,
        (i) => 'q$i',
      );
      final next = pushScanSearchHistory(seed, 'new');
      expect(next.length, scanSearchHistoryMaxEntries);
      expect(next.first, 'new');
      expect(next.last, 'q${scanSearchHistoryMaxEntries - 2}');
    });
  });

  group('filterScanSearchHistoryForAutocomplete', () {
    const history = ['LV24-Lab', 'open OR 5ghz', 'bssid:aa:bb'];

    test('returns full history when field is empty', () {
      expect(filterScanSearchHistoryForAutocomplete(history, ''), history);
      expect(filterScanSearchHistoryForAutocomplete(history, '  '), history);
    });

    test('filters case-insensitively by substring', () {
      expect(
        filterScanSearchHistoryForAutocomplete(history, 'lv24'),
        ['LV24-Lab'],
      );
      expect(
        filterScanSearchHistoryForAutocomplete(history, '5ghz'),
        ['open OR 5ghz'],
      );
    });
  });

  group('scanSearchHistoryFromJson', () {
    test('parses string list and skips invalid rows', () {
      expect(
        scanSearchHistoryFromJson([' a ', '', 3, 'b']),
        ['a', 'b'],
      );
    });
  });
}
