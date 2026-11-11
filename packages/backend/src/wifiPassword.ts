import { execFile } from 'node:child_process';

export type WifiPasswordCode = 'NOT_SAVED' | 'NO_PASSWORD' | 'DENIED' | 'UNSUPPORTED' | 'ERROR';

export type WifiPasswordResult =
  | { ok: true; password: string }
  | { ok: false; code: WifiPasswordCode; message: string };

export type SavedWifiProfilesResult =
  | { ok: true; profiles: readonly string[]; listable: boolean }
  | { ok: false; code: WifiPasswordCode; message: string };

const KEY_LABELS = /^(?:key content|содержимое ключа|密钥内容|金鑰內容|密钥|金钥)\s*:/i;
const PROFILE_LABEL = /(profile|профил|配置文件)/i;
const ABSENT_VALUES = /^(?:absent|отсутствует|不存在|没有|无|—|-)$/i;

function firstValue(line: string): string {
  const index = line.indexOf(':');
  return index < 0 ? '' : line.slice(index + 1).trim();
}

export function parseNetshProfiles(stdout: string): string[] {
  const profiles: string[] = [];
  for (const raw of stdout.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.includes(':')) continue;
    const label = line.slice(0, line.indexOf(':')).trim();
    if (!PROFILE_LABEL.test(label)) continue;
    if (/(interface|интерфейс|接口)/i.test(label)) continue;
    const value = firstValue(line);
    if (value && !ABSENT_VALUES.test(value)) profiles.push(value);
  }
  return [...new Set(profiles)];
}

export function parseNetshKey(stdout: string): string | null {
  for (const raw of stdout.split(/\r?\n/)) {
    const line = raw.trim();
    if (!KEY_LABELS.test(line)) continue;
    const value = firstValue(line);
    if (!value || ABSENT_VALUES.test(value)) return null;
    return value;
  }
  return null;
}

/** `nmcli -t -f NAME,UUID,TYPE connection show` → Wi-Fi connections. */
export function parseNmcliWifiConnections(stdout: string): { uuid: string; name: string }[] {
  const out: { uuid: string; name: string }[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const fields = line.split(/(?<!\\):/);
    if (fields.length < 3) continue;
    const [name, uuid, type] = fields;
    if (type !== '802-11-wireless' || !uuid) continue;
    out.push({ uuid: uuid.replace(/\\:/g, ':'), name: name.replace(/\\:/g, ':') });
  }
  return out;
}

type CommandResult = { stdout: string; stderr: string; code: number | string | null };

function run(command: string, args: string[], timeout = 12_000): Promise<CommandResult> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      { timeout, maxBuffer: 2 * 1024 * 1024, windowsHide: true },
      (error, stdout, stderr) => {
        resolve({
          stdout,
          stderr,
          code: error ? ((error as NodeJS.ErrnoException).code ?? 'ERROR') : 0,
        });
      }
    );
  });
}

function denied(code: CommandResult['code']): boolean {
  return code === 'EACCES' || code === 'EPERM' || code === 1 || code === 5;
}

function sanitize(message: string): string {
  return message.trim().slice(0, 240);
}

async function windowsProfiles(): Promise<SavedWifiProfilesResult> {
  const result = await run('netsh', ['wlan', 'show', 'profiles']);
  if (result.code !== 0) {
    return {
      ok: false,
      code: denied(result.code) ? 'DENIED' : 'ERROR',
      message: sanitize(result.stderr),
    };
  }
  return { ok: true, profiles: parseNetshProfiles(result.stdout), listable: true };
}

async function windowsPassword(ssid: string): Promise<WifiPasswordResult> {
  const profiles = await windowsProfiles();
  if (profiles.ok && !profiles.profiles.includes(ssid)) {
    return { ok: false, code: 'NOT_SAVED', message: 'network is not saved on this device' };
  }
  const result = await run('netsh', ['wlan', 'show', 'profile', `name=${ssid}`, 'key=clear']);
  if (result.code !== 0) {
    return {
      ok: false,
      code: denied(result.code) ? 'DENIED' : 'ERROR',
      message: sanitize(result.stderr) || 'netsh could not read the profile',
    };
  }
  const password = parseNetshKey(result.stdout);
  if (!password) return { ok: false, code: 'NO_PASSWORD', message: 'profile has no stored key' };
  return { ok: true, password };
}

