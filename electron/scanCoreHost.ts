import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { app } from 'electron';

export type ScanCoreLine = {
  type?: string;
  payload?: Record<string, unknown>;
  protocolVersion?: number;
  [key: string]: unknown;
};

export function resolveScanCoreBinary(): string | null {
  const executable = path.join('Contents', 'MacOS', 'ScanCore');
  const candidates = [
    path.join(process.resourcesPath ?? '', 'ScanCore.app', executable),
    path.join(app.getAppPath(), 'native/ScanCore/.build/ScanCore.app', executable),
    path.join(process.cwd(), 'native/ScanCore/.build/ScanCore.app', executable),
    path.join(__dirname, '../native/ScanCore/.build/ScanCore.app', executable),
  ];
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
  if (!binary) return null;

  const child: ChildProcessWithoutNullStreams = spawn(
    binary,
    [
      '--stdio-only',
      '--include-hidden',
      'true',
      '--interval-ms',
      String(Math.max(3000, input.intervalMs)),
    ],
    {
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  );

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
          input.onLine(JSON.parse(raw) as ScanCoreLine);
        } catch {
          // ignore non-JSON log noise
        }
      }
      newline = buffer.indexOf('\n');
    }
  });

  child.stderr.setEncoding('utf8');
  child.on('error', input.onError);
  child.on('exit', (code) => input.onExit(code));

  return {
    send(command) {
      if (!child.stdin.writable) return;
      child.stdin.write(`${JSON.stringify(command)}\n`);
    },
    stop() {
      try {
        if (child.stdin.writable) {
          child.stdin.write(`${JSON.stringify({ type: 'shutdown' })}\n`);
        }
      } catch {
        // ignore
      }
      child.kill('SIGTERM');
    },
  };
}
