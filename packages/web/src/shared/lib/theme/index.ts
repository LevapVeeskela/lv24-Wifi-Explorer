// oxlint-disable typescript/triple-slash-reference
/// <reference path="./muiXThemeAugmentation.d.ts" />
import { createTheme, alpha, type Theme } from '@mui/material/styles';
// MUI X palette/component keys: type-only via muiXThemeAugmentation.d.ts
// (no runtime import of @mui/x-data-grid* / x-date-pickers from public theme path).

/**
 * LV24 «Sunset» design system.
 *
 * Warm coral + violet identity with stone neutrals, light & dark color schemes
 * driven by MUI CSS theme variables (`cssVariables` + `colorSchemes`). Toggle via
 * `useColorScheme()` (see shared/ui/ColorSchemeToggle). Preference values:
 * light | dark | system | auto (time-of-day; see colorSchemeAuto.ts).
 */

const FONT_SANS =
  '"Manrope Variable", "Manrope", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const FONT_DISPLAY =
  '"Plus Jakarta Sans Variable", "Manrope Variable", system-ui, -apple-system, "Segoe UI", sans-serif';

// Warm shadow color (stone-900) for a soft, non-blue elevation system.
const SHADOW_RGB = '28 25 23';
const s = (a: string) => `rgb(${SHADOW_RGB} / ${a})`;

