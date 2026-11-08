// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { scanCoreScanArgs } from './macos';

describe('macOS ScanCore directed scan args', () => {
  it('omits --ssid for a full scan', () => {
    const args = scanCoreScanArgs({ includeHidden: true, intervalMs: 5000 });
    expect(args).toEqual(['--include-hidden', 'true', '--interval-ms', '5000']);
  });

  it('passes the SSID verbatim as a single argv entry', () => {
    const args = scanCoreScanArgs({
      includeHidden: false,
      intervalMs: 3000,
      directedSsid: 'LV24 Lab: 5G',
    });
    expect(args).toEqual([
      '--include-hidden',
      'false',
      '--interval-ms',
      '3000',
      '--ssid',
      'LV24 Lab: 5G',
    ]);
  });

  it('treats an empty SSID as no directed scan', () => {
    const args = scanCoreScanArgs({ includeHidden: true, intervalMs: 5000, directedSsid: '' });
    expect(args).not.toContain('--ssid');
  });

  it('keeps leading/trailing spaces (SSIDs are not trimmed)', () => {
    const args = scanCoreScanArgs({
      includeHidden: true,
      intervalMs: 5000,
      directedSsid: ' padded ',
    });
    expect(args.at(-1)).toBe(' padded ');
  });
});
