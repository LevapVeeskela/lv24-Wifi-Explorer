#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import {
  createScanProvider,
  type ScanProviderId,
  type ScanSnapshotPayload,
} from '@lv24/wifi-backend';
import type { ObservedBss } from '@lv24/wifi-core';
import { asIsoTime } from '@lv24/wifi-core';
import { mapCoreWlanRecordsToObservedBss, STUB_OUI_LOOKUP } from '@lv24/wifi-core/scan';

type OutputFormat = 'table' | 'json' | 'jsonl' | 'csv';

type CliOptions = {
  command: 'scan' | 'providers' | 'help' | 'version';
  provider: ScanProviderId;
  intervalMs: number;
  count: number;
  timeoutMs: number;
  format: OutputFormat;
  out: string | null;
  includeHidden: boolean;
  /** Directed scan target (macOS); null = full active scan. */
  directedSsid: string | null;
};

const HELP = `lv24-wifi — cross-platform Wi-Fi scan CLI

Usage:
  lv24-wifi scan [options]
  lv24-wifi providers
  lv24-wifi --version

Options:
  --provider <auto|demo|macos-scancore|linux-nmcli|windows-netsh>  default: auto
  --interval <ms>       scan interval (min 3000, default 5000)
  --count <n>           snapshots to collect (default 1)
  --timeout <seconds>   overall timeout (default 30)
  --format <table|json|jsonl|csv>  default: table
  --out <path>          write output to a file instead of stdout
  --exclude-hidden      do not request hidden SSIDs
  --ssid <name>         directed scan: probe only this SSID (alias: --directed)
                        best-effort; macOS may omit BSSID for hidden results
  -h, --help
  -v, --version

Platform notes:
  macOS   uses the bundled Swift ScanCore helper (LV24_SCANCORE_PATH overrides)
  Linux   uses NetworkManager nmcli (RSSI is derived from signal quality)
  Windows uses netsh (English output; localized Windows is not supported yet)
  demo    deterministic fixtures, works everywhere

Directed scan (--ssid) is macOS-only; other providers ignore it and print
DIRECTED_SSID_UNSUPPORTED, then perform the normal full scan.
`;

