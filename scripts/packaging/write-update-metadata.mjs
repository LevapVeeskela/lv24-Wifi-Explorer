#!/usr/bin/env node
/**
 * Writes electron-updater metadata (`latest.yml` / `latest-linux.yml`) for an
 * artifact that was already renamed for the release.
 *
 * electron-builder can generate this itself, but the release workflow renames
 * assets after packaging. Generating metadata from the final bytes keeps the
 * download URL, SHA-512, and size in sync with what users actually get.
 *
 * Usage:
 *   node scripts/packaging/write-update-metadata.mjs \
 *     --file release/App-1.2.3-win-x64.exe --version 1.2.3 --out release/latest.yml
 */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

function parseArgs(argv) {
  const args = { file: null, version: null, out: null };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--file') args.file = argv[++i];
    else if (key === '--version') args.version = argv[++i];
    else if (key === '--out') args.out = argv[++i];
    else throw new Error(`unknown option: ${key}`);
  }
  if (!args.file || !args.version || !args.out) {
    throw new Error('usage: --file <artifact> --version <x.y.z> --out <metadata>');
  }
  return args;
}

function sha512(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha512');
    createReadStream(file)
      .on('error', reject)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('base64')));
  });
}

const args = parseArgs(process.argv.slice(2));
const info = await stat(args.file);
const digest = await sha512(args.file);
const name = basename(args.file);
const releaseDate = new Date().toISOString();
const yaml = [
  `version: ${args.version}`,
  'files:',
  `  - url: ${JSON.stringify(name)}`,
  `    sha512: ${JSON.stringify(digest)}`,
  `    size: ${info.size}`,
  `path: ${JSON.stringify(name)}`,
  `sha512: ${JSON.stringify(digest)}`,
  `releaseDate: '${releaseDate}'`,
  '',
].join('\n');
await writeFile(args.out, yaml, 'utf8');
console.log(`wrote ${args.out} for ${name} (${info.size} bytes)`);
