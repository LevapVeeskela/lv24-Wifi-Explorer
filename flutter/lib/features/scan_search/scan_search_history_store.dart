import 'scan_search_history_store_io.dart'
    if (dart.library.html) 'scan_search_history_store_stub.dart';

export 'scan_search_history_store_io.dart'
    if (dart.library.html) 'scan_search_history_store_stub.dart';

Future<List<String>> loadScanSearchHistory() => readScanSearchHistory();

Future<void> persistScanSearchHistory(List<String> queries) =>
    writeScanSearchHistory(queries);
