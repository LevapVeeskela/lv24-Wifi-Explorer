import { describe, expect, it } from 'vitest';
import { importCapture, isCaptureFile } from './index';

/* ------------------------------------------------------------------ */
/* byte builders (synthetic captures, no fixtures on disk)            */
/* ------------------------------------------------------------------ */

function concat(chunks: readonly (readonly number[] | Uint8Array)[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk instanceof Uint8Array ? chunk : Uint8Array.from(chunk), offset);
    offset += chunk.length;
  }
  return out;
}

function u16(value: number, le: boolean): number[] {
  return le ? [value & 0xff, (value >>> 8) & 0xff] : [(value >>> 8) & 0xff, value & 0xff];
}

function u32(value: number, le: boolean): number[] {
  const v = value >>> 0;
  return le
    ? [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]
    : [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff];
}

function ie(id: number, payload: readonly number[]): number[] {
  return [id, payload.length, ...payload];
}

function ssidIe(name: string): number[] {
  return ie(0, Array.from(new TextEncoder().encode(name)));
}

function rsnIe(akmTypes: readonly number[]): number[] {
  return ie(48, [
    0x01,
    0x00,
    0x00,
    0x0f,
    0xac,
    0x04,
    0x01,
    0x00,
    0x00,
    0x0f,
    0xac,
    0x04,
    akmTypes.length & 0xff,
    (akmTypes.length >>> 8) & 0xff,
    ...akmTypes.flatMap((type) => [0x00, 0x0f, 0xac, type]),
    0x00,
    0x00,
  ]);
}

const WPA_PSK_IE = ie(
  221,
  [
    0x00, 0x50, 0xf2, 0x01, 0x01, 0x00, 0x00, 0x50, 0xf2, 0x02, 0x01, 0x00, 0x00, 0x50, 0xf2, 0x02,
    0x01, 0x00, 0x00, 0x50, 0xf2, 0x02,
  ]
);

function htCapsIe(): number[] {
  return ie(45, new Array<number>(26).fill(0));
}

function htOperationIe(primary: number, secondaryOffset: number): number[] {
  const payload = new Array<number>(22).fill(0);
  payload[0] = primary;
  payload[1] = secondaryOffset & 0x3;
  return ie(61, payload);
}

function vhtCapsIe(): number[] {
  return ie(191, new Array<number>(12).fill(0));
}

function vhtOperationIe(width: number): number[] {
  return ie(192, [width, 42, 0, 0, 0, 0, 0, 0]);
}

function countryIe(code: string): number[] {
  return ie(7, [code.charCodeAt(0), code.charCodeAt(1), 0x20]);
}

const BSSID = [0xaa, 0xbb, 0xcc, 0x0d, 0x0e, 0x0f];

interface BeaconOptions {
  subtype?: 8 | 5;
  ssid?: string | null;
  ds?: number | null;
  ies?: readonly number[][];
  capability?: number;
  interval?: number;
  fcs?: boolean;
}

function beaconFrame(options: BeaconOptions = {}): Uint8Array {
  const subtype = options.subtype ?? 8;
  const capability = options.capability ?? 0x0401;
  const ies: number[] = [];
  if (options.ssid !== null) ies.push(...ssidIe(options.ssid ?? 'test-net'));
  if (options.ds !== null) ies.push(...ie(3, [options.ds ?? 6]));
  for (const extra of options.ies ?? []) ies.push(...extra);
  if (options.fcs === true) ies.push(0xde, 0xad, 0xbe, 0xef);

  return Uint8Array.from([
    subtype << 4, // frame control: version 0, type 0 (management)
    0x00, // flags
    0x00,
    0x00, // duration
    0xff,
    0xff,
    0xff,
    0xff,
    0xff,
    0xff, // addr1 broadcast
    ...BSSID, // addr2
    ...BSSID, // addr3 = BSSID
    0x00,
    0x00, // sequence control
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0, // timestamp
    ...u16(options.interval ?? 100, true),
    ...u16(capability, true),
    ...ies,
  ]);
}

interface RadiotapOptions {
  signal?: number;
  frequencyMhz?: number;
  flags?: number;
  antenna?: number;
  extraPresentBit?: number;
}

