import { alpha, type ColorSystemOptions } from '@mui/material/styles';

// MUI X palette/component keys: type-only via muiXThemeAugmentation.d.ts
// (no runtime import of @mui/x-data-grid* / x-date-pickers from public theme path).

export const lightColorScheme: ColorSystemOptions = {
  palette: {
    mode: 'light',
    // main tones tuned for WCAG AA (4.5:1) with their contrastText and as
    // accent text on light surfaces; the vibrant coral lives on as `light`.
    primary: { main: '#CE4420', light: '#F15A36', dark: '#B8420F', contrastText: '#FFFFFF' },
    secondary: { main: '#7C3AED', light: '#A78BFA', dark: '#5B21B6', contrastText: '#FFFFFF' },
    success: { main: '#15803D', light: '#4ADE80', dark: '#14532D', contrastText: '#FFFFFF' },
    warning: { main: '#F59E0B', light: '#FBBF24', dark: '#B45309', contrastText: '#1C1917' },
    error: { main: '#E11D48', light: '#FB7185', dark: '#BE123C', contrastText: '#FFFFFF' },
    info: { main: '#0E7490', light: '#22D3EE', dark: '#155E75', contrastText: '#FFFFFF' },
    background: { default: '#FCFAF7', paper: '#FFFFFF' },
    // MUI X v8 defaults DataGrid bg/pinnedBg to background.default. Admin fill
    // tables are paper — keep base + pinned + header on paper so sticky
    // checkbox/actions columns and empty fillers match the grid body.
    DataGrid: {
      bg: '#FFFFFF',
      pinnedBg: '#FFFFFF',
      headerBg: '#FFFFFF',
    },
    // Secondary was stone-500 (#78716C) — washed out on warm paper / tinted cards
    // (page blurbs, film original titles). stone-600 keeps AA+ on #FCFAF7 / white.
    text: { primary: '#1C1917', secondary: '#57534E', disabled: '#A8A29E' },
    divider: '#EEE9E2',
    action: {
      hover: alpha('#78716C', 0.06),
      selected: alpha('#F15A36', 0.1),
      focus: alpha('#F15A36', 0.12),
    },
  },
};

export const darkColorScheme: ColorSystemOptions = {
  palette: {
    mode: 'dark',
    primary: { main: '#FB6E4A', light: '#FCA98B', dark: '#E9542E', contrastText: '#231A15' },
    secondary: { main: '#A78BFA', light: '#C4B5FD', dark: '#7C3AED', contrastText: '#1B1030' },
    success: { main: '#34D399', light: '#6EE7B7', dark: '#059669', contrastText: '#04120B' },
    warning: { main: '#FBBF24', light: '#FCD34D', dark: '#D97706', contrastText: '#241A02' },
    error: { main: '#FB7185', light: '#FDA4AF', dark: '#E11D48', contrastText: '#2A0910' },
    info: { main: '#38BDF8', light: '#7DD3FC', dark: '#0EA5E9', contrastText: '#04121B' },
    background: { default: '#17130F', paper: '#221D18' },
    DataGrid: {
      bg: '#221D18',
      pinnedBg: '#221D18',
      headerBg: '#221D18',
    },
    // Secondary/disabled lifted so page descriptions & muted labels stay readable
    // on warm dark stone (category pages, filter section titles, captions).
    text: { primary: '#F6F0E9', secondary: '#D6CBC0', disabled: '#9A9086' },
    divider: '#352D25',
    action: {
      hover: alpha('#F6F0E9', 0.08),
      selected: alpha('#FB6E4A', 0.16),
      focus: alpha('#FB6E4A', 0.2),
    },
  },
};
