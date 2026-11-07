import 'classify_scan_token.dart';

enum TokenKind {
  word,
  quoted,
  number,
  compare,
  lparen,
  rparen,
  and,
  or,
  not,
}

class ScanQueryToken {
  const ScanQueryToken({
    required this.kind,
    required this.value,
    required this.start,
    required this.end,
  });

  final TokenKind kind;
  final String value;
  final int start;
  final int end;
}

class TokenizeScanQueryErr {
  const TokenizeScanQueryErr({required this.error, required this.offset});
  final String error;
  final int offset;
}

({String value, int end})? _readSpecialWord(String input, int start) {
  final rest = input.substring(start);
  final ieee = RegExp(r'^(802\.11[a-z]{0,2})', caseSensitive: false).firstMatch(rest);
  if (ieee != null) {
    return (value: ieee.group(1)!, end: start + ieee.group(1)!.length);
  }
  final band24 = RegExp(r'^(2\.4ghz|2\.4)', caseSensitive: false).firstMatch(rest);
  if (band24 != null) {
    return (value: band24.group(1)!, end: start + band24.group(1)!.length);
  }
  // Digit-leading BSSID / prefix MAC (`3c:5a`, `3c-5a`, full 6 octets).
  // Before channel ranges so `11-22-33-44-55-66` is not eaten as `11-22`.
  // `isBssidOctetToken` rejects two all-digit hyphen parts (`36-48`).
  final macRun = RegExp(r'^[0-9a-f:-]+', caseSensitive: false).firstMatch(rest);
  if (macRun != null && isBssidOctetToken(macRun.group(0)!)) {
    return (value: macRun.group(0)!, end: start + macRun.group(0)!.length);
  }
  final range = RegExp(r'^(\d+)\s*-\s*(\d+)').firstMatch(rest);
  if (range != null) {
    return (
      value: '${range.group(1)}-${range.group(2)}',
      end: start + range.group(0)!.length,
    );
  }
  final unitSuffix = RegExp(r'^(\d+)(ghz|mhz)', caseSensitive: false).firstMatch(rest);
  if (unitSuffix != null) {
    final num = unitSuffix.group(1)!;
    final unit = unitSuffix.group(2)!.toLowerCase();
    if (unit == 'ghz' && (num == '5' || num == '6' || num == '24')) {
      return (value: '${num}ghz', end: start + unitSuffix.group(0)!.length);
    }
    if (unit == 'mhz' && (num == '20' || num == '40' || num == '80' || num == '160')) {
      return (value: '${num}mhz', end: start + unitSuffix.group(0)!.length);
    }
  }
  return null;
}

bool _isDigit(String c) {
  final code = c.codeUnitAt(0);
  return code >= 0x30 && code <= 0x39;
}

