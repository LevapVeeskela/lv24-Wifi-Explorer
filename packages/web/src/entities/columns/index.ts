/**
 * Scan grid column catalog — the single source of truth for column fields,
 * labels, defaults and visibility. Pure config; no UI or persistence.
 */
export {
  DEFAULT_COLUMN_VISIBILITY,
  DEFAULT_HIDDEN_FIELDS,
  DEFAULT_VISIBLE_FIELDS,
  SCAN_GRID_COLUMNS,
  resetColumnVisibility,
  type ScanGridColumnDef,
  type ScanGridColumnField,
} from './columnCatalog';
