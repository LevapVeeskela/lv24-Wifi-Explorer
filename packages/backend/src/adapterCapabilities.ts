import { execFile } from 'node:child_process';
import type { AdapterCapabilities, BandGhz, PhyLetter, SecurityKind } from '@lv24/wifi-core';

export type AdapterCapabilitiesResult =
  | { ok: true; capabilities: AdapterCapabilities }
  | { ok: false; code: 'COMMAND_FAILED' | 'PARSE_FAILED' | 'UNSUPPORTED'; message: string };

const KNOWN_PHY = new Set<PhyLetter>(['a', 'b', 'g', 'n', 'ac', 'ax', 'be']);

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function phyTokens(text: string): PhyLetter[] {
  const found: PhyLetter[] = [];
  for (const match of text.matchAll(/802\.11\s*([a-z]+(?:\s*\/\s*[a-z]+)*)/gi)) {
    for (const token of match[1]!.split(/\s*\/\s*/)) {
      const value = token.toLowerCase();
      if (KNOWN_PHY.has(value as PhyLetter)) found.push(value as PhyLetter);
    }
  }
  // `iw` does not print 802.11 tokens; map its capability blocks.
  if (found.length === 0) {
    if (/\bEHT\b/i.test(text)) found.push('be');
    if (/\bHE\b/i.test(text)) found.push('ax');
    if (/\bVHT\b/i.test(text)) found.push('ac');
    if (/\b(?:HT|VHT|HE|EHT)\b/i.test(text)) found.push('n');
  }
  return unique(found);
}

function highestPhy(phy: readonly PhyLetter[]): PhyLetter | null {
  const rank: Record<PhyLetter, number> = { b: 1, a: 1, g: 2, n: 3, ac: 4, ax: 5, be: 6 };
  let best: PhyLetter | null = null;
  for (const item of phy) {
    if (best == null || rank[item] > rank[best]) best = item;
  }
  return best;
}

function widthForPhy(phy: readonly PhyLetter[]): number {
  const highest = highestPhy(phy);
  if (highest === 'be') return 320;
  if (highest === 'ax') return 160;
  if (highest === 'ac') return 80;
  if (highest === 'n') return 40;
  return 20;
}

function bandsForPhy(phy: readonly PhyLetter[], text = ''): BandGhz[] {
  const bands: BandGhz[] = [];
  if (phy.some((item) => item === 'b' || item === 'g' || item === 'n')) bands.push(2.4);
  if (
    phy.some(
      (item) => item === 'a' || item === 'n' || item === 'ac' || item === 'ax' || item === 'be'
    )
  ) {
    bands.push(5);
  }
  if (highestPhy(phy) === 'be' || /(^|[^0-9])6\s*GHz[^\n]*(yes|да|是|支持|supported)/i.test(text)) {
    bands.push(6);
  }
  return unique(bands);
}

function securityTokens(text: string): SecurityKind[] {
  const found: SecurityKind[] = [];
  if (/wpa3[^\n]*enterprise/i.test(text)) found.push('wpa3-enterprise');
  if (/wpa3[^\n]*(personal|sae)|sae/i.test(text)) found.push('wpa3-personal');
  if (/wpa2[^\n]*enterprise/i.test(text)) found.push('wpa2-enterprise');
  if (/wpa2/i.test(text)) found.push('wpa2-personal');
  if (/wpa(?!3|2)/i.test(text)) found.push('wpa-personal');
  if (/wep/i.test(text)) found.push('wep');
  if (/(^|\s)open(\s|$)/i.test(text)) found.push('open');
  return unique(found);
}

/** Parse `netsh wlan show drivers` (labels are localized; values are not). */
export function parseNetshCapabilities(stdout: string): AdapterCapabilities {
  const phy = phyTokens(stdout);
  const interfaceMatch = stdout.match(
    /^\s*(?:Interface name|Имя интерфейса|接口名称)\s*:\s*(.+)$/im
  );
  return {
    bands: bandsForPhy(phy, stdout),
    phy,
    maxWidthMhz: widthForPhy(phy),
    security: securityTokens(stdout),
    streams: null,
    interfaceName: interfaceMatch?.[1]?.trim() ?? null,
    source: 'netsh',
    estimated: true,
  };
}

