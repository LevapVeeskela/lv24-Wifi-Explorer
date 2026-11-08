import { spawn, type ChildProcess, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { BaseScanProvider } from '../base';
import { normalizeScanCoreSnapshot } from '../normalize';
import type { ScanProviderOptions } from '../types';

const PROTOCOL_VERSION = 1;
const HANDSHAKE_TIMEOUT_MS = 4_000;
const STOP_KILL_TIMEOUT_MS = 1_500;
const SOCKET_WAIT_MS = 5_000;
const MAX_LINE_CHARS = 8 * 1024 * 1024;

export function resolveMacScanCoreBinary(binaryPath?: string): string | null {
  const executable = path.join('Contents', 'MacOS', 'ScanCore');
  const candidates = [
    binaryPath,
    process.env.LV24_SCANCORE_PATH,
    process.env.LV24_RESOURCES_PATH
      ? path.join(process.env.LV24_RESOURCES_PATH, 'ScanCore.app', executable)
      : null,
    path.join(process.cwd(), 'native/ScanCore/.build/ScanCore.app', executable),
    path.join(process.cwd(), 'native/ScanCore/.build/out/Products/Release/ScanCore'),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/** `.../ScanCore.app/Contents/MacOS/ScanCore` → `.../ScanCore.app`. */
export function macAppBundleForBinary(binary: string): string | null {
  const marker = `${path.sep}Contents${path.sep}MacOS${path.sep}`;
  const index = binary.indexOf(marker);
  if (index < 0) return null;
  const bundle = binary.slice(0, index);
  return bundle.endsWith('.app') && existsSync(bundle) ? bundle : null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Scan-related helper arguments. `directedSsid` is passed verbatim (SSIDs may
 * contain spaces and punctuation); argv keeps it as a single argument.
 */
export function scanCoreScanArgs(
  options: Pick<ScanProviderOptions, 'includeHidden' | 'intervalMs' | 'directedSsid'>
): string[] {
  const args = [
    '--include-hidden',
    String(options.includeHidden),
    '--interval-ms',
    String(Math.max(3000, Math.floor(options.intervalMs))),
  ];
  const directed = options.directedSsid;
  if (typeof directed === 'string' && directed.length > 0) {
    args.push('--ssid', directed);
  }
  return args;
}

async function waitForSocket(socketPath: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (existsSync(socketPath)) return true;
    await delay(80);
  }
  return false;
}

/**
 * macOS provider.
 *
 * Production path: launch the signed `ScanCore.app` through LaunchServices
 * (`open -n -W`) and talk JSON Lines over a Unix socket. TCC tracks the app's
 * stable code signature, so Location-authorized scans return real SSID/BSSID.
 * A bare helper binary (dev/SwiftPM output) falls back to direct stdio.
 */
export class MacScanCoreProvider extends BaseScanProvider {
  readonly id = 'macos-scancore' as const;
  private child: ChildProcessWithoutNullStreams | null = null;
  private launcher: ChildProcess | null = null;
  private socket: net.Socket | null = null;
  private socketPath: string | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private handshakeTimer: ReturnType<typeof setTimeout> | null = null;
  private stopping = false;
  private buffer = '';
  private ready = false;

  async start(options: ScanProviderOptions): Promise<void> {
    if (process.platform !== 'darwin') {
      this.emitError({
        code: 'PLATFORM_UNSUPPORTED',
        message: 'ScanCore helper is macOS-only.',
        recoverable: false,
      });
      return;
    }
    const binary = resolveMacScanCoreBinary(options.binaryPath);
    if (!binary) {
      this.emitError({
        code: 'HELPER_MISSING',
        message:
          'ScanCore helper not found (build with `yarn build:scancore` or set LV24_SCANCORE_PATH).',
        recoverable: true,
        demoFallback: true,
      });
      return;
    }

    const bundle = macAppBundleForBinary(binary);
    if (bundle) {
      await this.startViaLaunchServices(bundle, options);
      return;
    }
    this.startDirect(binary, options);
  }

  /** LaunchServices keeps the helper's TCC identity stable (real SSID/BSSID). */
  private async startViaLaunchServices(
    bundle: string,
    options: ScanProviderOptions
  ): Promise<void> {
    this.stopping = false;
    this.ready = false;
    this.buffer = '';
    const socketPath = path.join(
      os.tmpdir(),
      `lv24-scancore-${process.pid}-${Date.now().toString(36)}.sock`
    );
    this.socketPath = socketPath;
    rmSync(socketPath, { force: true });

    const args = [
      '-n',
      '-W',
      '-a',
      bundle,
      '--args',
      '--socket',
      socketPath,
      '--idle',
      ...scanCoreScanArgs(options),
    ];
    const launcher = spawn('open', args, { stdio: 'ignore' });
    this.launcher = launcher;
    this.emit({ type: 'status', running: true, scanning: false, helper: bundle });

    launcher.on('error', (error) => {
      if (this.stopping) return;
      this.emitError({ code: 'LAUNCH_FAILED', message: error.message, recoverable: true });
      void this.stop();
    });
    launcher.on('exit', (code) => {
      const wasStopping = this.stopping;
      this.launcher = null;
      this.cleanupTimers();
      if (!wasStopping && this.socket == null) {
        this.emitError({
          code: 'HELPER_EXIT',
          message: `ScanCore.app exited with code ${String(code)}`,
          recoverable: true,
          demoFallback: true,
        });
      }
    });

    const appeared = await waitForSocket(socketPath, SOCKET_WAIT_MS);
    if (!appeared || this.stopping) {
      if (!this.stopping) {
        this.emitError({
          code: 'SOCKET_TIMEOUT',
          message: 'ScanCore.app did not open its control socket.',
          recoverable: true,
          demoFallback: true,
        });
        void this.stop();
      }
      return;
    }

    this.socket = net.createConnection({ path: socketPath });
    this.socket.setEncoding('utf8');
    this.socket.on('data', (chunk: string) => this.consume(chunk));
    this.socket.on('error', (error) => {
      if (this.stopping) return;
      this.emitError({ code: 'SOCKET_ERROR', message: error.message, recoverable: true });
    });
    this.socket.on('close', () => {
      this.socket = null;
      if (!this.stopping) {
        this.emit({ type: 'status', running: false, scanning: false });
      }
    });

    this.armHandshake();
    this.send({ type: 'permissions:query' });
    this.send({ type: 'scan:start' });
  }

  /** Dev fallback: bare SwiftPM binary over stdio. */
  private startDirect(binary: string, options: ScanProviderOptions): void {
    const child = spawn(binary, ['--stdio-only', '--idle', ...scanCoreScanArgs(options)], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.child = child;
    this.stopping = false;
    this.ready = false;
    this.buffer = '';
    this.emit({ type: 'status', running: true, scanning: false, helper: binary });

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => this.consume(chunk));
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      const message = chunk.trim();
      if (message) this.emitError({ code: 'HELPER_STDERR', message, recoverable: true });
    });
    child.stdin.on('error', (error: Error) => {
      if (this.stopping) return;
      this.emitError({ code: 'STDIN_ERROR', message: error.message, recoverable: true });
    });
    child.on('error', (error) => {
      this.emitError({ code: 'HELPER_SPAWN', message: error.message, recoverable: true });
    });
    child.on('exit', (code) => {
      this.cleanupTimers();
      const wasStopping = this.stopping;
      this.child = null;
      this.emit({ type: 'status', running: false, scanning: false });
      if (!wasStopping) {
        this.emitError({
          code: 'HELPER_EXIT',
          message: `ScanCore exited with code ${String(code)}`,
          recoverable: true,
          demoFallback: true,
        });
      }
    });

    this.armHandshake();
    this.send({ type: 'permissions:query' });
    this.send({ type: 'scan:start' });
  }

  private armHandshake(): void {
    this.handshakeTimer = setTimeout(() => {
      if (this.ready) return;
      this.emitError({
        code: 'HANDSHAKE_TIMEOUT',
        message: 'ScanCore did not send hello within 4s.',
        recoverable: true,
        demoFallback: true,
      });
      void this.stop();
    }, HANDSHAKE_TIMEOUT_MS);
    this.handshakeTimer.unref?.();
  }

  private consume(chunk: string): void {
    this.buffer += chunk;
    let newline = this.buffer.indexOf('\n');
    while (newline !== -1) {
      const raw = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (raw) this.handleLine(raw);
      newline = this.buffer.indexOf('\n');
    }
    if (this.buffer.length > MAX_LINE_CHARS) this.buffer = '';
  }

  private handleLine(raw: string): void {
    let line: Record<string, unknown>;
    try {
      line = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      this.emitError({
        code: 'PARSE_ERROR',
        message: 'Malformed JSON line from ScanCore.',
        recoverable: true,
      });
      return;
    }
    const type = line.type;
    const payload =
      line.payload && typeof line.payload === 'object'
        ? (line.payload as Record<string, unknown>)
        : line;

    if (type === 'hello') {
      if (line.protocolVersion !== PROTOCOL_VERSION) {
        this.emitError({
          code: 'PROTOCOL_MISMATCH',
          message: `ScanCore protocol ${String(line.protocolVersion)} != ${PROTOCOL_VERSION}`,
          recoverable: false,
        });
        void this.stop();
        return;
      }
      this.ready = true;
      if (this.handshakeTimer) clearTimeout(this.handshakeTimer);
      this.handshakeTimer = null;
      return;
    }
    if (type === 'permissions:status') {
      const location = payload.location;
      if (
        location === 'granted' ||
        location === 'denied' ||
        location === 'not-determined' ||
        location === 'restricted'
      ) {
        this.emit({ type: 'permissions', location, demo: false });
      }
      return;
    }
    if (type === 'helper:status') {
      this.emit({
        type: 'status',
        running: payload.running === true,
        scanning: payload.scanning === true,
      });
      return;
    }
    if (type === 'scan:snapshot') {
      const snapshot = normalizeScanCoreSnapshot(
        line.payload && typeof line.payload === 'object'
          ? (line.payload as Record<string, unknown>)
          : line
      );
      if (snapshot) this.emitSnapshot(snapshot);
      return;
    }
    if (type === 'error') {
      this.emitError({
        code: typeof payload.code === 'string' ? payload.code : 'SCANCORE_ERROR',
        message: typeof payload.message === 'string' ? payload.message : 'ScanCore error',
        recoverable: true,
        demoFallback: payload.demoFallback === true,
      });
    }
  }

  private send(command: Record<string, unknown>): void {
    const line = `${JSON.stringify(command)}\n`;
    if (this.socket?.writable) {
      this.socket.write(line);
      return;
    }
    const child = this.child;
    if (!child || !child.stdin.writable) return;
    try {
      child.stdin.write(line);
    } catch {
      // handled by stdin error listener
    }
  }

  requestPermissions(): void {
    this.send({ type: 'permissions:query' });
  }

  setIntervalMs(intervalMs: number): void {
    this.send({ type: 'scan:setIntervalMs', intervalMs: Math.max(3000, Math.floor(intervalMs)) });
  }

  async stop(): Promise<void> {
    if (this.stopping) return;
    this.stopping = true;
    this.send({ type: 'scan:stop' });
    this.send({ type: 'shutdown' });
    this.socket?.end();
    if (this.socketPath) {
      // Stop may race the async LaunchServices startup: kill by socket path now.
      spawn('pkill', ['-f', `--socket ${this.socketPath}`], { stdio: 'ignore' });
    }
    this.launcher?.kill('SIGTERM');
    this.stopTimer = setTimeout(() => {
      if (this.socketPath) {
        // Last resort: the app may ignore shutdown while a TCC prompt is open.
        spawn('pkill', ['-f', `--socket ${this.socketPath}`], { stdio: 'ignore' });
      }
      this.child?.kill('SIGKILL');
      this.launcher?.kill('SIGTERM');
    }, STOP_KILL_TIMEOUT_MS);
    this.stopTimer.unref?.();
  }

  private cleanupTimers(): void {
    if (this.handshakeTimer) clearTimeout(this.handshakeTimer);
    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.handshakeTimer = null;
    this.stopTimer = null;
  }
}
