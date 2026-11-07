/// Parsed scan search query (LV24 DSL, aligned with Electron scan-search).

enum ScanQueryAstType { all, boolNode, not, pred }

enum ScanPredicateKind {
  keyword,
  phrase,
  band,
  width,
  channel,
  channelRange,
  bssidOctet,
  signal,
  signalPct,
  security,
  phy,
  generation,
  hidden,
  keyed,
}

enum CompareOp { gte, lte, gt, lt, eq }

extension CompareOpSymbol on CompareOp {
  String get symbol => switch (this) {
        CompareOp.gte => '>=',
        CompareOp.lte => '<=',
        CompareOp.gt => '>',
        CompareOp.lt => '<',
        CompareOp.eq => '=',
      };

  static CompareOp? parse(String raw) => switch (raw) {
        '>=' => CompareOp.gte,
        '<=' => CompareOp.lte,
        '>' => CompareOp.gt,
        '<' => CompareOp.lt,
        '=' => CompareOp.eq,
        _ => null,
      };
}

typedef SecurityShortcut = String;
typedef PhyShortcut = String;
typedef KeyedField = String;
typedef WifiGeneration = String;

class ScanPredicate {
  const ScanPredicate({
    required this.kind,
    this.text,
    this.band,
    this.mhz,
    this.channel,
    this.channelFrom,
    this.channelTo,
    this.bssidFragment,
    this.compareOp,
    this.valueDbm,
    this.valuePct,
    this.securityToken,
    this.phyToken,
    this.generation,
    this.keyedField,
    this.keyedValue,
  });

  final ScanPredicateKind kind;
  final String? text;
  final double? band;
  final int? mhz;
  final int? channel;
  final int? channelFrom;
  final int? channelTo;
  final String? bssidFragment;
  final CompareOp? compareOp;
  final double? valueDbm;
  final double? valuePct;
  final SecurityShortcut? securityToken;
  final PhyShortcut? phyToken;
  final WifiGeneration? generation;
  final KeyedField? keyedField;
  final String? keyedValue;
}

class ScanQueryAst {
  const ScanQueryAst._({
    required this.type,
    this.boolOp,
    this.left,
    this.right,
    this.inner,
    this.pred,
  });

  const ScanQueryAst.all() : this._(type: ScanQueryAstType.all);

  const ScanQueryAst.boolNode({
    required String op,
    required ScanQueryAst left,
    required ScanQueryAst right,
  }) : this._(
          type: ScanQueryAstType.boolNode,
          boolOp: op,
          left: left,
          right: right,
        );

  const ScanQueryAst.not({required ScanQueryAst inner})
      : this._(type: ScanQueryAstType.not, inner: inner);

  const ScanQueryAst.pred({required ScanPredicate pred})
      : this._(type: ScanQueryAstType.pred, pred: pred);

  final ScanQueryAstType type;
  final String? boolOp;
  final ScanQueryAst? left;
  final ScanQueryAst? right;
  final ScanQueryAst? inner;
  final ScanPredicate? pred;
}

sealed class ParseScanQueryResult {
  const ParseScanQueryResult();
}

class ParseScanQueryOk extends ParseScanQueryResult {
  const ParseScanQueryOk(this.ast);
  final ScanQueryAst ast;
}

class ParseScanQueryErr extends ParseScanQueryResult {
  const ParseScanQueryErr({required this.error, required this.offset});
  final String error;
  final int offset;
}
