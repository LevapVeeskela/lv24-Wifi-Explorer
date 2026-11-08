import type { CompareOp, ParseScanQueryResult, ScanQueryAst } from './ast';
import {
  classifyBareWord,
  classifyCompareOnly,
  classifyQuoted,
  classifyNumberToken,
  parseKeyedPredicate,
  splitKeyedWord,
} from './classifyToken';
import { tokenize, type Token } from './tokenize';

class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): ParseScanQueryResult {
    if (this.tokens.length === 0) {
      return { ok: true, ast: { type: 'all' } };
    }
    const expr = this.parseOr();
    if (!expr) {
      return this.fail();
    }
    if (this.index < this.tokens.length) {
      const t = this.tokens[this.index];
      return { ok: false, error: `Unexpected token ${JSON.stringify(t.value)}`, offset: t.start };
    }
    return { ok: true, ast: expr };
  }

  private fail(): ParseScanQueryResult {
    const t = this.tokens[this.index] ?? this.tokens[this.tokens.length - 1];
    const offset = t?.start ?? 0;
    return { ok: false, error: 'Invalid query syntax', offset };
  }

  private parseOr(): ScanQueryAst | null {
    let left = this.parseAnd();
    if (!left) return null;
    while (this.match('or')) {
      const right = this.parseAnd();
      if (!right) return null;
      left = { type: 'bool', op: 'or', left, right };
    }
    return left;
  }

  private parseAnd(): ScanQueryAst | null {
    let left = this.parseNot();
    if (!left) return null;
    while (true) {
      if (this.match('and')) {
        const right = this.parseNot();
        if (!right) return null;
        left = { type: 'bool', op: 'and', left, right };
        continue;
      }
      if (this.canStartNot()) {
        const right = this.parseNot();
        if (!right) return null;
        left = { type: 'bool', op: 'and', left, right };
        continue;
      }
      break;
    }
    return left;
  }

  private canStartNot(): boolean {
    if (this.index >= this.tokens.length) return false;
    const t = this.tokens[this.index];
    return (
      t.kind === 'not' ||
      t.kind === 'lparen' ||
      t.kind === 'quoted' ||
      t.kind === 'compare' ||
      t.kind === 'number' ||
      t.kind === 'word'
    );
  }

  private parseNot(): ScanQueryAst | null {
    if (this.match('not')) {
      const inner = this.parseNot();
      if (!inner) return null;
      return { type: 'not', inner };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ScanQueryAst | null {
    if (this.match('lparen')) {
      const inner = this.parseOr();
      if (!inner || !this.match('rparen')) return null;
      return inner;
    }

    const pred = this.parsePredicate();
    if (!pred) return null;
    return { type: 'pred', pred };
  }

  private parsePredicate() {
    const t = this.tokens[this.index];
    if (!t) return null;

    if (t.kind === 'compare') {
      const op = t.value as CompareOp;
      this.index += 1;
      const valTok = this.tokens[this.index];
      if (!valTok || (valTok.kind !== 'number' && valTok.kind !== 'word')) return null;
      const pred = classifyCompareOnly(op, valTok.value);
      if (!pred) return null;
      this.index += 1;
      return pred;
    }

    if (t.kind === 'quoted') {
      this.index += 1;
      return classifyQuoted(t.value);
    }

    if (t.kind === 'number') {
      this.index += 1;
      return classifyNumberToken(t.value);
    }

    if (t.kind === 'word') {
      const keyed = splitKeyedWord(t.value);
      if (keyed) {
        this.index += 1;
        const pred = parseKeyedPredicate(keyed.field, keyed.rest);
        return pred;
      }
      this.index += 1;
      return classifyBareWord(t.value);
    }

    return null;
  }

  private match(kind: Token['kind']): boolean {
    const t = this.tokens[this.index];
    if (t?.kind === kind) {
      this.index += 1;
      return true;
    }
    return false;
  }
}

export function parseScanQuery(input: string): ParseScanQueryResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: true, ast: { type: 'all' } };
  }

  const tokenized = tokenize(trimmed);
  if (!Array.isArray(tokenized)) {
    return { ok: false, error: tokenized.error, offset: tokenized.offset };
  }

  return new Parser(tokenized).parse();
}