/** flags + rate + channel + signal (+ antenna) radiotap header. */
function radiotapHeader(options: RadiotapOptions = {}): number[] {
  const frequencyMhz = options.frequencyMhz ?? 2437;
  const signal = options.signal ?? -42;
  const flags = options.flags ?? 0;
  let present = 0x2 | 0x4 | 0x8 | 0x20;
  if (options.antenna !== undefined) present |= 0x800;
  if (options.extraPresentBit !== undefined) present |= 1 << options.extraPresentBit;

  const fields: number[] = [];
  const pos = (): number => 8 + fields.length;
  const alignTo = (align: number): void => {
    while (pos() % align !== 0) fields.push(0);
  };

  fields.push(flags);
  fields.push(0x02); // 1 Mbps
  alignTo(2);
  fields.push(...u16(frequencyMhz, true), 0x00, 0x00);
  fields.push(signal & 0xff);
  if (options.antenna !== undefined) fields.push(options.antenna);

  const length = pos();
  return [0, 0, ...u16(length, true), ...u32(present, true), ...fields];
}

function radiotapFrame(dot11: Uint8Array, options: RadiotapOptions = {}): Uint8Array {
  return concat([radiotapHeader(options), dot11]);
}

interface PcapOptions {
  le?: boolean;
  nano?: boolean;
  linktype?: number;
}

function pcapFile(frames: readonly Uint8Array[], options: PcapOptions = {}): Uint8Array {
  const le = options.le ?? true;
  const nano = options.nano ?? false;
  const linktype = options.linktype ?? 127;
  const magic = nano ? 0xa1b23c4d : 0xa1b2c3d4;
  const chunks: number[][] = [
    u32(magic, le),
    u16(2, le),
    u16(4, le),
    u32(0, le),
    u32(0, le),
    u32(65535, le),
    u32(linktype, le),
  ];
  for (const frame of frames) {
    chunks.push([
      ...u32(0, le), // ts_sec
      ...u32(0, le), // ts_frac
      ...u32(frame.length, le),
      ...u32(frame.length, le),
    ]);
    chunks.push(Array.from(frame));
  }
  return concat(chunks);
}

function ngBlock(type: number, body: readonly number[], le: boolean): number[] {
  const padded = [...body];
  while (padded.length % 4 !== 0) padded.push(0);
  const total = 12 + padded.length;
  return [...u32(type, le), ...u32(total, le), ...padded, ...u32(total, le)];
}

function sectionHeader(le: boolean): number[] {
  return ngBlock(
    0x0a0d0d0a,
    [
      ...u32(0x1a2b3c4d, le),
      ...u16(1, le),
      ...u16(0, le),
      ...u32(0xffffffff, le),
      ...u32(0xffffffff, le),
    ],
    le
  );
}

function interfaceBlock(linktype: number, le: boolean): number[] {
  return ngBlock(1, [...u16(linktype, le), ...u16(0, le), ...u32(65535, le)], le);
}

function enhancedPacketBlock(frame: Uint8Array, le: boolean): number[] {
  return ngBlock(
    6,
    [
      ...u32(0, le), // interface 0
      ...u32(0, le),
      ...u32(0, le),
      ...u32(frame.length, le),
      ...u32(frame.length, le),
      ...Array.from(frame),
    ],
    le
  );
}

function simplePacketBlock(frame: Uint8Array, le: boolean): number[] {
  return ngBlock(3, [...u32(frame.length, le), ...Array.from(frame)], le);
}

/* ------------------------------------------------------------------ */
/* tests                                                              */
/* ------------------------------------------------------------------ */

