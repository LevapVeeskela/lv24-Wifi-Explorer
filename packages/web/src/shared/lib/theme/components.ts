import type { ThemeOptions } from '@mui/material/styles';

// MUI X palette/component keys: type-only via muiXThemeAugmentation.d.ts
// (no runtime import of @mui/x-data-grid* / x-date-pickers from public theme path).

export const components: ThemeOptions['components'] = {
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
};
