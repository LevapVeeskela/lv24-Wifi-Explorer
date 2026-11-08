import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { createLv24ScanDocument } from '../createDocument';
import { parseLv24Scan } from '../parse';
import { serializeLv24Scan } from '../serialize';
import { fixtureBss } from './fixtureBss';

function validText(): string {
  const document = createLv24ScanDocument({
    networks: [fixtureBss('aa:bb:cc:00:00:01', 'Valid')],
    appVersion: '0.1.0',
    capturedAt: '2026-09-17T19:00:00.000Z',
  });
  return serializeLv24Scan(document);
}

describe('parseLv24Scan hostile input', () => {
  it('rejects null / non-object network rows instead of throwing later', () => {
    const doc = JSON.parse(validText()) as Record<string, unknown>;
    doc.networks = [null];
    const parsed = parseLv24Scan(JSON.stringify(doc), 'hostile.lv24scan');
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.equal(parsed.code, 'invalid-document');
  });

  it('rejects malformed identity/signal structures', () => {
    const doc = JSON.parse(validText()) as { networks: Array<Record<string, unknown>> };
    doc.networks[0].signal = { rssiDbm: 'loud' };
    const parsed = parseLv24Scan(JSON.stringify(doc), 'hostile.lv24scan');
    assert.equal(parsed.ok, false);
  });

  it('caps network count', () => {
    const doc = JSON.parse(validText()) as { networks: unknown[] };
    doc.networks = Array.from({ length: 10_001 }, () => null);
    const parsed = parseLv24Scan(JSON.stringify(doc), 'hostile.lv24scan');
    assert.equal(parsed.ok, false);
  });

  it('accepts the legitimate round-trip', () => {
    const parsed = parseLv24Scan(validText(), 'ok.lv24scan');
    assert.equal(parsed.ok, true);
  });
});
