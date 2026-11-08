/** Public contract of the offline capture import. */

import type { CoreWlanNetworkRecord } from '../../domain/bss';

export interface PcapImportOptions {
  /** Hard cap on link-layer frames examined. Default 200_000. */
  maxFrames?: number;
  /** Hard cap on input size. Larger inputs are refused (no partial parse). */
  maxBytes?: number;
  /** Cap on distinct warning messages kept. Default 200. */
  maxWarnings?: number;
}

export interface PcapImportResult {
  /** One record per BSSID + primary channel, in first-seen order. */
  records: CoreWlanNetworkRecord[];
  warnings: string[];
  /** Link-layer frames examined (including frames skipped as unsupported). */
  frames: number;
}

export const PCAP_IMPORT_DEFAULTS = {
  maxFrames: 200_000,
  maxBytes: 64 * 1024 * 1024,
  maxWarnings: 200,
} as const;

/** Cap on radiotap present-bitmap extension words we are willing to read. */
export const RADIOTAP_MAX_PRESENT_WORDS = 8;

/** De-duplicated, bounded warning sink. */
export class Warnings {
  private readonly seen = new Set<string>();
  private readonly max: number;
  private suppressed = false;

  constructor(max: number) {
    this.max = Math.max(1, max);
  }

  readonly list: string[] = [];

  add(message: string): void {
    if (this.seen.has(message)) return;
    this.seen.add(message);
    if (this.list.length >= this.max) {
      if (!this.suppressed) {
        this.suppressed = true;
        this.list.push(`warnings: further messages suppressed (max ${this.max})`);
      }
      return;
    }
    this.list.push(message);
  }
}
