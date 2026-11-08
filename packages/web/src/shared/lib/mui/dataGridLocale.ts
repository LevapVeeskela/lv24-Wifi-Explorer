import { enUS, ruRU, zhCN } from '@mui/x-data-grid-pro/locales';
import type { GridLocaleText } from '@mui/x-data-grid-pro';
import { normalizeAppLocale, type AppLocale } from '@/shared/i18n';

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

const ZH_PAGINATION_DISPLAYED_ROWS: NonNullable<GridLocaleText['paginationDisplayedRows']> = ({
  from,
  to,
  count,
  estimated,
}) => {
  if (!estimated) {
    return `${from}–${to}，共 ${count !== -1 ? count : `多于 ${to}`} 条`;
  }
  const estimatedLabel = estimated && estimated > to ? `约 ${estimated}` : `多于 ${to}`;
  return `${from}–${to}，共 ${count !== -1 ? count : estimatedLabel} 条`;
};

const ZH_LOCALE_TEXT: DataGridLocaleText = {
  ...zhCN.components.MuiDataGrid.defaultProps.localeText,
  paginationDisplayedRows: ZH_PAGINATION_DISPLAYED_ROWS,
};

export { normalizeAppLocale, type AppLocale };

export function getDataGridLocaleText(localeInput: string): DataGridLocaleText {
  switch (normalizeAppLocale(localeInput)) {
    case 'en':
      return EN_LOCALE_TEXT;
    case 'zh':
      return ZH_LOCALE_TEXT;
    default:
      return RU_LOCALE_TEXT;
  }
}
