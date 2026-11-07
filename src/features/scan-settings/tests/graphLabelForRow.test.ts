import { describe, expect, it } from 'vitest';
import { graphLabelForRow } from '../graphLabelForRow';

const row = {
  ssidHidden: false,
  ssid: 'Campus-WiFi',
  bssid: 'AA:BB:CC:DD:EE:FF',
  vendor: 'Acme Networks',
  annotation: 'Lab AP',
};

describe('graphLabelForRow', () => {
  it('uses SSID by default', () => {
    expect(graphLabelForRow(row, 'ssid', '<hidden>')).toBe('Campus-WiFi');
  });

  it('uses vendor for apName with bssid fallback', () => {
    expect(graphLabelForRow(row, 'apName', '<hidden>')).toBe('Acme Networks');
    expect(
      graphLabelForRow({ ...row, vendor: null }, 'apName', '<hidden>'),
    ).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('uses annotation with SSID fallback', () => {
    expect(graphLabelForRow(row, 'annotation', '<hidden>')).toBe('Lab AP');
    expect(graphLabelForRow({ ...row, annotation: '' }, 'annotation', '<hidden>')).toBe(
      'Campus-WiFi',
    );
  });
});
