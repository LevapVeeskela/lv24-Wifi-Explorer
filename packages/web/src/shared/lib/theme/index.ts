// oxlint-disable typescript/triple-slash-reference
/// <reference path="./muiXThemeAugmentation.d.ts" />
import { createTheme } from '@mui/material/styles';

import { components } from './components';
import { darkColorScheme, lightColorScheme } from './palette';
import { softShadows } from './shadows';
import { typography } from './typography';

/**
 * LV24 «Sunset» design system.
 *
 * Warm coral + violet identity with stone neutrals, light & dark color schemes
 * driven by MUI CSS theme variables (`cssVariables` + `colorSchemes`). Toggle via
 * `useColorScheme()` (see shared/ui/ColorSchemeToggle). Preference values:
 * light | dark | system | auto (time-of-day; see colorSchemeAuto.ts).
 *
 * Pieces live next to this file: `palette` (color schemes), `typography`,
 * `shadows`, `components` (MUI overrides), `tokens` (raw literals).
 */
export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: lightColorScheme,
    dark: darkColorScheme,
  },
  shape: {
    borderRadius: 10,
  },
  shadows: softShadows,
  typography,
  components,
});
