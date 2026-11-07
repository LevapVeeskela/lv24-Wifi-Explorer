import 'scan_query_ast.dart';

const _widthMhz = {20, 40, 80, 160};

const _securityWords = <String, String>{
  'open': 'open',
  'secure': 'secure',
  'wep': 'wep',
  'wpa': 'wpa',
  'wpa2': 'wpa2',
  'wpa3': 'wpa3',
  'owe': 'owe',
  '802.1x': '802.1x',
  'psk': 'psk',
  'sae': 'sae',
};

const _phyWords = <String, String>{
  'a': 'a',
  'b': 'b',
  'g': 'g',
  'n': 'n',
  'ac': 'ac',
  'ax': 'ax',
  'be': 'be',
  '11n': '11n',
  '11ac': '11ac',
  '11ax': '11ax',
  '11be': '11be',
  '802.11a': '802.11a',
  '802.11b': '802.11b',
  '802.11g': '802.11g',
  '802.11n': '802.11n',
  '802.11ac': '802.11ac',
  '802.11ax': '802.11ax',
  '802.11be': '802.11be',
};

const _generationWords = {'wifi4', 'wifi5', 'wifi6', 'wifi6e', 'wifi7'};

const _hiddenLiterals = {
  'hidden',
  '\u0000',
  '<hidden>',
  '«скрытая»',
  'скрытая',
  '‹hidden›',
  '‹скрытая›',
};

const keyedFields = {
  'ssid',
  'bssid',
  'vendor',
  'channel',
  'width',
  'band',
  'snr',
  'signal',
  'noise',
  'country',
  'mode',
};

String _fold(String word) => word.trim().toLowerCase();

/// Colon or hyphen IEEE MAC / prefix (`3c:5a`, `3c-5a-b0-11-22-33`).
/// Two all-digit hyphen parts (`36-48`) stay a channel range, not a BSSID.
/// Bare hex without a separator (`3c`) is not a BSSID (ambiguous with channel).
bool isBssidOctetToken(String raw) {
  final w = raw.toLowerCase();
  final hasColon = w.contains(':');
  final hasHyphen = w.contains('-');
  if (hasColon == hasHyphen) return false;
  final sep = hasColon ? ':' : '-';
  final charset = hasColon
      ? RegExp(r'^[0-9a-f:]+$', caseSensitive: false)
      : RegExp(r'^[0-9a-f-]+$', caseSensitive: false);
  if (!charset.hasMatch(w)) return false;
  final parts = w.split(sep).where((p) => p.isNotEmpty).toList();
  if (parts.isEmpty) return true;
  if (!parts.every(
    (p) => p.length <= 2 && RegExp(r'^[0-9a-f]*$', caseSensitive: false).hasMatch(p),
  )) {
    return false;
  }
  if (hasHyphen && parts.length == 2 && parts.every((p) => RegExp(r'^\d+$').hasMatch(p))) {
    return false;
  }
  return true;
}

ScanPredicate? _parseBandWord(String raw) {
  final w = _fold(raw);
  if (w == '2.4' || w == '2.4ghz' || w == '24ghz') {
    return ScanPredicate(kind: ScanPredicateKind.band, band: 2.4);
  }
  if (w == '5ghz') {
    return ScanPredicate(kind: ScanPredicateKind.band, band: 5);
  }
  if (w == '6ghz') {
    return ScanPredicate(kind: ScanPredicateKind.band, band: 6);
  }
  return null;
}

ScanPredicate? _parseWidthWord(String raw) {
  final w = _fold(raw);
  final m = RegExp(r'^(\d+)mhz$').firstMatch(w);
  if (m != null) {
    final n = int.parse(m.group(1)!);
    if (_widthMhz.contains(n)) {
      return ScanPredicate(kind: ScanPredicateKind.width, mhz: n);
    }
    return null;
  }
  final n = int.tryParse(w);
  if (n != null && _widthMhz.contains(n)) {
    return ScanPredicate(kind: ScanPredicateKind.width, mhz: n);
  }
  return null;
}

ScanPredicate? _parseChannelWord(String raw) {
  final w = raw.trim();
  final range = RegExp(r'^(\d+)\s*-\s*(\d+)$').firstMatch(w);
  if (range != null) {
    return ScanPredicate(
      kind: ScanPredicateKind.channelRange,
      channelFrom: int.parse(range.group(1)!),
      channelTo: int.parse(range.group(2)!),
    );
  }
  if (!RegExp(r'^\d+$').hasMatch(w)) return null;
  final n = int.parse(w);
  if (_widthMhz.contains(n) && n != 5) {
    return null;
  }
  return ScanPredicate(kind: ScanPredicateKind.channel, channel: n);
}

