/**
 * Разбор публичного листинга IEEE MA-L (CSV или TXT) в Map keyed by `aa:bb:cc`.
 * Только 24 бита. MA-M (28) и MA-S (36) сюда не подмешивать.
 */

/** @param {string} assignment */
export function normalizeOui24(assignment) {
  const hex = assignment.trim().toLowerCase().replace(/[:\-.]/g, '');
  if (!/^[0-9a-f]{6}$/.test(hex)) {
    return null;
  }
  return `${hex.slice(0, 2)}:${hex.slice(2, 4)}:${hex.slice(4, 6)}`;
}

/** @param {string} text */
export function parseIeeeMal(text) {
  const body = stripBom(text);
  if (looksLikeIeeeCsv(body)) {
    return parseIeeeMalCsv(body);
  }
  return parseIeeeMalTxt(body);
}

/** @param {string} text */
export function parseIeeeMalCsv(text) {
  const records = new Map();
  const lines = stripBom(text).split(/\r?\n/);
  let assignmentIdx = 1;
  let orgIdx = 2;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.trim() === '') {
      continue;
    }
    const fields = splitCsvLine(line);
    if (isCsvHeader(fields)) {
      assignmentIdx = indexOfHeader(fields, 'assignment') ?? 1;
      orgIdx = indexOfHeader(fields, 'organization name') ?? indexOfHeader(fields, 'organization') ?? 2;
      continue;
    }
    const assignment = fields[assignmentIdx] ?? '';
    const registry = (fields[0] ?? '').trim().toUpperCase();
    if (registry && registry !== 'MA-L') {
      continue;
    }
    const oui = normalizeOui24(assignment);
    if (!oui || records.has(oui)) {
      continue;
    }
    records.set(oui, (fields[orgIdx] ?? '').trim());
  }

  return records;
}

/** @param {string} text */
export function parseIeeeMalTxt(text) {
  const records = new Map();
  const hexLine =
    /^\s*([0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2}[-:][0-9A-Fa-f]{2})\s+\(hex\)\s+(.*?)\s*$/;
  const base16Line = /^\s*([0-9A-Fa-f]{6})\s+\(base 16\)\s+(.*?)\s*$/;

  for (const rawLine of stripBom(text).split(/\r?\n/)) {
    const hexMatch = hexLine.exec(rawLine);
    if (hexMatch) {
      addTxtRecord(records, hexMatch[1], hexMatch[2]);
      continue;
    }
    const baseMatch = base16Line.exec(rawLine);
    if (baseMatch) {
      addTxtRecord(records, baseMatch[1], baseMatch[2]);
    }
  }

  return records;
}

function addTxtRecord(records, assignment, org) {
  const oui = normalizeOui24(assignment);
  if (!oui || records.has(oui)) {
    return;
  }
  records.set(oui, org.trim());
}

function looksLikeIeeeCsv(text) {
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '') {
      continue;
    }
    if (/\(\s*hex\s*\)/i.test(line) || /\(\s*base 16\s*\)/i.test(line)) {
      return false;
    }
    return line.includes(',');
  }
  return false;
}

function isCsvHeader(fields) {
  const joined = fields.join(',').toLowerCase();
  return joined.includes('assignment') && joined.includes('organization');
}

function indexOfHeader(fields, label) {
  const want = label.toLowerCase();
  const idx = fields.findIndex((field) => field.trim().toLowerCase() === want);
  return idx >= 0 ? idx : null;
}

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** RFC 4180-подобный разбор одной строки. */
export function splitCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ',') {
      fields.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  fields.push(current);
  return fields;
}