Object tokenizeScanQuery(String input) {
  final tokens = <ScanQueryToken>[];
  var i = 0;

  while (i < input.length) {
    final ch = input[i];
    if (ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r') {
      i += 1;
      continue;
    }

    if (ch == '(') {
      tokens.add(ScanQueryToken(kind: TokenKind.lparen, value: '(', start: i, end: i + 1));
      i += 1;
      continue;
    }
    if (ch == ')') {
      tokens.add(ScanQueryToken(kind: TokenKind.rparen, value: ')', start: i, end: i + 1));
      i += 1;
      continue;
    }

    if (ch == '"') {
      final start = i;
      i += 1;
      final buf = StringBuffer();
      var closed = false;
      while (i < input.length) {
        final c = input[i];
        if (c == '"') {
          i += 1;
          tokens.add(ScanQueryToken(
            kind: TokenKind.quoted,
            value: buf.toString(),
            start: start,
            end: i,
          ));
          closed = true;
          break;
        }
        if (c == r'\' && i + 1 < input.length) {
          buf.write(input[i + 1]);
          i += 2;
          continue;
        }
        buf.write(c);
        i += 1;
      }
      if (!closed) {
        return TokenizeScanQueryErr(error: 'Unclosed quote', offset: start);
      }
      continue;
    }

    if (ch == '>' || ch == '<') {
      final rest = input.substring(i);
      final two = RegExp(r'^(>=|<=)').firstMatch(rest);
      if (two != null) {
        tokens.add(ScanQueryToken(
          kind: TokenKind.compare,
          value: two.group(1)!,
          start: i,
          end: i + 2,
        ));
        i += 2;
        continue;
      }
      final one = rest[0];
      final next = rest.length > 1 ? rest[1] : '';
      final afterSpace = RegExp(r'^(>|<)\s+-?\d').hasMatch(rest);
      final immediateNum = next == '-' || _isDigit(next);
      if (afterSpace || immediateNum) {
        tokens.add(ScanQueryToken(
          kind: TokenKind.compare,
          value: one,
          start: i,
          end: i + 1,
        ));
        i += 1;
        continue;
      }
    }

    if (ch == '=') {
      tokens.add(ScanQueryToken(kind: TokenKind.compare, value: '=', start: i, end: i + 1));
      i += 1;
      continue;
    }

    if (_isDigit(ch)) {
      final special = _readSpecialWord(input, i);
      if (special != null) {
        tokens.add(ScanQueryToken(
          kind: TokenKind.word,
          value: special.value,
          start: i,
          end: special.end,
        ));
        i = special.end;
        continue;
      }
      final start = i;
      var j = i;
      while (j < input.length && _isDigit(input[j])) {
        j += 1;
      }
      tokens.add(ScanQueryToken(
        kind: TokenKind.number,
        value: input.substring(start, j),
        start: start,
        end: j,
      ));
      i = j;
      continue;
    }

    if (ch == '-') {
      final start = i;
      var j = i + 1;
      while (j < input.length && _isDigit(input[j])) {
        j += 1;
      }
      if (j > start + 1) {
        tokens.add(ScanQueryToken(
          kind: TokenKind.number,
          value: input.substring(start, j),
          start: start,
          end: j,
        ));
        i = j;
        continue;
      }
    }

    final start = i;
    while (i < input.length) {
      final c = input[i];
      if (c == ' ' ||
          c == '\t' ||
          c == '\n' ||
          c == '\r' ||
          c == '(' ||
          c == ')' ||
          c == '"') {
        break;
      }
      if (c == '=' || c == ':' || c == '>' || c == '<') {
        if (i == start) {
          if (c == '>' || c == '<') {
            final rest = input.substring(i);
            final two = RegExp(r'^(>=|<=)').hasMatch(rest);
            final cmpNum = RegExp(r'^(>=|<=|>|<)\s*-?\d').hasMatch(rest);
            final immediateNum = rest.length > 1 &&
                (rest[1] == '-' || _isDigit(rest[1]));
            if (two || cmpNum || immediateNum) break;
          }
          if (c == '=') break;
        }
        i += 1;
        continue;
      }
      i += 1;
    }
    if (i == start) {
      return TokenizeScanQueryErr(
        error: 'Unexpected character ${jsonString(ch)}',
        offset: start,
      );
    }
    final word = input.substring(start, i);
    if (word == 'AND') {
      tokens.add(ScanQueryToken(kind: TokenKind.and, value: word, start: start, end: i));
    } else if (word == 'OR') {
      tokens.add(ScanQueryToken(kind: TokenKind.or, value: word, start: start, end: i));
    } else if (word == 'NOT') {
      tokens.add(ScanQueryToken(kind: TokenKind.not, value: word, start: start, end: i));
    } else {
      tokens.add(ScanQueryToken(kind: TokenKind.word, value: word, start: start, end: i));
    }
  }

  return tokens;
}

String jsonString(String s) {
  return '"${s.replaceAll(r'\', r'\\').replaceAll('"', r'\"')}"';
}
