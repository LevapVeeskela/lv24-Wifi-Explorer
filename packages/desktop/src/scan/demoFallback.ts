import { readFileSync, existsSync } from 'node:fs';
import * as path from 'node:path';
import { app } from 'electron';
import { logScanDebug } from './redactLog';

export type FixtureSnapshot = Record<string, unknown>;

let cachedFixture: FixtureSnapshot | null | undefined;

function fixtureCandidates(): string[] {
  return [
    path.join(process.resourcesPath ?? '', 'fixtures', 'scan-snapshot.json'),
    path.join(app.getAppPath(), 'resources/fixtures/scan-snapshot.json'),
    path.join(process.cwd(), 'resources/fixtures/scan-snapshot.json'),
    path.join(__dirname, 'fixtures/scan-snapshot.json'),
  ];
}

export function resolveFixturePath(): string | null {
  for (const candidate of fixtureCandidates()) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}

export function loadFixtureSnapshot(): FixtureSnapshot {
  if (cachedFixture !== undefined) return cachedFixture ?? {};

  const fixturePath = resolveFixturePath();
  if (!fixturePath) {
    logScanDebug('fixture', { event: 'missing' });
    cachedFixture = {};
    return cachedFixture;
  }

  try {
    const raw = readFileSync(fixturePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      cachedFixture = {};
      return cachedFixture;
    }
    cachedFixture = parsed as FixtureSnapshot;
    logScanDebug('fixture', { event: 'loaded', path: fixturePath });
    return cachedFixture;
  } catch (error) {
    logScanDebug('fixture', {
      event: 'read-failed',
      path: fixturePath,
      message: error instanceof Error ? error.message : 'unknown',
    });
    cachedFixture = {};
    return cachedFixture;
  }
}

export function buildDemoSnapshotPayload(): Record<string, unknown> {
  const base = loadFixtureSnapshot();
  return {
    ...base,
    demo: true,
    source: 'fixtures',
    capturedAt: new Date().toISOString(),
  };
}
