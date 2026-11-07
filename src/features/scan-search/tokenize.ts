import { isBssidOctetToken } from './classifyToken';

export type TokenKind =
  | 'word'
  | 'quoted'
  | 'number'
  | 'compare'
  | 'lparen'
  | 'rparen'
  | 'and'
  | 'or'
  | 'not';

export interface Token {
  kind: TokenKind;
  value: string;
  start: number;
  end: number;
}

function readSpecialWord(input: string, start: number): { value: string; end: number } | null {
  const rest = input.slice(start);
  const ieee = rest.match(/^(802\.11[a-z]{0,2})/i);
  if (ieee) {
    return { value: ieee[1], end: start + ieee[1].length };
  }
  const band24 = rest.match(/^(2\.4ghz|2\.4)/i);
  if (band24) {
    return { value: band24[1], end: start + band24[1].length };
  }
  // Digit-leading BSSID / prefix MAC (`3c:5a`, `3c-5a`, full 6 octets).
  // Before channel ranges so `11-22-33-44-55-66` is not eaten as `11-22`.
  // `isBssidOctetToken` rejects two all-digit hyphen parts (`36-48`).
  const macRun = rest.match(/^[0-9a-f:-]+/i);
  if (macRun && isBssidOctetToken(macRun[0])) {
    return { value: macRun[0], end: start + macRun[0].length };
  }
  const range = rest.match(/^(\d+)\s*-\s*(\d+)/);
  if (range) {
    return { value: `${range[1]}-${range[2]}`, end: start + range[0].length };
  }
  const unitSuffix = rest.match(/^(\d+)(ghz|mhz)/i);
  if (unitSuffix) {
    const num = unitSuffix[1];
    const unit = unitSuffix[2].toLowerCase();
    if (unit === 'ghz' && (num === '5' || num === '6' || num === '24')) {
      return { value: `${num}ghz`, end: start + unitSuffix[0].length };
    }
    if (unit === 'mhz' && (num === '20' || num === '40' || num === '80' || num === '160')) {
      return { value: `${num}mhz`, end: start + unitSuffix[0].length };
    }
  }
  return null;
}

export function tokenize(input: string): Token[] | { error: string; offset: number } {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }

    if (ch === '(') {
      tokens.push({ kind: 'lparen', value: '(', start: i, end: i + 1 });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen', value: ')', start: i, end: i + 1 });
      i += 1;
      continue;
    }

    if (ch === '"') {
      const start = i;
      i += 1;
      let value = '';
      while (i < input.length) {
        const c = input[i];
        if (c === '"') {
          i += 1;
          tokens.push({ kind: 'quoted', value, start, end: i });
          break;
        }
        if (c === '\\' && i + 1 < input.length) {
          value += input[i + 1];
          i += 2;
          continue;
        }
        value += c;
        i += 1;
      }
      if (tokens.length === 0 || tokens[tokens.length - 1].start !== start) {
        return { error: 'Unclosed quote', offset: start };
      }
      continue;
    }

    if (ch === '>' || ch === '<') {
      const rest = input.slice(i);
      const two = rest.match(/^(>=|<=)/);
      if (two) {
        tokens.push({ kind: 'compare', value: two[1], start: i, end: i + 2 });
        i += 2;
        continue;
      }
      const one = rest[0];
      const next = rest[1];
      const afterSpace = rest.match(/^(>|<)\s+-?\d/);
      const immediateNum = next === '-' || (next >= '0' && next <= '9');
      if (afterSpace || immediateNum) {
        tokens.push({ kind: 'compare', value: one, start: i, end: i + 1 });
        i += 1;
        continue;
      }
    }

    if (ch === '=') {
      tokens.push({ kind: 'compare', value: '=', start: i, end: i + 1 });
      i += 1;
      continue;
    }

    if (ch >= '0' && ch <= '9') {
      const special = readSpecialWord(input, i);
      if (special) {
        tokens.push({ kind: 'word', value: special.value, start: i, end: special.end });
        i = special.end;
        continue;
      }
      const start = i;
      let j = i;
      while (j < input.length && input[j] >= '0' && input[j] <= '9') j += 1;
      tokens.push({ kind: 'number', value: input.slice(start, j), start, end: j });
      i = j;
      continue;
    }

    if (ch === '-') {
      const start = i;
      let j = i + 1;
      while (j < input.length && input[j] >= '0' && input[j] <= '9') j += 1;
      if (j > start + 1) {
        tokens.push({ kind: 'number', value: input.slice(start, j), start, end: j });
        i = j;
        continue;
      }
    }

    const start = i;
    while (i < input.length) {
      const c = input[i];
      if (
        c === ' ' ||
        c === '\t' ||
        c === '\n' ||
        c === '\r' ||
        c === '(' ||
        c === ')' ||
        c === '"'
      ) {
        break;
      }
      if (c === '=' || c === ':' || c === '>' || c === '<') {
        if (i === start) {
          if (c === '>' || c === '<') {
            const rest = input.slice(i);
            const two = rest.match(/^(>=|<=)/);
            const cmpNum = rest.match(/^(>=|<=|>|<)\s*-?\d/);
            const immediateNum =
              rest.length > 1 && (rest[1] === '-' || (rest[1] >= '0' && rest[1] <= '9'));
            if (two || cmpNum || immediateNum) break;
          }
          if (c === '=') break;
        }
        i += 1;
        continue;
      }
      i += 1;
    }
    if (i === start) {
      return { error: `Unexpected character ${JSON.stringify(ch)}`, offset: start };
    }
    const word = input.slice(start, i);
    if (word === 'AND') {
      tokens.push({ kind: 'and', value: word, start, end: i });
    } else if (word === 'OR') {
      tokens.push({ kind: 'or', value: word, start, end: i });
    } else if (word === 'NOT') {
      tokens.push({ kind: 'not', value: word, start, end: i });
    } else {
      tokens.push({ kind: 'word', value: word, start, end: i });
    }
  }

  return tokens;
}
