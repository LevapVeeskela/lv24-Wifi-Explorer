import { decodeInformationElements, ieTreeTitle, toHex } from '@/domain/ie';
import type { DecodedIe } from '@/domain/ie';

/** Bytes rendered inline per element before the hex is truncated. */
export const IE_DIFF_SHORT_HEX_BYTES = 8;

export type IeDiffSide = 'left' | 'right';

export type IeDiffCell = {
  /** Payload (element body) length in bytes. */
  length: number;
  /** Short lowercase hex, `…` suffix when truncated. */
  hex: string;
};

export type IeDiffEntry = {
  /** Alignment key: `id:extId:occurrence`. */
  key: string;
  /** Public IE name, e.g. `RSN (48)` / `HE Capabilities (255/35)`. */
  name: string;
  left: IeDiffCell | null;
  right: IeDiffCell | null;
  /** Payload differs, or the element is present on one side only. */
  differs: boolean;
  onlyIn: IeDiffSide | null;
};

export type IeDiffResult = {
  entries: readonly IeDiffEntry[];
  comparedCount: number;
  differingCount: number;
  /** At least one side decoded at least one element. */
  hasData: boolean;
};

export type IeDiffInput = {
  bytes: readonly number[] | null | undefined;
};

type IeSlot = {
  key: string;
  ie: DecodedIe;
};

function slotKey(id: number, extId: number | null, occurrence: number): string {
  return `${id}:${extId == null ? '' : extId}:${occurrence}`;
}

/** Decode one side and key each element by `(id, extId, occurrence)`. */
function decodeSlots(bytes: readonly number[] | null | undefined): IeSlot[] {
  const decoded = decodeInformationElements(bytes ?? null);
  const occurrences = new Map<string, number>();
  const slots: IeSlot[] = [];
  for (const ie of decoded.elements) {
    const base = `${ie.id}:${ie.extId == null ? '' : ie.extId}`;
    const occurrence = occurrences.get(base) ?? 0;
    occurrences.set(base, occurrence + 1);
    slots.push({ key: slotKey(ie.id, ie.extId, occurrence), ie });
  }
  return slots;
}

function shortHex(bytes: readonly number[]): string {
  const head = toHex(bytes.slice(0, IE_DIFF_SHORT_HEX_BYTES));
  return bytes.length > IE_DIFF_SHORT_HEX_BYTES ? `${head}…` : head;
}

function cell(ie: DecodedIe): IeDiffCell {
  return { length: ie.raw.length, hex: shortHex(ie.raw) };
}

function sameBytes(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function entryFor(
  key: string,
  left: DecodedIe | undefined,
  right: DecodedIe | undefined
): IeDiffEntry {
  const primary = left ?? right;
  if (primary == null) {
    // Unreachable: every key comes from at least one side.
    return { key, name: key, left: null, right: null, differs: false, onlyIn: null };
  }
  const name = ieTreeTitle(primary.id, primary.extId);
  if (left == null || right == null) {
    return {
      key,
      name,
      left: left == null ? null : cell(left),
      right: right == null ? null : cell(right),
      differs: true,
      onlyIn: left == null ? 'right' : 'left',
    };
  }
  return {
    key,
    name,
    left: cell(left),
    right: cell(right),
    differs: !sameBytes(left.raw, right.raw),
    onlyIn: null,
  };
}

/**
 * Aligns decoded IEs of two BSS by `(element id, extension id, occurrence)`
 * and reports per-element presence and payload differences.
 *
 * Left-side ordering wins; right-only elements are appended in decode order.
 */
export function buildIeDiff(left: IeDiffInput, right: IeDiffInput): IeDiffResult {
  const leftSlots = decodeSlots(left.bytes);
  const rightSlots = decodeSlots(right.bytes);
  const rightByKey = new Map(rightSlots.map((slot) => [slot.key, slot.ie]));
  const leftByKey = new Map(leftSlots.map((slot) => [slot.key, slot.ie]));

  const keys: string[] = leftSlots.map((slot) => slot.key);
  for (const slot of rightSlots) {
    if (!leftByKey.has(slot.key)) keys.push(slot.key);
  }

  const entries = keys.map((key) => entryFor(key, leftByKey.get(key), rightByKey.get(key)));
  return {
    entries,
    comparedCount: entries.length,
    differingCount: entries.filter((entry) => entry.differs).length,
    hasData: entries.length > 0,
  };
}
