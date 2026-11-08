import type { ThemeOptions } from '@mui/material/styles';

import { FONT_DISPLAY, FONT_SANS } from './tokens';

export const typography: ThemeOptions['typography'] = {
  fontFamily: FONT_SANS,
  h1: {
    fontFamily: FONT_DISPLAY,
    fontSize: '2.5rem',
    fontWeight: 800,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontFamily: FONT_DISPLAY,
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.015em',
  },
  h3: {
    fontFamily: FONT_DISPLAY,
    fontSize: '1.625rem',
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
  },
  h4: { fontFamily: FONT_DISPLAY, fontSize: '1.375rem', fontWeight: 700, lineHeight: 1.3 },
  h5: { fontFamily: FONT_DISPLAY, fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
  h6: { fontFamily: FONT_DISPLAY, fontSize: '1rem', fontWeight: 600, lineHeight: 1.45 },
  subtitle1: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
  subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
  body1: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.6 },
  body2: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.55 },
  button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
  caption: { fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.4 },
  overline: {
    textTransform: 'uppercase',
    fontWeight: 700,
    fontSize: '0.6875rem',
    letterSpacing: '0.08em',
  },
};
