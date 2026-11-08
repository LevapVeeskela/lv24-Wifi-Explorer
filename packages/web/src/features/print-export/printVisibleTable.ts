import { buildPrintHtml } from './buildPrintHtml';
import { printHtmlDocument } from './printDocument';
import type { PrintVisibleTableRequest } from './types';

export function printVisibleTable(request: PrintVisibleTableRequest): void {
  const { html } = buildPrintHtml(request);
  printHtmlDocument(html, request.productTitle);
}
