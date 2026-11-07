/// BSSID glob: `*` = 0+ hex digits, `?` = 1 hex digit.
/// Separators (`:` / `-`) are ignored so `A8:9D:21:*` matches `a8:9d:21:74:24:3e`.
const _hex = r'[0-9a-f]';

String compactHex(String value) =>
    value.toLowerCase().replaceAll(RegExp(r'[:\-]'), '');

bool patternHasWildcard(String pattern) => RegExp(r'[*?]').hasMatch(pattern);

String compactPattern(String pattern) =>
    pattern.trim().toLowerCase().replaceAll(RegExp(r'[:\-]'), '');

int patternSpecificity(String pattern) {
  final compact = compactPattern(pattern);
  if (compact.isEmpty) return -1;
  final wild = RegExp(r'[*?]').allMatches(compact).length;
  final literal = compact.replaceAll(RegExp(r'[*?]'), '').length;
  final exactBonus = patternHasWildcard(pattern) ? 0 : 1000000;
  return exactBonus + literal * 10 - wild;
}

RegExp? _globToRegExp(String compactGlob) {
  if (compactGlob.isEmpty) return null;
  final buffer = StringBuffer('^');
  for (final ch in compactGlob.split('')) {
    if (ch == '*') {
      buffer.write('$_hex*');
    } else if (ch == '?') {
      buffer.write(_hex);
    } else if (RegExp(r'[0-9a-f]').hasMatch(ch)) {
      buffer.write(ch);
    } else {
      return null;
    }
  }
  buffer.write(r'$');
  return RegExp(buffer.toString());
}

/// True when [bssid] matches [pattern] (exact or `*` / `?`).
bool matchBssidPattern(String pattern, String bssid) {
  final hex = compactHex(bssid);
  if (!RegExp(r'^[0-9a-f]{12}$').hasMatch(hex)) return false;

  final glob = compactPattern(pattern);
  if (glob.isEmpty) return false;

  if (!patternHasWildcard(pattern)) {
    return glob == hex;
  }

  final re = _globToRegExp(glob);
  return re != null && re.hasMatch(hex);
}