describe('classic pcap import', () => {
  it('parses a little-endian microsecond beacon with radiotap', () => {
    const frame = radiotapFrame(
      beaconFrame({
        ssid: 'test-net',
        ds: 6,
        ies: [rsnIe([2]), htCapsIe(), htOperationIe(6, 1), countryIe('US')],
      })
    );

    const result = importCapture(pcapFile([frame]));

    expect(result.frames).toBe(1);
    expect(result.warnings).toEqual([]);
    expect(result.records).toHaveLength(1);

    const record = result.records[0]!;
    expect(record.bssid).toBe('aa:bb:cc:0d:0e:0f');
    expect(record.ssid).toBe('test-net');
    expect(record.ssidData).toEqual(Array.from(new TextEncoder().encode('test-net')));
    expect(record.rssiDbm).toBe(-42);
    expect(record.noiseDbm).toBe(0);
    expect(record.channelNumber).toBe(6);
    expect(record.channelBand).toBe('2ghz');
    expect(record.channelWidth).toBe('40mhz');
    expect(record.countryCode).toBe('US');
    expect(record.beaconIntervalMs).toBe(100);
    expect(record.ibss).toBe(false);
    expect(record.supportedSecurity).toEqual(['wpa2-personal']);
    expect(record.supportedPhyModes).toEqual(['n']);
    // Raw IE bytes are preserved verbatim (SSID + DS + RSN + HT caps + HT op + country).
    expect(record.informationElementData?.[0]).toBe(0);
  });

  it('parses a big-endian nanosecond probe response on 5 GHz', () => {
    const frame = radiotapFrame(
      beaconFrame({
        subtype: 5,
        ssid: 'big-endian',
        ds: null,
        ies: [htCapsIe(), vhtCapsIe(), vhtOperationIe(1), rsnIe([8])],
      }),
      { signal: -55, frequencyMhz: 5180 }
    );

    const result = importCapture(pcapFile([frame], { le: false, nano: true }));

    expect(result.frames).toBe(1);
    expect(result.warnings).toEqual([]);
    const record = result.records[0]!;
    expect(record.ssid).toBe('big-endian');
    expect(record.rssiDbm).toBe(-55);
    expect(record.channelNumber).toBe(36);
    expect(record.channelBand).toBe('5ghz');
    expect(record.channelWidth).toBe('80mhz');
    expect(record.supportedSecurity).toEqual(['wpa3-personal']);
    expect(record.supportedPhyModes).toEqual(['n', 'ac']);
  });

  it('drops the FCS when radiotap flags say it is present', () => {
    const dot11 = beaconFrame({ ssid: 'fcs-net', ds: 1, fcs: true });
    const frame = radiotapFrame(dot11, { flags: 0x10 });

    const result = importCapture(pcapFile([frame]));

    expect(result.records).toHaveLength(1);
    expect(result.records[0]!.ssid).toBe('fcs-net');
    const ieBytes = result.records[0]!.informationElementData ?? [];
    // SSID IE (0, 9, 'fcs-net') + DS IE (3, 1, 1): the 4-byte "FCS" is gone.
    expect(Array.from(ieBytes.slice(-3))).toEqual([3, 1, 1]);
    expect(ieBytes.length).toBe(2 + 7 + 2 + 1);
  });

  it('keeps the strongest RSSI when one BSSID repeats', () => {
    const weak = radiotapFrame(beaconFrame({ ssid: 'dup', ds: 6 }), { signal: -80 });
    const strong = radiotapFrame(beaconFrame({ ssid: 'dup', ds: 6 }), { signal: -50 });

    const result = importCapture(pcapFile([weak, strong]));

    expect(result.frames).toBe(2);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]!.rssiDbm).toBe(-50);
  });

  it('infers open / wep / wpa2+wpa mixed security from IEs and capability', () => {
    const open = importCapture(
      pcapFile([radiotapFrame(beaconFrame({ ssid: 'open', ds: 1, capability: 0x0401 }))])
    );
    expect(open.records[0]!.supportedSecurity).toEqual(['open']);

    const wep = importCapture(
      pcapFile([radiotapFrame(beaconFrame({ ssid: 'wep', ds: 1, capability: 0x0411 }))])
    );
    expect(wep.records[0]!.supportedSecurity).toEqual(['wep']);

    const mixed = importCapture(
      pcapFile([
        radiotapFrame(beaconFrame({ ssid: 'mixed', ds: 1, ies: [rsnIe([2]), WPA_PSK_IE] })),
      ])
    );
    expect(mixed.records[0]!.supportedSecurity).toEqual([
      'wpa-personal',
      'wpa-personal-mixed',
      'wpa2-personal',
    ]);
  });

  it('warns when DS IE and radiotap frequency disagree', () => {
    const frame = radiotapFrame(beaconFrame({ ssid: 'mismatch', ds: 11 }), {
      frequencyMhz: 2437,
    });

    const result = importCapture(pcapFile([frame]));

    expect(result.warnings).toContain(
      'channel: DS IE channel 11 disagrees with radiotap frequency channel 6'
    );
    expect(result.records[0]!.channelNumber).toBe(11);
  });

  it('warns on an unsupported linktype and returns no records', () => {
    const result = importCapture(pcapFile([new Uint8Array(40)], { linktype: 1 }));

    expect(result.frames).toBe(1);
    expect(result.records).toEqual([]);
    expect(result.warnings).toContain(
      'linktype: unsupported 1 (expected 127 radiotap or 105 802.11)'
    );
  });

  it('warns on truncated packet data instead of reading past the buffer', () => {
    const good = pcapFile([radiotapFrame(beaconFrame())]);
    // Cut the packet payload in half: the record header still claims full length.
    const truncated = good.subarray(0, good.length - 10);

    const result = importCapture(truncated);

    expect(result.records).toEqual([]);
    expect(result.warnings.some((warning) => warning.includes('truncated packet data'))).toBe(true);
  });

  it('stops at maxFrames and says so', () => {
    const a = radiotapFrame(beaconFrame({ ssid: 'a' }));
    const b = radiotapFrame(beaconFrame({ ssid: 'b' }));

    const result = importCapture(pcapFile([a, b]), { maxFrames: 1 });

    expect(result.frames).toBe(1);
    expect(result.warnings).toContain('limit: frame cap 1 reached');
  });

  it('refuses oversized input', () => {
    const result = importCapture(pcapFile([radiotapFrame(beaconFrame())]), { maxBytes: 4 });

    expect(result.records).toEqual([]);
    expect(result.frames).toBe(0);
    expect(result.warnings.some((warning) => warning.startsWith('input: too large'))).toBe(true);
  });
});