/** Parse `system_profiler SPAirPortDataType`. */
export function parseSystemProfilerCapabilities(stdout: string): AdapterCapabilities {
  const phy = phyTokens(stdout);
  const bands = bandsForPhy(phy, stdout);
  for (const match of stdout.matchAll(/(2|5|6)\s*GHz/gi)) {
    const raw = Number(match[1]);
    const band: BandGhz | null = raw === 2 ? 2.4 : raw === 5 ? 5 : raw === 6 ? 6 : null;
    if (band != null) bands.push(band);
  }
  return {
    bands: unique(bands),
    phy,
    maxWidthMhz: widthForPhy(phy),
    // macOS supports WPA2/WPA3 on current hardware; the exact AKM set is not
    // exposed by system_profiler. Mark the result as estimated.
    security: ['wpa3-personal', 'wpa3-transition', 'wpa2-personal', 'open'],
    streams: null,
    interfaceName: null,
    source: 'system_profiler',
    estimated: true,
  };
}

/** Parse `iw list` (Linux). */
export function parseIwCapabilities(stdout: string): AdapterCapabilities {
  const phy = phyTokens(stdout);
  const bands: BandGhz[] = [];
  if (/^\s*Band 1:/m.test(stdout) || /24[0-9]{2}\s*MHz/m.test(stdout)) bands.push(2.4);
  if (/^\s*Band 2:/m.test(stdout) || /5[0-9]{3}\s*MHz/m.test(stdout)) bands.push(5);
  if (/^\s*Band 4:/m.test(stdout) || /6[0-9]{3}\s*MHz/m.test(stdout)) bands.push(6);
  let maxWidth = widthForPhy(phy);
  for (const match of stdout.matchAll(/\b(20|40|80|160|320)\s*MHz\b/gi)) {
    maxWidth = Math.max(maxWidth, Number(match[1]));
  }
  const security: SecurityKind[] = [];
  if (/\bSAE\b/i.test(stdout)) security.push('wpa3-personal');
  if (/\bWPA3\b/i.test(stdout)) security.push('wpa3-personal');
  if (/\bWPA2\b/i.test(stdout)) security.push('wpa2-personal');
  return {
    bands: unique(bands),
    phy,
    maxWidthMhz: maxWidth,
    security: unique(security),
    streams: null,
    interfaceName: null,
    source: 'iw',
    estimated: true,
  };
}

export function demoAdapterCapabilities(): AdapterCapabilities {
  return {
    bands: [2.4, 5, 6],
    phy: ['be', 'ax', 'ac', 'n'],
    maxWidthMhz: 320,
    security: ['wpa3-personal', 'wpa3-transition', 'wpa2-personal', 'open'],
    streams: 2,
    interfaceName: 'demo0',
    source: 'demo',
    estimated: false,
  };
}

function unknownCapabilities(): AdapterCapabilities {
  return {
    bands: [],
    phy: [],
    maxWidthMhz: null,
    security: [],
    streams: null,
    interfaceName: null,
    source: 'unknown',
    estimated: true,
  };
}

function run(command: string, args: string[], timeout = 12_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      { timeout, maxBuffer: 4 * 1024 * 1024, windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || error.message));
          return;
        }
        resolve(stdout);
      }
    );
  });
}

export async function readAdapterCapabilities(
  platform: NodeJS.Platform = process.platform
): Promise<AdapterCapabilitiesResult> {
  try {
    if (platform === 'win32') {
      const stdout = await run('netsh', ['wlan', 'show', 'drivers']);
      return { ok: true, capabilities: parseNetshCapabilities(stdout) };
    }
    if (platform === 'darwin') {
      const stdout = await run('system_profiler', ['SPAirPortDataType']);
      return { ok: true, capabilities: parseSystemProfilerCapabilities(stdout) };
    }
    if (platform === 'linux') {
      const stdout = await run('iw', ['list']);
      return { ok: true, capabilities: parseIwCapabilities(stdout) };
    }
    return { ok: true, capabilities: unknownCapabilities() };
  } catch (error) {
    return {
      ok: false,
      code: 'COMMAND_FAILED',
      message: error instanceof Error ? error.message.slice(0, 300) : 'adapter capabilities failed',
    };
  }
}
