import { formatPrintCell, printCellClass } from './formatPrintCell';
import { escapeHtml } from './escapeHtml';
import type { PrintBuildResult, PrintVisibleTableRequest } from './types';

const PRINT_STYLES = `
@page { margin: 12mm; }
* { box-sizing: border-box; }
body {
  margin: 0;
  font: 11pt/1.35 system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #111;
}
h1 {
  font-size: 14pt;
  font-weight: 600;
  margin: 0 0 4pt;
}
.meta {
  color: #444;
  font-size: 9pt;
  margin: 0 0 10pt;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
}
th, td {
  border: 1px solid #ccc;
  padding: 3pt 5pt;
  text-align: left;
  vertical-align: top;
  word-break: break-word;
}
th {
  background: #f0f0f0;
  font-weight: 600;
}
td.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 8.5pt;
}
tbody tr:nth-child(even) td {
  background: #fafafa;
}
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`.trim();

function formatPrintedAt(when: Date): string {
  try {
    return when.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return when.toISOString();
  }
}

export function buildPrintHtml(request: PrintVisibleTableRequest): PrintBuildResult {
  const printedAt = request.printedAt ?? new Date();
  const context = {
    signalUnit: request.signalUnit,
    hiddenSsidLabel: request.hiddenSsidLabel,
    networkTypeLabels: request.networkTypeLabels,
    formatIssueKey: request.formatIssueKey,
  };

  const headerCells = request.columns
    .map((column) => `<th scope="col">${escapeHtml(column.label)}</th>`)
    .join('');

  const bodyRows = request.rows
    .map((row) => {
      const cells = request.columns
        .map((column) => {
          const value = formatPrintCell(row, column.id, context);
          const classAttr = printCellClass(column.id);
          const className = classAttr ? ` class="${classAttr}"` : '';
          return `<td${className}>${escapeHtml(value)}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const meta = `${request.rows.length} rows · ${request.columns.length} columns · ${formatPrintedAt(printedAt)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(request.productTitle)}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <h1>${escapeHtml(request.productTitle)}</h1>
  <p class="meta">${escapeHtml(meta)}</p>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;

  return {
    html,
    rowCount: request.rows.length,
    columnCount: request.columns.length,
  };
}
