import { FOREIGN_SCAN_EXTENSIONS, LV24_SCAN_EXTENSION } from './constants';

function lastSegment(fileName: string): string {
  const trimmed = fileName.trim();
  const slash = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
  return (slash >= 0 ? trimmed.slice(slash + 1) : trimmed).toLowerCase();
}

export function isLv24ScanFileName(fileName: string): boolean {
  return lastSegment(fileName).endsWith(LV24_SCAN_EXTENSION);
}

export function isForeignScanFileName(fileName: string): boolean {
  const name = lastSegment(fileName);
  return FOREIGN_SCAN_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function suggestLv24ScanFileName(capturedAt?: string): string {
  const iso = capturedAt ?? new Date().toISOString();
  const stamp = iso.replace(/[:.]/g, '').replace(/Z$/i, 'Z');
  return `lv24-scan-${stamp}${LV24_SCAN_EXTENSION}`;
}
