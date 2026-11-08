import { Divider, Menu, MenuItem } from '@mui/material';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';

export type ScanCellMenuAnchor = { top: number; left: number };

export type ScanCellContextMenuProps = {
  /** Cursor position; `null` keeps the menu closed. */
  anchorPosition: ScanCellMenuAnchor | null;
  /** Exact field of the clicked cell. */
  field: string;
  /** Query built from the cell value; `null` disables the filter actions. */
  filterQuery: string | null;
  /** Column can be shown (known catalog column that is currently hidden). */
  canShowColumn: boolean;
  onApplyFilter: (query: string) => void;
  onApplyFilterNegate: (query: string) => void;
  onClose: () => void;
  onShowColumn: (field: string) => void;
};

export function ScanCellContextMenu({
  anchorPosition,
  field,
  filterQuery,
  canShowColumn,
  onApplyFilter,
  onApplyFilterNegate,
  onClose,
  onShowColumn,
}: ScanCellContextMenuProps) {
  const open = anchorPosition != null;
  const { formatMessage } = useScanIntl();

  return (
    <Menu
      anchorPosition={anchorPosition ?? undefined}
      anchorReference="anchorPosition"
      open={open}
      onClose={onClose}
    >
      <MenuItem
        disabled={filterQuery == null}
        onClick={() => {
          if (filterQuery != null) onApplyFilter(filterQuery);
          onClose();
        }}
      >
        {formatMessage('scan.grid.applyFilter')}
      </MenuItem>
      <MenuItem
        disabled={filterQuery == null}
        onClick={() => {
          if (filterQuery != null) onApplyFilterNegate(filterQuery);
          onClose();
        }}
      >
        {formatMessage('scan.grid.applyFilterNegate')}
      </MenuItem>
      <Divider />
      <MenuItem
        disabled={!canShowColumn}
        onClick={() => {
          onShowColumn(field);
          onClose();
        }}
      >
        {formatMessage('scan.grid.applyColumn')}
      </MenuItem>
    </Menu>
  );
}