describe('pcapng import', () => {
  it('parses SHB + IDB + EPB with a radiotap beacon', () => {
    const frame = radiotapFrame(
      beaconFrame({ ssid: 'ng-net', ds: 36, ies: [rsnIe([2]), htCapsIe()] }),
      { frequencyMhz: 5180, signal: -61 }
    );
    const file = concat([
      sectionHeader(true),
      interfaceBlock(127, true),
      enhancedPacketBlock(frame, true),
    ]);

    const result = importCapture(file);

    expect(result.frames).toBe(1);
    expect(result.warnings).toEqual([]);
    expect(result.records).toHaveLength(1);
    const record = result.records[0]!;
    expect(record.ssid).toBe('ng-net');
    expect(record.channelBand).toBe('5ghz');
    expect(record.channelNumber).toBe(36);
    expect(record.rssiDbm).toBe(-61);
  });

  it('parses a big-endian section with a raw 802.11 frame (linktype 105)', () => {
    const file = concat([
      sectionHeader(false),
      interfaceBlock(105, false),
      enhancedPacketBlock(beaconFrame({ ssid: 'raw11', ds: 6 }), false),
    ]);

    const result = importCapture(file);

    expect(result.frames).toBe(1);
    expect(result.records[0]!.ssid).toBe('raw11');
    expect(result.records[0]!.rssiDbm).toBe(0);
    expect(result.warnings).toContain('linktype 105: 802.11 frames assumed to carry no FCS');
    expect(result.warnings.some((warning) => warning.includes('no radiotap antenna signal'))).toBe(
      true
    );
  });

  it('parses a simple packet block', () => {
    const file = concat([
      sectionHeader(true),
      interfaceBlock(127, true),
      simplePacketBlock(radiotapFrame(beaconFrame({ ssid: 'spb-net', ds: 6 })), true),
    ]);

    const result = importCapture(file);

    expect(result.frames).toBe(1);
    expect(result.records[0]!.ssid).toBe('spb-net');
  });

  it('warns on a truncated block instead of resyncing', () => {
    const file = concat([
      sectionHeader(true),
      interfaceBlock(127, true),
      enhancedPacketBlock(radiotapFrame(beaconFrame({ ssid: 'cut', ds: 6 })), true),
    ]);
    const truncated = file.subarray(0, file.length - 20);

    const result = importCapture(truncated);

    expect(result.warnings.some((warning) => warning.includes('truncated block body'))).toBe(true);
  });
});

describe('format guards', () => {
  it('returns empty records + a warning for an empty buffer', () => {
    const result = importCapture(new Uint8Array(0));

    expect(result).toEqual({ records: [], warnings: ['input: empty capture'], frames: 0 });
  });

  it('reports an unrecognized magic', () => {
    const result = importCapture(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]));

    expect(result.records).toEqual([]);
    expect(result.frames).toBe(0);
    expect(result.warnings.some((warning) => warning.includes('unrecognized format'))).toBe(true);
  });

  it('detects capture files by magic only', () => {
    expect(isCaptureFile(pcapFile([]))).toBe(true);
    expect(isCaptureFile(concat([sectionHeader(true)]))).toBe(true);
    expect(isCaptureFile(Uint8Array.from([0, 1, 2, 3]))).toBe(false);
  });

  it('accepts an ArrayBuffer input', () => {
    const bytes = pcapFile([radiotapFrame(beaconFrame({ ssid: 'buffer', ds: 6 }))]);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

    const result = importCapture(buffer as ArrayBuffer);

    expect(result.records[0]!.ssid).toBe('buffer');
  });

  it('warns about radiotap present bits it cannot decode but keeps known fields', () => {
    const frame = radiotapFrame(beaconFrame({ ssid: 'unknown-bits', ds: 6 }), {
      extraPresentBit: 27,
    });

    const result = importCapture(pcapFile([frame]));

    expect(result.records[0]!.ssid).toBe('unknown-bits');
    expect(result.records[0]!.rssiDbm).toBe(-42);
    expect(
      result.warnings.some((warning) => warning.includes('unknown present field bit 27'))
    ).toBe(true);
  });
});
