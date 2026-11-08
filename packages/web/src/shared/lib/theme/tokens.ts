/**
 * Raw design tokens shared by the theme modules (typography, shadows).
 *
 * Literal values only — no MUI imports, so the token layer stays dependency-free
 * and importable from tests/tooling.
 */

export const FONT_SANS =
  '"Manrope Variable", "Manrope", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
export const FONT_DISPLAY =
  '"Plus Jakarta Sans Variable", "Manrope Variable", system-ui, -apple-system, "Segoe UI", sans-serif';

// Warm shadow color (stone-900) for a soft, non-blue elevation system.
export const SHADOW_RGB = '28 25 23';
