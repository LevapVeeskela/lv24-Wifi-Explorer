import { copyFileSync, mkdirSync } from 'node:fs';

/** Keep Flutter asset copies in sync with the repo-root resources. */
const copies = [
  ['resources/oui/registry.json', 'flutter/assets/oui/registry.json'],
  ['resources/fixtures/scan-snapshot.json', 'flutter/assets/fixtures/scan-snapshot.json'],
];

for (const [from, to] of copies) {
  mkdirSync(to.slice(0, to.lastIndexOf('/')), { recursive: true });
  copyFileSync(from, to);
  process.stdout.write(`synced ${from} → ${to}\n`);
}
