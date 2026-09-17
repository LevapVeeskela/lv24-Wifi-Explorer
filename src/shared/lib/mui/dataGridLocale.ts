import { enUS, ruRU } from '@mui/x-data-grid-pro/locales';
import type { GridLocaleText } from '@mui/x-data-grid-pro';

export type DataGridLocaleText = Partial<GridLocaleText>;

const EN_LOCALE_TEXT = enUS.components.MuiDataGrid.defaultProps.localeText;

const RU_PAGINATION_DISPLAYED_ROWS: NonNullable<GridLocaleText['paginationDisplayedRows']> = ({
  from,
  to,
  count,
  estimated,
}) => {
  if (!estimated) {
    return `${from}–${to} из ${count !== -1 ? count : `более ${to}`}`;
  }
  const estimatedLabel = estimated && estimated > to ? `около ${estimated}` : `более ${to}`;
  return `${from}–${to} из ${count !== -1 ? count : estimatedLabel}`;
};

const RU_LOCALE_TEXT: DataGridLocaleText = {
  ...ruRU.components.MuiDataGrid.defaultProps.localeText,
  paginationDisplayedRows: RU_PAGINATION_DISPLAYED_ROWS,
};

export type AppLocale = 'ru' | 'en';

export function normalizeAppLocale(localeInput: string): AppLocale {
  const base = localeInput.split('-')[0]?.toLowerCase();
  return base === 'en' ? 'en' : 'ru';
}

export function getDataGridLocaleText(localeInput: string): DataGridLocaleText {
  return normalizeAppLocale(localeInput) === 'en' ? EN_LOCALE_TEXT : RU_LOCALE_TEXT;
}
