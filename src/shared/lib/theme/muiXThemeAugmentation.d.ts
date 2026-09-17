/**
 * MUI X theme module augmentations — type-only (no runtime import).
 *
 * Do **not** put `import type {} from '@mui/x-data-grid/themeAugmentation'`
 * (etc.) in runtime modules such as `theme/index.ts`: under Rolldown those
 * package entrypoints have real `.js` files and can end up on the SPA entry
 * static graph, pulling vendor-data-grid-* / pickers into every page.
 *
 * Triple-slash references stay in the type graph only.
 */
/// <reference types="@mui/x-data-grid/themeAugmentation" />
/// <reference types="@mui/x-data-grid-pro/themeAugmentation" />
/// <reference types="@mui/x-date-pickers/themeAugmentation" />

export {};
