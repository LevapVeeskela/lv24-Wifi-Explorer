// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ScanService } from '../scan/service.js';
import { runWifiIssues } from './issues.js';

function createDemoService(): ScanService {
  return new ScanService({ ouiLookup: null });
}

describe('runWifiIssues', () => {
  it('flags the open + hidden demo network', async () => {
    const service = createDemoService();
    await service.scan({ provider: 'demo' });
    const payload = await runWifiIssues(service);

    if ('error' in payload) throw new Error(`unexpected error: ${payload.error}`);

    expect(payload).toMatchObject({ source: 'fixtures', demo: true });
    expect(payload.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(payload.counts.weakSecurity).toBe(1);
    expect(payload.counts.hiddenSsid).toBe(1);
    expect(payload.rowsWithIssues).toBeGreaterThan(0);

    const open = payload.rows.find((row) => row.bssid === '02:11:22:33:44:77');
    expect(open).toBeDefined();
    expect(open?.ssid).toBeNull();
    expect(open?.issues).toEqual(
      expect.arrayContaining([
        { id: 'weakSecurity', severity: 'warning', messageKey: 'scan.issue.weakSecurity' },
        { id: 'hiddenSsid', severity: 'warning', messageKey: 'scan.issue.hiddenSsid' },
      ])
    );
    expect(payload.rows.every((row) => row.issues.length > 0)).toBe(true);
  });

  it('narrows rows to one BSSID without changing whole-scan counts', async () => {
    const service = createDemoService();
    await service.scan({ provider: 'demo' });

    const payload = await runWifiIssues(service, { bssid: '02-11-22-33-44-77' });
    if ('error' in payload) throw new Error(`unexpected error: ${payload.error}`);

    expect(payload.rows).toHaveLength(1);
    expect(payload.rows[0]?.bssid).toBe('02:11:22:33:44:77');
    expect(payload.counts.hiddenSsid).toBe(1);
  });

  it('reports not_found for an absent or malformed BSSID', async () => {
    const service = createDemoService();
    await service.scan({ provider: 'demo' });

    expect(await runWifiIssues(service, { bssid: 'aa:bb:cc:dd:ee:ff' })).toEqual({
      error: 'not_found',
    });
    expect(await runWifiIssues(service, { bssid: 'not-a-bssid' })).toEqual({ error: 'not_found' });
  });
});
