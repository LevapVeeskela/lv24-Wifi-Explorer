import { describe, expect, it } from 'vitest';
import { parseNetshKey, parseNetshProfiles, parseNmcliWifiConnections } from './wifiPassword';

describe('wi-fi password parsers', () => {
  it('reads netsh profiles but skips the interface header', () => {
    const profiles = parseNetshProfiles(`
Profiles on interface Wi-Fi:
Group policy profiles (read only)
---------------------------------
    <None>
User profiles
-------------
    All User Profile     : HomeNet
    All User Profile     : Cafe Guest
`);
    expect(profiles).toEqual(['HomeNet', 'Cafe Guest']);
  });

  it('reads a localized netsh key without splitting on a colon in the password', () => {
    const key = parseNetshKey(`
    Ключ безопасности                 : Отсутствует
    Содержимое ключа                  : pa:ss word
`);
    expect(key).toBe('pa:ss word');
  });

  it('returns null for an open profile', () => {
    expect(parseNetshKey('    Key Content                       : Absent')).toBeNull();
  });

  it('reads nmcli Wi-Fi connections and ignores other types', () => {
    const rows = parseNmcliWifiConnections(
      [
        'HomeNet:11111111-1111-1111-1111-111111111111:802-11-wireless',
        'Wired:22222222-2222-2222-2222-222222222222:802-3-ethernet',
      ].join('\n')
    );
    expect(rows).toEqual([{ name: 'HomeNet', uuid: '11111111-1111-1111-1111-111111111111' }]);
  });
});
