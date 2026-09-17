/** Parsed scan search query (LV24 DSL, not dot11.net). */

export type ScanQueryAst =
  | { type: 'all' }
  | { type: 'bool'; op: 'and' | 'or'; left: ScanQueryAst; right: ScanQueryAst }
  | { type: 'not'; inner: ScanQueryAst }
  | { type: 'pred'; pred: ScanPredicate };

export type CompareOp = '>=' | '<=' | '>' | '<' | '=';

export type ScanPredicate =
  | { kind: 'keyword'; text: string }
  | { kind: 'phrase'; text: string }
  | { kind: 'band'; band: 2.4 | 5 | 6 }
  | { kind: 'width'; mhz: 20 | 40 | 80 | 160 }
  | { kind: 'channel'; channel: number }
  | { kind: 'channelRange'; from: number; to: number }
  | { kind: 'bssidOctet'; fragment: string }
  | { kind: 'signal'; op: CompareOp; valueDbm: number }
  | { kind: 'signalPct'; op: CompareOp; valuePct: number }
  | { kind: 'security'; token: SecurityShortcut }
  | { kind: 'phy'; token: PhyShortcut }
  | { kind: 'generation'; gen: 'wifi4' | 'wifi5' | 'wifi6' | 'wifi6e' | 'wifi7' }
  | { kind: 'hidden' }
  | { kind: 'keyed'; field: KeyedField; op?: CompareOp; value: string };

export type SecurityShortcut =
  | 'open'
  | 'secure'
  | 'wep'
  | 'wpa'
  | 'wpa2'
  | 'wpa3'
  | 'owe'
  | '802.1x'
  | 'psk'
  | 'sae';

export type PhyShortcut =
  | 'a'
  | 'b'
  | 'g'
  | 'n'
  | 'ac'
  | 'ax'
  | 'be'
  | '11n'
  | '11ac'
  | '11ax'
  | '11be'
  | '802.11a'
  | '802.11b'
  | '802.11g'
  | '802.11n'
  | '802.11ac'
  | '802.11ax'
  | '802.11be';

export type KeyedField =
  | 'ssid'
  | 'bssid'
  | 'vendor'
  | 'channel'
  | 'width'
  | 'band'
  | 'snr'
  | 'signal'
  | 'noise'
  | 'country'
  | 'mode';

export type ParseScanQueryResult =
  | { ok: true; ast: ScanQueryAst }
  | { ok: false; error: string; offset: number };
