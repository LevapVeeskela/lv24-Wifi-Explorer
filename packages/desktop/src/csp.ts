/**
 * Renderer CSP — deny-by-default. In production `connect-src` is self-only;
 * Vite HMR/websocket origins are allowed only in the dev build.
 */
export function buildRendererCsp(isDev: boolean): string {
  const connectSrc = isDev
    ? "connect-src 'self' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*"
    : "connect-src 'self'";
  return [
    "default-src 'self'",
    isDev ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'",
    isDev ? "worker-src 'self' blob:" : "worker-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    connectSrc,
    "frame-src 'none'",
  ].join('; ');
}
