import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { app } from 'electron';
import { MIN_SCAN_INTERVAL_MS } from './ipcChannels';
import { logScanDebug } from './redactLog';

export type ScanCoreLine = {
  type?: string;
  payload?: Record<string, unknown>;
  protocolVersion?: number;
  [key: string]: unknown;
};

function scanCoreDevRoots(): string[] {
  return [
    path.join(app.getAppPath(), 'native/ScanCore'),
    path.join(process.cwd(), 'native/ScanCore'),
    path.join(__dirname, '../../native/ScanCore'),
  ];
}

/** First match wins. Packaged app bundle, then dev `.build` outputs. */
export function resolveScanCoreBinary(): string | null {
  const appExecutable = path.join('Contents', 'MacOS', 'ScanCore');
  const relativeCandidates = [
    path.join('.build', 'ScanCore.app', appExecutable),
    path.join('.build', 'release', 'ScanCore'),
    path.join('.build', 'out', 'Products', 'Release', 'ScanCore'),
  ];

  const candidates: string[] = [
    path.join(process.resourcesPath ?? '', 'ScanCore.app', appExecutable),
  ];
  for (const root of scanCoreDevRoots()) {
    for (const rel of relativeCandidates) {
      candidates.push(path.join(root, rel));
    }
  }

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}

export interface ScanCoreSession {
  send(command: Record<string, unknown>): void;
  stop(): void;
}

export function startScanCoreProcess(input: {
  intervalMs: number;
  onLine: (line: ScanCoreLine) => void;
  onExit: (code: number | null) => void;
  onError: (error: Error) => void;
}): ScanCoreSession | null {
  const binary = resolveScanCoreBinary();
  if (!binary) {
    logScanDebug('client', { event: 'binary-missing' });
    return null;
  }

  const intervalMs = Math.max(MIN_SCAN_INTERVAL_MS, Math.floor(input.intervalMs));
  const child: ChildProcessWithoutNullStreams = spawn(
    binary,
    [
      '--stdio-only',
      '--idle',
      '--include-hidden',
      'true',
      '--interval-ms',
      String(intervalMs),
    ],
    { stdio: ['pipe', 'pipe', 'pipe'] },
  );

  logScanDebug('client', { event: 'spawn', intervalMs });

  let buffer = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => {
    buffer += chunk;
    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      const raw = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (raw) {
        try {
          const line = JSON.parse(raw) as ScanCoreLine;
          logScanDebug('line', line);
          input.onLine(line);
        } catch {
          logScanDebug('parse-skip', { bytes: raw.length });
        }
      }
      newline = buffer.indexOf('\n');
    }
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk: string) => {
    const trimmed = chunk.trim();
    if (trimmed) logScanDebug('stderr', { message: trimmed.slice(0, 200) });
  });

  child.on('error', input.onError);
  child.on('exit', (code) => {
    logScanDebug('client', { event: 'exit', code });
    input.onExit(code);
  });

  const session: ScanCoreSession = {
    send(command) {
      if (!child.stdin.writable) return;
      child.stdin.write(`${JSON.stringify(command)}\n`);
    },
    stop() {
      try {
        if (child.stdin.writable) {
          child.stdin.write(`${JSON.stringify({ type: 'scan:stop' })}\n`);
          child.stdin.write(`${JSON.stringify({ type: 'shutdown' })}\n`);
        }
      } catch {
        // ignore
      }
      child.kill('SIGTERM');
    },
  };

  session.send({ type: 'permissions:query' });
  session.send({ type: 'scan:start' });

  return session;
}
