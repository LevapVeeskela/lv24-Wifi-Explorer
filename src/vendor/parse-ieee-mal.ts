/**
 * Типизированный фасад над `parse-ieee-mal.mjs`.
 */
import {
  normalizeOui24 as normalizeOui24Js,
  parseIeeeMal as parseIeeeMalJs,
  parseIeeeMalCsv as parseIeeeMalCsvJs,
  parseIeeeMalTxt as parseIeeeMalTxtJs,
  splitCsvLine as splitCsvLineJs,
} from './parse-ieee-mal.mjs';

export function normalizeOui24(assignment: string): string | null {
  return normalizeOui24Js(assignment);
}

export function parseIeeeMal(text: string): Map<string, string> {
  return parseIeeeMalJs(text);
}

export function parseIeeeMalCsv(text: string): Map<string, string> {
  return parseIeeeMalCsvJs(text);
}

export function parseIeeeMalTxt(text: string): Map<string, string> {
  return parseIeeeMalTxtJs(text);
}

export function splitCsvLine(line: string): string[] {
  return splitCsvLineJs(line);
}