async function macProfiles(): Promise<SavedWifiProfilesResult> {
  // Keychain has no cheap "list AirPort passwords" API; the UI asks on demand.
  return { ok: true, profiles: [], listable: false };
}

async function macPassword(ssid: string): Promise<WifiPasswordResult> {
  const attempts: string[][] = [
    ['find-generic-password', '-D', 'AirPort network password', '-a', ssid, '-w'],
    ['find-generic-password', '-a', ssid, '-w'],
  ];
  for (const args of attempts) {
    const result = await run('security', args, 20_000);
    if (result.code === 0 && result.stdout.trim()) {
      return { ok: true, password: result.stdout.trim() };
    }
    if (result.code !== 0 && !denied(result.code) && String(result.code) !== '44') {
      continue;
    }
    if (denied(result.code)) {
      return { ok: false, code: 'DENIED', message: 'Keychain access was denied' };
    }
  }
  return { ok: false, code: 'NOT_SAVED', message: 'no Keychain item for this network' };
}

async function linuxConnections(): Promise<SavedWifiProfilesResult> {
  const result = await run('nmcli', ['-t', '-f', 'NAME,UUID,TYPE', 'connection', 'show']);
  if (result.code !== 0) {
    return {
      ok: false,
      code: denied(result.code) ? 'DENIED' : 'ERROR',
      message: sanitize(result.stderr),
    };
  }
  const names = parseNmcliWifiConnections(result.stdout).map((item) => item.name);
  return { ok: true, profiles: [...new Set(names)], listable: true };
}

async function linuxPassword(ssid: string): Promise<WifiPasswordResult> {
  const list = await run('nmcli', ['-t', '-f', 'NAME,UUID,TYPE', 'connection', 'show']);
  if (list.code !== 0) {
    return {
      ok: false,
      code: denied(list.code) ? 'DENIED' : 'ERROR',
      message: sanitize(list.stderr),
    };
  }
  const connections = parseNmcliWifiConnections(list.stdout);
  let uuid: string | null = null;
  for (const connection of connections) {
    const value = await run('nmcli', [
      '-g',
      '802-11-wireless.ssid',
      'connection',
      'show',
      connection.uuid,
    ]);
    if (value.code === 0 && value.stdout.trim() === ssid) {
      uuid = connection.uuid;
      break;
    }
  }
  if (!uuid)
    return { ok: false, code: 'NOT_SAVED', message: 'network is not saved on this device' };

  const secret = await run('nmcli', [
    '-s',
    '-g',
    '802-11-wireless-security.psk',
    'connection',
    'show',
    uuid,
  ]);
  if (secret.code !== 0) {
    return {
      ok: false,
      code: denied(secret.code) ? 'DENIED' : 'ERROR',
      message: sanitize(secret.stderr),
    };
  }
  const password = secret.stdout.trim();
  if (!password) return { ok: false, code: 'NO_PASSWORD', message: 'profile has no PSK' };
  return { ok: true, password };
}

export async function listSavedWifiProfiles(
  platform: NodeJS.Platform = process.platform
): Promise<SavedWifiProfilesResult> {
  if (platform === 'win32') return windowsProfiles();
  if (platform === 'darwin') return macProfiles();
  if (platform === 'linux') return linuxConnections();
  return { ok: false, code: 'UNSUPPORTED', message: 'unsupported platform' };
}

export async function readSavedWifiPassword(
  ssid: string,
  platform: NodeJS.Platform = process.platform
): Promise<WifiPasswordResult> {
  const value = ssid.trim();
  if (!value || value.length > 128) {
    return { ok: false, code: 'ERROR', message: 'invalid SSID' };
  }
  if (platform === 'win32') return windowsPassword(value);
  if (platform === 'darwin') return macPassword(value);
  if (platform === 'linux') return linuxPassword(value);
  return { ok: false, code: 'UNSUPPORTED', message: 'unsupported platform' };
}