function parseArgs(argv: readonly string[]): CliOptions {
  const options: CliOptions = {
    command: 'scan',
    provider: 'auto',
    intervalMs: 5000,
    count: 1,
    timeoutMs: 30_000,
    format: 'table',
    out: null,
    includeHidden: true,
    directedSsid: null,
  };
  if (argv.length === 0) {
    options.command = 'help';
    return options;
  }
  const first = argv[0];
  if (first === 'providers') {
    options.command = 'providers';
    return options;
  }
  if (first === '--version' || first === '-v') {
    options.command = 'version';
    return options;
  }
  if (first === '--help' || first === '-h' || first === 'help') {
    options.command = 'help';
    return options;
  }
  if (first !== 'scan') {
    throw new Error(`Unknown command: ${first}`);
  }
  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i]!;
    const next = () => {
      const value = argv[i + 1];
      if (value == null) throw new Error(`Missing value for ${arg}`);
      i += 1;
      return value;
    };
    switch (arg) {
      case '--provider':
        options.provider = next() as ScanProviderId;
        break;
      case '--interval':
        options.intervalMs = Math.max(3000, Number.parseInt(next(), 10) || 5000);
        break;
      case '--count':
        options.count = Math.max(1, Number.parseInt(next(), 10) || 1);
        break;
      case '--timeout':
        options.timeoutMs = Math.max(1000, (Number.parseInt(next(), 10) || 30) * 1000);
        break;
      case '--format':
        options.format = next() as OutputFormat;
        break;
      case '--out':
        options.out = next();
        break;
      case '--exclude-hidden':
        options.includeHidden = false;
        break;
      case '--ssid':
      case '--directed': {
        // Value is taken verbatim: SSIDs may contain spaces and punctuation.
        const value = next();
        options.directedSsid = value.length > 0 ? value : null;
        break;
      }
      case '--help':
      case '-h':
        options.command = 'help';
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

function mapSnapshot(payload: ScanSnapshotPayload): ObservedBss[] {
  return mapCoreWlanRecordsToObservedBss(
    payload.networks,
    undefined,
    asIsoTime(payload.capturedAt),
    { location: payload.location, ouiLookup: STUB_OUI_LOOKUP }
  );
}

function table(rows: readonly ObservedBss[]): string {
  const header = ['SSID', 'BSSID', 'RSSI', 'CH', 'BAND', 'WIDTH', 'SECURITY'];
  const lines = rows.map((row) => {
    const ssid =
      row.identity.ssid.status === 'available'
        ? (row.identity.ssid.value.utf8 ?? row.identity.ssid.value.displayName)
        : '—';
    const bssid = row.identity.bssid.status === 'available' ? row.identity.bssid.value : '—';
    return [
      ssid || '‹hidden›',
      bssid,
      String(row.signal.rssiDbm),
      String(row.channel.number),
      String(row.channel.band),
      row.channel.widthMhz === 'unknown' ? '—' : String(row.channel.widthMhz),
      row.security.primary,
    ];
  });
  const widths = header.map((h, i) => Math.max(h.length, ...lines.map((line) => line[i]!.length)));
  const fmt = (cells: readonly string[]) => cells.map((c, i) => c.padEnd(widths[i]!)).join('  ');
  return [fmt(header), fmt(widths.map((w) => '─'.repeat(w))), ...lines.map(fmt)].join('\n');
}

function csvEscape(value: string): string {
  const safe =
    /^[=+\-@\t\r]/.test(value) && !/^[+-]?\d+(\.\d+)?$/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function csv(rows: readonly ObservedBss[]): string {
  const header = 'ssid,bssid,rssi_dbm,channel,band,width_mhz,security';
  const body = rows.map((row) => {
    const ssid =
      row.identity.ssid.status === 'available'
        ? (row.identity.ssid.value.utf8 ?? row.identity.ssid.value.displayName)
        : '';
    const bssid = row.identity.bssid.status === 'available' ? row.identity.bssid.value : '';
    return [
      ssid,
      bssid,
      String(row.signal.rssiDbm),
      String(row.channel.number),
      String(row.channel.band),
      row.channel.widthMhz === 'unknown' ? '' : String(row.channel.widthMhz),
      row.security.primary,
    ]
      .map(csvEscape)
      .join(',');
  });
  return `${[header, ...body].join('\n')}\n`;
}

async function runScan(options: CliOptions): Promise<void> {
  const provider = createScanProvider({
    provider: options.provider,
    binaryPath: process.env.LV24_SCANCORE_PATH,
  });
  const collected: ScanSnapshotPayload[] = [];
  let done = false;

  const finish = async () => {
    if (done) return;
    done = true;
    await provider.stop();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const payloads = collected.slice(0, options.count);
    if (payloads.length === 0) {
      process.stderr.write('No snapshots collected.\n');
      process.exitCode = 1;
      return;
    }
    const rows = payloads.at(-1)!.networks.length ? mapSnapshot(payloads.at(-1)!) : [];
    const output =
      options.format === 'json'
        ? `${JSON.stringify({ provider: provider.id, snapshots: payloads }, null, 2)}\n`
        : options.format === 'jsonl'
          ? payloads.map((p) => JSON.stringify(p)).join('\n') + '\n'
          : options.format === 'csv'
            ? csv(rows)
            : table(rows);
    if (options.out) writeFileSync(options.out, output, 'utf8');
    else process.stdout.write(output);
  };

  const timer = setTimeout(() => {
    process.stderr.write(`Timed out after ${options.timeoutMs} ms.\n`);
    void finish();
  }, options.timeoutMs);
  timer.unref?.();

  provider.onEvent((event) => {
    if (event.type === 'snapshot') {
      collected.push(event.payload);
      if (collected.length >= options.count) {
        clearTimeout(timer);
        void finish();
      }
      return;
    }
    if (event.type === 'error') {
      process.stderr.write(`${event.error.code}: ${event.error.message}\n`);
      if (!event.error.recoverable) {
        clearTimeout(timer);
        void finish();
      }
    }
  });

  await provider.start({
    intervalMs: options.intervalMs,
    includeHidden: options.includeHidden,
    ...(options.directedSsid ? { directedSsid: options.directedSsid } : {}),
  });
}

async function main(): Promise<void> {
  let options: CliOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n\n${HELP}`);
    process.exitCode = 2;
    return;
  }

  if (options.command === 'help') {
    process.stdout.write(HELP);
    return;
  }
  if (options.command === 'version') {
    process.stdout.write('0.1.0\n');
    return;
  }
  if (options.command === 'providers') {
    process.stdout.write(
      [
        'auto             pick the native provider for this platform',
        'macos-scancore   macOS helper (Swift, universal)',
        'linux-nmcli      Linux NetworkManager nmcli',
        'windows-netsh    Windows netsh',
        'demo             deterministic fixtures',
      ].join('\n') + '\n'
    );
    return;
  }
  await runScan(options);
}

void main();

export { parseArgs, table, csv, mapSnapshot };
