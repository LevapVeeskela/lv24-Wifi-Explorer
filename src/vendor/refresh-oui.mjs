#!/usr/bin/env node
/**
 * Скачивает официальный публичный листинг IEEE MA-L в data/oui/.
 * python3 на этой машине ломается из‑за Xcode license — только Node.
 *
 *   node src/vendor/refresh-oui.mjs
 */
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseIeeeMal } from './parse-ieee-mal.mjs';

const IEEE_MAL_CSV = 'https://standards-oui.ieee.org/oui/oui.csv';
const IEEE_MAL_TXT = 'https://standards-oui.ieee.org/oui/oui.txt';
const USER_AGENT = 'lv24-Wifi-Explorer/0.1 (IEEE MA-L public listing refresh)';

const VENDOR_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(VENDOR_DIR, '../../data/oui');
const SAMPLE_NAME = 'ieee-mal.sample.csv';

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();

  try {
    const downloaded = await downloadOfficial();
    const destName = downloaded.kind === 'csv' ? 'ieee-mal.csv' : 'ieee-mal.txt';
    const destPath = path.join(DATA_DIR, destName);
    const records = parseIeeeMal(downloaded.text);
    if (records.size < 1000) {
      throw new Error(`Official listing parsed only ${records.size} MA-L assignments (expected thousands)`);
    }
    writeAtomic(destPath, downloaded.bytes);
    writeMeta({
      format: 'ieee-mal-24',
      fileName: `oui/${destName}`,
      generatedAt,
      sourceUrl: downloaded.url,
      entryCount: records.size,
      bytes: downloaded.bytes.length,
      note: '24-bit MA-L only. MA-M (28-bit) and MA-S (36-bit) are ambiguous at this prefix length.',
    });
    console.log(`Wrote ${destPath} (${downloaded.bytes.length} bytes, ${records.size} assignments)`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`IEEE MA-L download failed: ${message}`);
    ensureSampleFallback(generatedAt);
    process.exitCode = 1;
  }
}

async function downloadOfficial() {
  const errors = [];
  for (const { url, kind } of [
    { url: IEEE_MAL_CSV, kind: 'csv' },
    { url: IEEE_MAL_TXT, kind: 'txt' },
  ]) {
    try {
      const bytes = await fetchListing(url);
      const text = bytes.toString('utf8');
      if (!looksLikeListing(text, kind)) {
        throw new Error(`${url} did not look like an IEEE MA-L listing`);
      }
      return { url, kind, bytes, text };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(errors.join('; '));
}

async function fetchListing(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/plain,text/csv,*/*' },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`${url} → HTTP ${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024) {
    throw new Error(`${url} is too small (${bytes.length} bytes)`);
  }
  return bytes;
}

function looksLikeListing(text, kind) {
  const head = text.slice(0, 400).toLowerCase();
  if (head.includes('<html') || head.includes('<!doctype')) {
    return false;
  }
  if (kind === 'csv') {
    return head.includes('assignment') || head.startsWith('ma-l,');
  }
  return head.includes('(hex)') || head.includes('(base 16)');
}

function writeAtomic(destPath, bytes) {
  const tmp = `${destPath}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
  writeFileSync(tmp, bytes);
  try {
    renameSync(tmp, destPath);
  } catch (error) {
    try {
      unlinkSync(tmp);
    } catch {
      // ignore cleanup
    }
    throw error;
  }
}

function writeMeta(meta) {
  writeAtomic(path.join(DATA_DIR, 'meta.json'), Buffer.from(`${JSON.stringify(meta, null, 2)}\n`, 'utf8'));
}

function ensureSampleFallback(generatedAt) {
  const samplePath = path.join(DATA_DIR, SAMPLE_NAME);
  try {
    const text = readFileSync(samplePath, 'utf8');
    const records = parseIeeeMal(text);
    writeMeta({
      format: 'ieee-mal-24',
      fileName: `oui/${SAMPLE_NAME}`,
      generatedAt,
      sourceUrl: null,
      entryCount: records.size,
      fallback: true,
      note: 'Offline sample only. Re-run node src/vendor/refresh-oui.mjs when network is available. MA-M/MA-S are not represented.',
    });
    console.error(`Kept fallback ${samplePath} (${records.size} sample assignments).`);
  } catch {
    console.error(`No usable sample at ${samplePath}.`);
  }
}

await main();
