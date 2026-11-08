import { createAnnotationRule } from './persist';
import type { AnnotationRule } from './types';

const HEADERS = ['bssid_pattern', 'text'] as const;

/** UTF-8 BOM so Excel picks the right encoding. */
const CSV_BOM = '\uFEFF';

/** Characters that start a spreadsheet formula (CSV injection). */
const FORMULA_START_RE = /^[=+\-@\t\r]/;

/** Guard: prefix dangerous leading characters with `'` (Excel text marker). */
function guardFormula(value: string): string {
  return FORMULA_START_RE.test(value) ? `'${value}` : value;
}

/** Reverse the export guard on import so round-trips stay lossless. */
function unguardFormula(value: string): string {
  return value.startsWith("'") && FORMULA_START_RE.test(value.slice(1)) ? value.slice(1) : value;
}

function escapeField(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/** Our annotation list CSV: UTF-8 BOM + headers `bssid_pattern,text`. */
export function exportAnnotationCsv(rules: readonly AnnotationRule[]): string {
  const lines = [
    HEADERS.join(','),
    ...rules.map((r) =>
      [escapeField(guardFormula(r.bssidPattern)), escapeField(guardFormula(r.text))].join(',')
    ),
  ];
  return `${CSV_BOM}${lines.join('\n')}\n`;
}

export function importAnnotationCsv(text: string): AnnotationRule[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const patternIdx = header.indexOf('bssid_pattern');
  const textIdx = header.indexOf('text');
  const start = patternIdx >= 0 && textIdx >= 0 ? 1 : 0;
  const pCol = patternIdx >= 0 ? patternIdx : 0;
  const tCol = textIdx >= 0 ? textIdx : 1;

  const rules: AnnotationRule[] = [];
  for (let i = start; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    const pattern = unguardFormula(cols[pCol] ?? '').trim();
    const note = unguardFormula(cols[tCol] ?? '');
    if (!pattern) continue;
    rules.push(createAnnotationRule(pattern, note));
  }
  return rules;
}
