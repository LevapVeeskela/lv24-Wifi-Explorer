/**
 * macOS helper resolution for the `wifi_providers` capability report.
 *
 * `@lv24/wifi-backend` resolves the same candidates internally but does not
 * export the resolver, so the MCP package mirrors the lookup to report whether
 * ScanCore is reachable without spawning it.
 */

import { existsSync } from 'node:fs';
import * as path from 'node:path';

const EXECUTABLE = path.join('Contents', 'MacOS', 'ScanCore');

/** Ordered helper candidates, matching the backend provider. */
export function macScanCoreCandidates(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd()
): string[] {
  return [
    env.LV24_SCANCORE_PATH,
    env.LV24_RESOURCES_PATH ? path.join(env.LV24_RESOURCES_PATH, 'ScanCore.app', EXECUTABLE) : null,
    path.join(cwd, 'native/ScanCore/.build/ScanCore.app', EXECUTABLE),
    path.join(cwd, 'native/ScanCore/.build/out/Products/Release/ScanCore'),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);
}

/** First existing helper path, or `null`. */
export function resolveMacScanCoreBinary(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd()
): string | null {
  for (const candidate of macScanCoreCandidates(env, cwd)) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}
