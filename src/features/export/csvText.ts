const UTF8_BOM = '\uFEFF';

export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function formatCsvCell(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
}

export function joinCsv(headers: readonly string[], rows: readonly string[][], bom = false): string {
  const lines = [
    headers.map((h) => escapeCsvField(h)).join(','),
    ...rows.map((cells) => cells.map((c) => escapeCsvField(c)).join(',')),
  ];
  const body = `${lines.join('\n')}\n`;
  return bom ? `${UTF8_BOM}${body}` : body;
}

export function encodeUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}
