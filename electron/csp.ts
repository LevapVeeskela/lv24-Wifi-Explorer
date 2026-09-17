/** Renderer CSP — deny-by-default; Vite HMR + local ScanCore when wired. */
export const WIFI_RENDERER_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*",
  "frame-src 'none'",
].join('; ');
