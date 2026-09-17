import { describe, expect, it } from 'vitest';
import { essGroupKeyOf, groupEss } from './ess';
import { makeObservedBss } from './testSupport';

describe('groupEss', () => {
  it('groups visible BSS by ssidData and isolates hidden / IBSS', () => {
    const a = makeObservedBss({ bssid: '00:11:22:00:00:01', ssid: 'Campus', band: 2.4, channel: 6 });
    const b = makeObservedBss({
      bssid: '00:11:22:00:00:02',
      ssid: 'Campus',
      band: 5,
      channel: 36,
      security: 'wpa3-personal',
    });
    const hiddenA = makeObservedBss({ bssid: '00:11:22:00:00:10', hidden: true });
    const hiddenB = makeObservedBss({ bssid: '00:11:22:00:00:11', hidden: true });
    const ibss = makeObservedBss({
      bssid: '00:11:22:00:00:20',
      ssid: 'Campus',
      ibss: true,
    });

    const groups = groupEss([a, b, hiddenA, hiddenB, ibss]);
    const infra = groups.filter((g) => g.kind === 'infrastructure');
    const hidden = groups.filter((g) => g.kind === 'hidden-singleton');
    const adhoc = groups.filter((g) => g.kind === 'ibss');

    expect(infra).toHaveLength(1);
    expect(infra[0]?.bssCount).toBe(2);
    expect(infra[0]?.key).toBe(essGroupKeyOf(a).key);
    expect(infra[0]?.securityMixed).toBe(true);
    expect(infra[0]?.bandMix).toEqual([2.4, 5]);

    expect(hidden).toHaveLength(2);
    expect(hidden.every((g) => g.bssCount === 1)).toBe(true);
    expect(hidden[0]?.key).not.toBe(hidden[1]?.key);

    expect(adhoc).toHaveLength(1);
    expect(String(adhoc[0]?.key)).toMatch(/^ibss:/);
  });

  it('does not merge different ssidData', () => {
    const groups = groupEss([
      makeObservedBss({ bssid: '00:11:22:00:00:01', ssid: 'Alpha' }),
      makeObservedBss({ bssid: '00:11:22:00:00:02', ssid: 'Beta' }),
    ]);
    expect(groups).toHaveLength(2);
  });
});
