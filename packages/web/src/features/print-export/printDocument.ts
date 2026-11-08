/** Opens the system print dialog (Save as PDF on macOS/Windows). */
export function printHtmlDocument(html: string, documentTitle: string): void {
  if (typeof document === 'undefined') return;

  const frame = document.createElement('iframe');
  frame.setAttribute('title', documentTitle);
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.style.visibility = 'hidden';
  document.body.appendChild(frame);

  const win = frame.contentWindow;
  const doc = frame.contentDocument ?? win?.document;
  if (!win || !doc) {
    frame.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    frame.remove();
  };

  win.addEventListener('afterprint', cleanup, { once: true });
  window.setTimeout(cleanup, 60_000);

  win.focus();
  win.print();
}
