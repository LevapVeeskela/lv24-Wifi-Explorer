#!/usr/bin/env node
/**
 * Compute the SHA-256 of a release artifact and fill the placeholders used by
 * the Windows distribution manifests (winget, Scoop, Chocolatey).
 *
 * Usage:
 *   node scripts/packaging/fill-checksums.mjs <artifact> [--write] [--version X.Y.Z]
 *
 * Without `--write` it only prints the hash and the exact lines to edit.
 * With `--write` it replaces every `REPLACE_WITH_SHA256` occurrence in the three
 * manifests. `--write` is limited to the NSIS installer on purpose: filling the
 * Windows placeholders with a DMG hash would be silently wrong.
 */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const PLACEHOLDER = 'REPLACE_WITH_SHA256';
const RELEASES = 'https://github.com/LevapVeeskela/lv24-Wifi-Explorer/releases/download';

const TARGETS = [
  {
    file: 'packaging/winget/LV24.WiFiExplorer.installer.yaml',
    snippet: (hash) => `InstallerSha256: ${hash}`,
  },
  {
    file: 'packaging/scoop/lv24-wifi-explorer.json',
    snippet: (hash) => `"hash": "${hash}"`,
  },
  {
    file: 'packaging/chocolatey/tools/chocolateyinstall.ps1',
    snippet: (hash) => `checksum64     = '${hash}'`,
  },
];

class UsageError extends Error {}

function printUsage() {
  console.log(
    [
      'Usage: node scripts/packaging/fill-checksums.mjs <artifact> [--write] [--version X.Y.Z]',
      '',
      '  <artifact>        path to the release file (NSIS .exe for --write)',
      '  --write           replace REPLACE_WITH_SHA256 in the winget/Scoop/Chocolatey manifests',
      '  --force           allow --write for a non-Windows artifact',
      '  --version X.Y.Z   override the version read from package.json',
    ].join('\n')
  );
}

function parseArgs(argv) {
  const options = { write: false, force: false, version: null, artifact: null, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--write') options.write = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--version') {
      i += 1;
      options.version = argv[i] ?? null;
    } else if (arg.startsWith('-')) {
      throw new UsageError(`unknown option: ${arg}`);
    } else if (options.artifact) {
      throw new UsageError(`unexpected argument: ${arg}`);
    } else {
      options.artifact = arg;
    }
  }
  return options;
}

function sha256(file) {
  return new Promise((done, fail) => {
    const hash = createHash('sha256');
    createReadStream(file)
      .on('error', fail)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => done(hash.digest('hex')));
  });
}

function formatBytes(bytes) {
  const mib = bytes / (1024 * 1024);
  return `${mib.toFixed(1)} MiB (${bytes.toLocaleString('en-US')} bytes)`;
}

async function defaultVersion() {
  const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
  return pkg.version;
}

async function fillPlaceholders(hash) {
  const results = [];
  for (const target of TARGETS) {
    const path = join(ROOT, target.file);
    const before = await readFile(path, 'utf8');
    const count = before.split(PLACEHOLDER).length - 1;
    if (count === 0) {
      results.push({ file: target.file, count: 0, replaced: false });
      continue;
    }
    await writeFile(path, before.split(PLACEHOLDER).join(hash), 'utf8');
    results.push({ file: target.file, count, replaced: true });
  }
  return results;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }
  if (!options.artifact) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const artifact = resolve(options.artifact);
  const info = await stat(artifact).catch(() => null);
  if (!info?.isFile()) {
    throw new UsageError(`not a file: ${artifact}`);
  }

  const name = basename(artifact);
  const version = options.version ?? (await defaultVersion());
  const hash = await sha256(artifact);
  const isWindows = /-win-x64\.exe$/i.test(name);

  console.log(`artifact  ${artifact}`);
  console.log(`size      ${formatBytes(info.size)}`);
  console.log(`sha256    ${hash}`);
  console.log('');

  console.log('# packaging/winget/LV24.WiFiExplorer.installer.yaml');
  console.log(TARGETS[0].snippet(hash));
  console.log('# packaging/scoop/lv24-wifi-explorer.json');
  console.log(TARGETS[1].snippet(hash));
  console.log('# packaging/chocolatey/tools/chocolateyinstall.ps1');
  console.log(TARGETS[2].snippet(hash));

  if (isWindows) {
    console.log('');
    console.log('expected release asset URL (must match the manifests):');
    console.log(`${RELEASES}/v${version}/${name}`);
  }

  if (!options.write) {
    console.log('');
    console.log(`Re-run with --write to replace ${PLACEHOLDER} in all three files.`);
    return;
  }

  if (!isWindows && !options.force) {
    throw new UsageError(
      '--write only fills the Windows installer placeholders; pass --force to override'
    );
  }

  console.log('');
  for (const result of await fillPlaceholders(hash)) {
    const status = result.replaced
      ? `replaced ${result.count} placeholder(s)`
      : `skipped (no ${PLACEHOLDER})`;
    console.log(`${result.file}: ${status}`);
  }
}

try {
  await main();
} catch (error) {
  if (error instanceof UsageError) {
    console.error(`error: ${error.message}`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
