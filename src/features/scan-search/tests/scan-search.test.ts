import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { parseScanQuery } from '../parseScanQuery';
import { matchBss } from '../matchBss';
import { mockBss } from './mockBss';

function mustParse(q: string) {
  const r = parseScanQuery(q);
  assert.equal(r.ok, true, r.ok ? '' : r.error);
  return r.ok ? r.ast : null!;
}

function matches(q: string, bss: ReturnType<typeof mockBss>, ctx?: { annotation?: string }) {
  const ast = mustParse(q);
  return matchBss(bss, ast, ctx);
}

describe('parseScanQuery', () => {
  it('empty query is match-all', () => {
    const r = parseScanQuery('   ');
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.ast.type, 'all');
  });

  it('rejects unclosed quote', () => {
    const r = parseScanQuery('"foo');
    assert.equal(r.ok, false);
  });

  it('parses boolean combinators with implicit AND', () => {
    const r = parseScanQuery('hidden 5ghz');
    assert.equal(r.ok, true);
  });
});

describe('keywords and phrases', () => {
  const campus = mockBss({ bssid: '00:11:22:01:00:01', ssid: 'LV24-Campus', vendor: 'Cisco Systems' });

  it('keyword contains ssid/vendor (case insensitive)', () => {
    assert.equal(matches('campus', campus), true);
    assert.equal(matches('CISCO', campus), true);
    assert.equal(matches('nokia', campus), false);
  });

  it('phrase requires exact field match', () => {
    assert.equal(matches('"LV24-Campus"', campus), true);
    assert.equal(matches('"lv24-campus"', campus), true);
    assert.equal(matches('"LV24"', campus), false);
  });

  it('annotation participates in keyword search', () => {
    assert.equal(matches('lab-ap', campus, { annotation: 'lab-ap-01' }), true);
  });
});

describe('shortcuts', () => {
  const campus = mockBss({ bssid: '00:11:22:01:00:01', ssid: 'LV24-Campus' });
  const ap24 = mockBss({
    bssid: 'aa:bb:cc:00:00:01',
    band: 2.4,
    channel: 6,
    widthMhz: 20,
  });
  const ap5 = mockBss({
    bssid: 'aa:bb:cc:00:00:02',
    band: 5,
    channel: 36,
    widthMhz: 80,
    rssiDbm: -55,
  });

  it('band shortcuts', () => {
    assert.equal(matches('2.4ghz', ap24), true);
    assert.equal(matches('2.4ghz', ap5), false);
    assert.equal(matches('5ghz', ap5), true);
    assert.equal(matches('5', ap5), false);
    assert.equal(matches('5', mockBss({ bssid: 'x', band: 2.4, channel: 5 })), true);
  });

  it('width and channel', () => {
    assert.equal(matches('20mhz', ap24), true);
    assert.equal(matches('80', ap5), true);
    assert.equal(matches('36', ap5), true);
    assert.equal(matches('36-48', ap5), true);
    assert.equal(matches('36-48', mockBss({ bssid: 'y', channel: 60 })), false);
  });

  it('bssid octet fragments', () => {
    assert.equal(matches('aa:', ap24), true);
    assert.equal(matches('aa:bb:', ap24), true);
    assert.equal(matches(':01', ap24), true);
  });

  it('RSSI comparison without key', () => {
    assert.equal(matches('>=-60', ap5), true);
    assert.equal(matches('>=-50', ap5), false);
  });

  it('security tokens', () => {
    const open = mockBss({ bssid: 'o1', isOpen: true, isSecure: false, securityFlags: ['open'] });
    assert.equal(matches('open', open), true);
    assert.equal(matches('secure', ap5), true);
    assert.equal(matches('wpa2', ap5), true);
  });

  it('hidden', () => {
    const hidden = mockBss({ bssid: 'h1', hidden: true });
    assert.equal(matches('hidden', hidden), true);
    assert.equal(matches('<hidden>', hidden), true);
    assert.equal(matches('hidden', campus), false);
  });
});

describe('keyed fields', () => {
  const ap = mockBss({
    bssid: 'a8:9d:21:00:00:01',
    ssid: 'HukkaNet',
    vendor: 'Cisco Systems',
    channel: 60,
    band: 5,
    widthMhz: 20,
    rssiDbm: -68,
    noiseDbm: -95,
    phy: ['a', 'n', 'ac', 'ax'],
    country: 'US',
  });

  it('ssid, bssid, vendor, channel, band', () => {
    assert.equal(matches('ssid:hukka', ap), true);
    assert.equal(matches('bssid:a8:9d:21', ap), true);
    assert.equal(matches('vendor:cisco', ap), true);
    assert.equal(matches('channel:60', ap), true);
    assert.equal(matches('band:5', ap), true);
  });

  it('snr and signal comparisons', () => {
    assert.equal(matches('snr>=25', ap), true);
    assert.equal(matches('signal>=-70', ap), true);
    assert.equal(matches('signal>=-65', ap), false);
    assert.equal(matches('noise<=-90', ap), true);
    assert.equal(matches('noise<=-100', ap), false);
  });

  it('mode and country', () => {
    assert.equal(matches('mode:ax', ap), true);
    assert.equal(matches('country:US', ap), true);
  });
});

describe('boolean logic', () => {
  const a = mockBss({ bssid: 'a1', ssid: 'Alpha', band: 5, channel: 36, isOpen: false });
  const b = mockBss({ bssid: 'b1', ssid: 'Beta', band: 2.4, channel: 6, isOpen: true, isSecure: false, securityFlags: ['open'] });

  it('AND OR NOT with parentheses', () => {
    assert.equal(matches('Alpha AND 5ghz', a), true);
    assert.equal(matches('Alpha AND 2.4ghz', a), false);
    assert.equal(matches('open OR ssid:Alpha', a), true);
    assert.equal(matches('open OR ssid:Alpha', b), true);
    assert.equal(matches('NOT open', a), true);
    assert.equal(matches('NOT open', b), false);
    assert.equal(matches('(open OR ssid:Alpha) AND 5ghz', a), true);
    assert.equal(matches('(open OR ssid:Beta) AND 5ghz', b), false);
  });
});

describe('phy and generation', () => {
  const ax5 = mockBss({ bssid: 'p1', phy: ['a', 'n', 'ac', 'ax'], band: 5 });
  const ax6 = mockBss({ bssid: 'p2', phy: ['ax'], band: 6, channel: 5 });

  it('phy shortcuts', () => {
    assert.equal(matches('ax', ax5), true);
    assert.equal(matches('802.11ac', ax5), true);
  });

  it('generation', () => {
    assert.equal(matches('wifi6', ax5), true);
    assert.equal(matches('wifi6e', ax6), true);
  });
});
