#!/usr/bin/env node
/**
 * Download IEEE MA-L (oui.csv), emit resources/oui/registry.json + meta.json.
 * MA-M / MA-S rows are skipped (24-bit prefix only).
 */
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const IEEE_OUI_CSV_URL = 'https://standards-oui.ieee.org/oui/oui.csv';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '../resources/oui');

/** @type {ReadonlyArray<readonly [string, string]>} */
const CURATED_FALLBACK = [
  ['00:03:93', 'Apple, Inc.'],
  ['00:0a:f7', 'Cisco Systems, Inc'],
  ['00:11:22', 'Cisco Systems, Inc'],
  ['00:17:0b', 'Cisco Systems, Inc'],
  ['00:1a:a1', 'Cisco Systems, Inc'],
  ['00:1b:2f', 'Cisco Systems, Inc'],
  ['00:1c:58', 'Cisco Systems, Inc'],
  ['00:21:d8', 'Cisco Systems, Inc'],
  ['00:25:9c', 'Cisco-Linksys, LLC'],
  ['00:50:56', 'VMware, Inc.'],
  ['00:90:4c', 'Epigram, Inc.'],
  ['14:eb:b6', 'TP-LINK TECHNOLOGIES CO.,LTD.'],
  ['18:e8:29', 'Ubiquiti Inc'],
  ['20:4e:7f', 'NETGEAR'],
  ['24:a5:4b', 'Ubiquiti Inc'],
  ['28:ee:52', 'TP-LINK TECHNOLOGIES CO.,LTD.'],
  ['4c:5e:0c', 'Routerboard.com'],
  ['50:c7:bf', 'TP-LINK TECHNOLOGIES CO.,LTD.'],
  ['60:32:b1', 'TP-LINK TECHNOLOGIES CO.,LTD.'],
  ['64:d1:54', 'Routerboard.com'],
  ['6c:3b:6b', 'Routerboard.com'],
  ['70:81:05', 'Cisco Systems, Inc'],
  ['78:45:58', 'Ubiquiti Inc'],
  ['84:16:f9', 'TP-LINK TECHNOLOGIES CO.,LTD.'],
  ['84:1b:5e', 'NETGEAR'],
  ['a4:83:e7', 'Apple, Inc.'],
  ['ac:84:c6', 'TP-LINK TECHNOLOGIES CO.,LTD.'],
  ['b8:27:eb', 'Raspberry Pi Foundation'],
  ['c0:25:e9', 'TP-LINK TECHNOLOGIES CO.,LTD.'],
  ['dc:2c:6e', 'Routerboard.com'],
  ['e0:06:30', 'HUAWEI TECHNOLOGIES CO.,LTD'],
  ['e4:8d:8c', 'Routerboard.com'],
  ['e8:0a:b9', 'Cisco Systems, Inc'],
  ['ec:08:6b', 'TP-LINK TECHNOLOGIES CO.,LTD.'],
  ['f0:18:98', 'Apple, Inc.'],
  ['fc:ec:da', 'Ubiquiti Inc'],
];

/** @param {string} assignment */
function normalizeOui24(assignment) {
  const hex = assignment
    .trim()
    .toLowerCase()
    .replace(/[:\-.]/g, '');
  if (!/^[0-9a-f]{6}$/.test(hex)) {
    return null;
  }
  return `${hex.slice(0, 2)}:${hex.slice(2, 4)}:${hex.slice(4, 6)}`;
}

/** @param {string} line */
function splitCsvLine(line) {
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

/** @param {string} text */
function parseIeeeMalCsv(text) {
  const records = new Map();
  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = body.split(/\r?\n/);
  let assignmentIdx = 1;
  let orgIdx = 2;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.trim() === '') {
      continue;
    }
    const fields = splitCsvLine(line);
    const joined = fields.join(',').toLowerCase();
    if (joined.includes('assignment') && joined.includes('organization')) {
      assignmentIdx = indexOfHeader(fields, 'assignment') ?? 1;
      orgIdx =
        indexOfHeader(fields, 'organization name') ?? indexOfHeader(fields, 'organization') ?? 2;
      continue;
    }
    const registry = (fields[0] ?? '').trim().toUpperCase();
    if (registry && registry !== 'MA-L') {
      continue;
    }
    const oui = normalizeOui24(fields[assignmentIdx] ?? '');
    if (!oui || records.has(oui)) {
      continue;
    }
    records.set(oui, (fields[orgIdx] ?? '').trim());
  }

  return records;
}

/** @param {string[]} fields @param {string} label */
function indexOfHeader(fields, label) {
  const want = label.toLowerCase();
  const idx = fields.findIndex((field) => field.trim().toLowerCase() === want);
  return idx >= 0 ? idx : null;
}

/** @param {string} dest */
async function downloadCsv(dest) {
  const response = await fetch(IEEE_OUI_CSV_URL, {
    redirect: 'follow',
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status} for ${IEEE_OUI_CSV_URL}`);
  }
  await pipeline(response.body, createWriteStream(dest));
}

/** @param {Map<string, string>} records @param {'ieee-mal' | 'curated-fallback'} source */
function writeOutputs(records, source, sourceUrl) {
  mkdirSync(OUT_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  const byPrefix = Object.fromEntries(records.entries());

  const meta = {
    format: 'ieee-mal-24',
    source,
    sourceUrl,
    generatedAt,
    entryCount: records.size,
    note: '24-bit MA-L only. MA-M (28-bit) and MA-S (36-bit) are ambiguous at this prefix length.',
  };

  writeFileSync(join(OUT_DIR, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
  writeFileSync(
    join(OUT_DIR, 'registry.json'),
    `${JSON.stringify({ meta, byPrefix }, null, 0)}\n`,
    'utf8'
  );

  return meta;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const csvPath = join(OUT_DIR, 'ieee-mal.csv');

  try {
    process.stderr.write(`Downloading ${IEEE_OUI_CSV_URL} …\n`);
    await downloadCsv(csvPath);
    const text = readFileSync(csvPath, 'utf8');
    const records = parseIeeeMalCsv(text);
    if (records.size === 0) {
      throw new Error('Parsed zero MA-L assignments from downloaded CSV');
    }
    const meta = writeOutputs(records, 'ieee-mal', IEEE_OUI_CSV_URL);
    process.stdout.write(`Wrote ${meta.entryCount} MA-L prefixes → resources/oui/registry.json\n`);
  } catch (error) {
    process.stderr.write(
      `IEEE download/parse failed (${error instanceof Error ? error.message : error}); using curated fallback.\n`
    );
    const records = new Map(CURATED_FALLBACK.map(([oui, org]) => [normalizeOui24(oui), org]));
    const meta = writeOutputs(records, 'curated-fallback', null);
    process.stdout.write(
      `Wrote ${meta.entryCount} curated prefixes → resources/oui/registry.json\n`
    );
    process.exitCode = 0;
  }
}

main();
