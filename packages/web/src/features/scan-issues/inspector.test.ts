import { describe, expect, it } from 'vitest';
import { buildIssueInspectorGroups, rowsWithIssues } from './inspector';

const rows = [
  {
    id: 'a',
    bssid: '00:11:22:33:44:01',
    ssid: 'A',
    ssidHidden: false,
    rssiDbm: -70,
    issueIds: ['lowSignal', 'weakSecurity'] as const,
  },
  {
    id: 'b',
    bssid: '00:11:22:33:44:02',
    ssid: 'B',
    ssidHidden: false,
    rssiDbm: -50,
    issueIds: ['lowSignal'] as const,
  },
  {
    id: 'c',
    bssid: '00:11:22:33:44:03',
    ssid: 'C',
    ssidHidden: false,
    rssiDbm: -60,
    issueIds: [] as const,
  },
];

describe('issues inspector grouping', () => {
  it('groups by issue, biggest group first and rows by RSSI', () => {
    const groups = buildIssueInspectorGroups(rows);
    expect(groups[0]?.id).toBe('lowSignal');
    expect(groups[0]?.rows.map((row) => row.id)).toEqual(['b', 'a']);
    expect(groups.some((group) => group.id === 'weakSecurity')).toBe(true);
  });

  it('drops rows without issues', () => {
    expect(rowsWithIssues(rows).map((row) => row.id)).toEqual(['a', 'b']);
  });

  it('returns an empty list for a clean scan', () => {
    expect(buildIssueInspectorGroups([rows[2]])).toEqual([]);
  });
});