const softShadows: Theme['shadows'] = [
  'none',
  `0 1px 2px ${s('0.05')}`,
  `0 1px 3px ${s('0.06')}, 0 1px 2px ${s('0.05')}`,
  `0 2px 5px ${s('0.07')}, 0 1px 2px ${s('0.05')}`,
  `0 4px 8px ${s('0.07')}, 0 1px 3px ${s('0.05')}`,
  `0 6px 12px ${s('0.08')}, 0 2px 4px ${s('0.05')}`,
  `0 8px 16px ${s('0.08')}, 0 2px 5px ${s('0.05')}`,
  `0 10px 20px ${s('0.09')}, 0 3px 6px ${s('0.05')}`,
  `0 12px 24px ${s('0.10')}, 0 4px 8px ${s('0.06')}`,
  `0 14px 28px ${s('0.10')}, 0 5px 10px ${s('0.06')}`,
  `0 16px 32px ${s('0.11')}, 0 6px 12px ${s('0.06')}`,
  `0 18px 36px ${s('0.11')}, 0 7px 14px ${s('0.06')}`,
  `0 20px 40px ${s('0.12')}, 0 8px 16px ${s('0.07')}`,
  `0 22px 44px ${s('0.12')}, 0 9px 18px ${s('0.07')}`,
  `0 24px 48px ${s('0.13')}, 0 10px 20px ${s('0.07')}`,
  `0 26px 52px ${s('0.13')}, 0 11px 22px ${s('0.07')}`,
  `0 28px 56px ${s('0.14')}, 0 12px 24px ${s('0.08')}`,
  `0 30px 60px ${s('0.14')}, 0 13px 26px ${s('0.08')}`,
  `0 32px 64px ${s('0.15')}, 0 14px 28px ${s('0.08')}`,
  `0 34px 68px ${s('0.15')}, 0 15px 30px ${s('0.08')}`,
  `0 36px 72px ${s('0.16')}, 0 16px 32px ${s('0.09')}`,
  `0 38px 76px ${s('0.16')}, 0 17px 34px ${s('0.09')}`,
  `0 40px 80px ${s('0.17')}, 0 18px 36px ${s('0.09')}`,
  `0 42px 84px ${s('0.17')}, 0 19px 38px ${s('0.10')}`,
  `0 44px 88px ${s('0.18')}, 0 20px 40px ${s('0.10')}`,
];

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: {
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
    },
    dark: {
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
    },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: softShadows,
  typography: {
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
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        },
        /**
         * Reduced motion: soften transitions only.
         *
         * Do **not** set global `animationDuration` / `animationIterationCount` on
         * `*`. That nuclear pattern freezes every infinite CSS indicator on the
         * map and elsewhere — MUI CircularProgress, promo flame, user-location
         * pulse, basemap loading spinner — and looks like “all map animations
         * are broken” when Windows/browser has “reduce motion” on (or when the
         * query is emulated in DevTools).
         *
         * Decorative map flame still respects reduce via mapMarkerMotion.css.
         */
        '@media (prefers-reduced-motion: reduce)': {
          html: {
            scrollBehavior: 'auto',
          },
          '*, *::before, *::after': {
            scrollBehavior: 'auto !important',
            transitionDuration: '0.05ms !important',
            transitionDelay: '0ms !important',
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: '3px solid var(--mui-palette-primary-main)',
            outlineOffset: 2,
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 10,
          paddingInline: 18,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        sizeSmall: { minHeight: 34, paddingInline: 14, fontSize: '0.8125rem' },
        sizeLarge: { minHeight: 50, paddingInline: 24, fontSize: '1rem' },
        outlined: ({ theme }) => ({
          borderColor: theme.vars.palette.divider,
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          borderRadius: 10,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: ({ theme }) => ({
          borderColor: theme.vars.palette.divider,
        }),
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 14,
          border: `1px solid ${theme.vars.palette.divider}`,
          backgroundImage: 'none',
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderRight: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 999,
          fontWeight: 600,
          // Default filled/outlined chips bake grey[100] under cssVariables — light
          // plates in dark mode (section filters, reason chips). Keep primary/etc.
          // filled colors from palette; only restyle default + outlined shells.
          ...theme.applyStyles('dark', {
            '&.MuiChip-filled.MuiChip-colorDefault': {
              backgroundColor: 'rgba(246, 240, 233, 0.1)',
              color: theme.vars.palette.text.primary,
              '&:hover': {
                backgroundColor: 'rgba(246, 240, 233, 0.16)',
              },
              '&.MuiChip-clickable:hover': {
                backgroundColor: 'rgba(246, 240, 233, 0.16)',
              },
            },
            '&.MuiChip-outlined': {
              borderColor: 'rgba(246, 240, 233, 0.28)',
              backgroundColor: 'rgba(246, 240, 233, 0.06)',
              color: theme.vars.palette.text.primary,
              '& .MuiChip-icon': {
                color: theme.vars.palette.text.secondary,
              },
              '&:hover': {
                backgroundColor: 'rgba(246, 240, 233, 0.1)',
                borderColor: 'rgba(246, 240, 233, 0.4)',
              },
              '&.MuiChip-clickable:hover': {
                backgroundColor: 'rgba(246, 240, 233, 0.1)',
              },
            },
          }),
        }),
        label: {
          paddingInline: 10,
        },
      },
    },
    // Outlined InputLabel / Select: Manrope + admin overflow desks were clipping
    // shrink labels (notch too tight / top of label cut by overflow:auto parents).
    MuiFormControl: {
      styleOverrides: {
        root: {
          // Absolute shrink labels paint slightly outside the control box.
          overflow: 'visible',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        // Keep default ellipsis while the label sits inside the field; only the
        // floated shrink state needs extra width / no clip (Manrope + RU copy).
        shrink: {
          overflow: 'visible',
          textOverflow: 'clip',
          // 133% is MUI default for scale(0.75); extra room for variable font metrics.
          maxWidth: 'calc(140% - 24px)',
        },
        outlined: {
          '&.MuiInputLabel-shrink': {
            overflow: 'visible',
            textOverflow: 'clip',
            maxWidth: 'calc(140% - 24px)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          // Keep the notched outline from clipping the floating label paint.
          overflow: 'visible',
        },
        notchedOutline: {
          // MUI fieldset defaults overflow:hidden; restore breathing room for legend.
          // Slightly wider legend span padding than MUI's 5px — Manrope Variable is wider.
          '& legend > span': {
            paddingLeft: 6,
            paddingRight: 6,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 12,
          border: `1px solid ${theme.vars.palette.divider}`,
          boxShadow: theme.shadows[8],
          backgroundImage: 'none',
        }),
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 12,
          border: `1px solid ${theme.vars.palette.divider}`,
          boxShadow: theme.shadows[8],
          backgroundImage: 'none',
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor: theme.vars.palette.text.primary,
          color: theme.vars.palette.background.paper,
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 8,
          paddingInline: 10,
          paddingBlock: 6,
        }),
        arrow: ({ theme }) => ({
          color: theme.vars.palette.text.primary,
        }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 44,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: theme.vars.palette.divider,
        }),
        head: {
          fontWeight: 700,
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: ({ theme }) => {
          // Belt-and-suspenders with palette.DataGrid: force paper on MUI X v8
          // tokens + legacy vars + pin fillers so checkbox/actions columns match
          // the grid body for the full fill height (empty or short lists).
          const paper = theme.vars.palette.background.paper;
          return {
            border: `1px solid ${theme.vars.palette.divider}`,
            borderRadius: 12,
            backgroundColor: paper,
            // MUI X v8 design tokens (pinned cells, headers, root base)
            '--DataGrid-t-color-background-base': paper,
            '--DataGrid-t-cell-background-pinned': paper,
            '--DataGrid-t-header-background-base': paper,
            // Legacy custom props still referenced in older docs / slots
            '--DataGrid-containerBackground': paper,
            '--DataGrid-pinnedBackground': paper,
            '--DataGrid-rowBorderColor': theme.vars.palette.divider,
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: theme.vars.palette.action.hover,
            },
            '& .MuiDataGrid-cell': {
              borderColor: theme.vars.palette.divider,
            },
            // Empty-body pin fillers under checkbox / actions (rows < viewport height)
            '& .MuiDataGrid-filler--pinnedLeft, & .MuiDataGrid-filler--pinnedRight, & .MuiDataGrid-scrollbarFiller--pinnedRight':
              {
                backgroundColor: paper,
              },
          };
        },
      },
    },
    // MUI X DateCalendar — scheme-aware base (detailed dark skin lives in dateCalendarSkin.ts).
    MuiDateCalendar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
          color: theme.vars.palette.text.primary,
          ...theme.applyStyles('dark', {
            backgroundColor: '#1C1814',
            color: '#F6F0E9',
          }),
        }),
      },
    },
    MuiPickersCalendarHeader: {
      styleOverrides: {
        label: ({ theme }) => ({
          color: theme.vars.palette.text.primary,
          fontWeight: 800,
          ...theme.applyStyles('dark', { color: '#F6F0E9' }),
        }),
        switchViewButton: ({ theme }) => ({
          color: theme.vars.palette.text.primary,
          ...theme.applyStyles('dark', { color: '#F6F0E9' }),
        }),
      },
    },
    MuiPickersArrowSwitcher: {
      styleOverrides: {
        button: ({ theme }) => ({
          color: theme.vars.palette.text.primary,
          ...theme.applyStyles('dark', {
            color: '#F6F0E9',
            '&:hover': { backgroundColor: 'rgba(251, 110, 74, 0.18)' },
            '&.Mui-disabled': { color: 'rgba(246, 240, 233, 0.32)' },
          }),
        }),
      },
    },
    MuiDayCalendar: {
      styleOverrides: {
        weekDayLabel: ({ theme }) => ({
          color: theme.vars.palette.text.secondary,
          fontWeight: 700,
          ...theme.applyStyles('dark', { color: '#C9BDB0' }),
        }),
      },
    },
    MuiPickersDay: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.vars.palette.text.primary,
          fontWeight: 600,
          ...theme.applyStyles('dark', {
            color: '#FFF8F0',
            '&.Mui-selected': {
              backgroundColor: '#FB6E4A',
              color: '#FFFFFF',
              fontWeight: 800,
              '&:hover, &:focus': { backgroundColor: '#FF7A55', color: '#FFFFFF' },
            },
            '&.Mui-disabled': {
              color: 'rgba(255, 248, 240, 0.22)',
            },
            '&.MuiPickerDay-dayOutsideMonth': {
              color: 'rgba(255, 248, 240, 0.22)',
            },
            '&.MuiPickerDay-today:not(.Mui-selected)': {
              border: '2px solid #FB6E4A',
              backgroundColor: 'rgba(251, 110, 74, 0.12)',
            },
          }),
        }),
      },
    },
    MuiYearCalendar: {
      styleOverrides: {
        button: ({ theme }) => ({
          color: theme.vars.palette.text.primary,
          ...theme.applyStyles('dark', {
            color: '#FFF8F0',
            '&.Mui-selected': { backgroundColor: '#FB6E4A', color: '#FFFFFF' },
          }),
        }),
      },
    },
    MuiMonthCalendar: {
      styleOverrides: {
        button: ({ theme }) => ({
          color: theme.vars.palette.text.primary,
          ...theme.applyStyles('dark', {
            color: '#FFF8F0',
            '&.Mui-selected': { backgroundColor: '#FB6E4A', color: '#FFFFFF' },
          }),
        }),
      },
    },
  },
});
