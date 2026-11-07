import 'classify_scan_token.dart';
import 'scan_query_ast.dart';
import 'tokenize_scan_query.dart';

ParseScanQueryResult parseScanQuery(String input) {
  final trimmed = input.trim();
  if (trimmed.isEmpty) {
    return const ParseScanQueryOk(ScanQueryAst.all());
  }

  final tokenized = tokenizeScanQuery(trimmed);
  if (tokenized is TokenizeScanQueryErr) {
    return ParseScanQueryErr(error: tokenized.error, offset: tokenized.offset);
  }
  return _Parser(tokenized as List<ScanQueryToken>).parse();
}

class _Parser {
  _Parser(this.tokens);

  final List<ScanQueryToken> tokens;
  var _index = 0;

  ParseScanQueryResult parse() {
    if (tokens.isEmpty) {
      return const ParseScanQueryOk(ScanQueryAst.all());
    }
    final expr = _parseOr();
    if (expr == null) {
      return _fail();
    }
    if (_index < tokens.length) {
      final t = tokens[_index];
      return ParseScanQueryErr(
        error: 'Unexpected token "${t.value}"',
        offset: t.start,
      );
    }
    return ParseScanQueryOk(expr);
  }

  ParseScanQueryErr _fail() {
    final t = _index < tokens.length ? tokens[_index] : tokens.lastOrNull;
    return ParseScanQueryErr(
      error: 'Invalid query syntax',
      offset: t?.start ?? 0,
    );
  }

  ScanQueryAst? _parseOr() {
    var left = _parseAnd();
    if (left == null) return null;
    while (_match(TokenKind.or)) {
      final right = _parseAnd();
      if (right == null) return null;
      left = ScanQueryAst.boolNode(op: 'or', left: left!, right: right);
    }
    return left;
  }

  ScanQueryAst? _parseAnd() {
    var left = _parseNot();
    if (left == null) return null;
    while (true) {
      if (_match(TokenKind.and)) {
        final right = _parseNot();
        if (right == null) return null;
        left = ScanQueryAst.boolNode(op: 'and', left: left!, right: right);
        continue;
      }
      if (_canStartNot()) {
        final right = _parseNot();
        if (right == null) return null;
        left = ScanQueryAst.boolNode(op: 'and', left: left!, right: right);
        continue;
      }
      break;
    }
    return left;
  }

  bool _canStartNot() {
    if (_index >= tokens.length) return false;
    final t = tokens[_index];
    return t.kind == TokenKind.not ||
        t.kind == TokenKind.lparen ||
        t.kind == TokenKind.quoted ||
        t.kind == TokenKind.compare ||
        t.kind == TokenKind.number ||
        t.kind == TokenKind.word;
  }

  ScanQueryAst? _parseNot() {
    if (_match(TokenKind.not)) {
      final inner = _parseNot();
      if (inner == null) return null;
      return ScanQueryAst.not(inner: inner);
    }
    return _parsePrimary();
  }

  ScanQueryAst? _parsePrimary() {
    if (_match(TokenKind.lparen)) {
      final inner = _parseOr();
      if (inner == null || !_match(TokenKind.rparen)) return null;
      return inner;
    }

    final pred = _parsePredicate();
    if (pred == null) return null;
    return ScanQueryAst.pred(pred: pred);
  }

  ScanPredicate? _parsePredicate() {
    if (_index >= tokens.length) return null;
    final t = tokens[_index];

    if (t.kind == TokenKind.compare) {
      final op = CompareOpSymbol.parse(t.value);
      if (op == null) return null;
      _index += 1;
      if (_index >= tokens.length) return null;
      final valTok = tokens[_index];
      if (valTok.kind != TokenKind.number && valTok.kind != TokenKind.word) {
        return null;
      }
      final pred = classifyCompareOnly(op, valTok.value);
      if (pred == null) return null;
      _index += 1;
      return pred;
    }

    if (t.kind == TokenKind.quoted) {
      _index += 1;
      return classifyQuoted(t.value);
    }

    if (t.kind == TokenKind.number) {
      _index += 1;
      return classifyNumberToken(t.value);
    }

    if (t.kind == TokenKind.word) {
      final keyed = splitKeyedWord(t.value);
      if (keyed != null) {
        _index += 1;
        return parseKeyedPredicate(keyed.field, keyed.rest);
      }
      _index += 1;
      return classifyBareWord(t.value);
    }

    return null;
  }

  bool _match(TokenKind kind) {
    if (_index < tokens.length && tokens[_index].kind == kind) {
      _index += 1;
      return true;
    }
    return false;
  }
}