ScanPredicate? _parseNumberChannelOrWidth(String raw) {
  final w = raw.trim();
  if (!RegExp(r'^-?\d+(\.\d+)?$').hasMatch(w)) return null;
  final n = num.parse(w);
  if (n == 5) {
    return ScanPredicate(kind: ScanPredicateKind.channel, channel: 5);
  }
  if (n is int && _widthMhz.contains(n)) {
    return ScanPredicate(kind: ScanPredicateKind.width, mhz: n);
  }
  return ScanPredicate(kind: ScanPredicateKind.channel, channel: n.toInt());
}

ScanPredicate? classifyBareWord(String raw) {
  final band = _parseBandWord(raw);
  if (band != null) return band;

  final w = _fold(raw);
  if (_hiddenLiterals.contains(w) || _hiddenLiterals.contains(raw)) {
    return ScanPredicate(kind: ScanPredicateKind.hidden);
  }

  final sec = _securityWords[w];
  if (sec != null) {
    return ScanPredicate(kind: ScanPredicateKind.security, securityToken: sec);
  }

  final phy = _phyWords[w] ?? _phyWords[raw];
  if (phy != null) {
    return ScanPredicate(kind: ScanPredicateKind.phy, phyToken: phy);
  }

  if (_generationWords.contains(w)) {
    return ScanPredicate(kind: ScanPredicateKind.generation, generation: w);
  }

  if (w == 'wps' || w == 'ft') {
    return ScanPredicate(kind: ScanPredicateKind.keyword, text: w);
  }

  final width = _parseWidthWord(raw);
  if (width != null) return width;

  final channel = _parseChannelWord(raw);
  if (channel != null) return channel;

  if (isBssidOctetToken(raw)) {
    return ScanPredicate(
      kind: ScanPredicateKind.bssidOctet,
      bssidFragment: raw.toLowerCase(),
    );
  }

  return ScanPredicate(kind: ScanPredicateKind.keyword, text: raw);
}

ScanPredicate? classifyNumberToken(String raw) => _parseNumberChannelOrWidth(raw);

ScanPredicate classifyQuoted(String text) =>
    ScanPredicate(kind: ScanPredicateKind.phrase, text: text);

ScanPredicate? classifyCompareOnly(CompareOp op, String valueToken) {
  final pct = RegExp(r'^(-?\d+(?:\.\d+)?)%$').firstMatch(valueToken);
  if (pct != null) {
    return ScanPredicate(
      kind: ScanPredicateKind.signalPct,
      compareOp: op,
      valuePct: double.parse(pct.group(1)!),
    );
  }
  if (RegExp(r'^-?\d+(\.\d+)?$').hasMatch(valueToken)) {
    return ScanPredicate(
      kind: ScanPredicateKind.signal,
      compareOp: op,
      valueDbm: double.parse(valueToken),
    );
  }
  return null;
}

({String field, String rest})? splitKeyedWord(String raw) {
  final lower = raw.toLowerCase();
  for (final field in keyedFields) {
    if (lower.startsWith(field)) {
      final tail = raw.substring(field.length);
      if (tail.isEmpty) return (field: field, rest: '');
      final opMatch = RegExp(r'^(>=|<=|>|<|=)(.+)$').firstMatch(tail);
      if (opMatch != null) {
        return (field: field, rest: opMatch.group(1)! + opMatch.group(2)!);
      }
      if (tail.startsWith(':')) {
        return (field: field, rest: tail.substring(1));
      }
    }
  }
  return null;
}

ScanPredicate? parseKeyedPredicate(String field, String rest) {
  final f = field.toLowerCase();
  if (!keyedFields.contains(f)) return null;

  final opMatch = RegExp(r'^(>=|<=|>|<|=)(.+)$').firstMatch(rest);
  if (opMatch != null) {
    final op = CompareOpSymbol.parse(opMatch.group(1)!);
    if (op == null) return null;
    final val = opMatch.group(2)!.trim();
    if (f == 'snr' || f == 'signal' || f == 'noise') {
      if (!RegExp(r'^-?\d+(\.\d+)?%?$').hasMatch(val)) return null;
      return ScanPredicate(
        kind: ScanPredicateKind.keyed,
        keyedField: f,
        compareOp: op,
        keyedValue: val.endsWith('%') ? val.substring(0, val.length - 1) : val,
      );
    }
    return ScanPredicate(
      kind: ScanPredicateKind.keyed,
      keyedField: f,
      compareOp: op,
      keyedValue: val,
    );
  }

  if (rest.isEmpty) return null;
  return ScanPredicate(
    kind: ScanPredicateKind.keyed,
    keyedField: f,
    keyedValue: rest,
  );
}
