/// Matches Electron localStorage id for scan search recents.
const scanSearchHistoryStorageKey = 'lv24.wifi-explorer.search-history';

/// Desktop config filename — same id as other Flutter prefs / Electron key.
const scanSearchHistoryFileName = scanSearchHistoryStorageKey;

/// Older desktop filename; still read if the key-named file is absent.
const scanSearchHistoryLegacyFileName = 'search-history.json';

/// Maximum recent queries kept in memory and on disk.
const scanSearchHistoryMaxEntries = 10;
