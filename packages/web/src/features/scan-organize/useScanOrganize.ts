import type { ScanGridRow } from '@/entities/bss';
import { loadOrganizeBy, saveOrganizeBy } from './persist';
import type { OrganizeByValue } from './types';
import { useCallback, useState } from 'react';

/**
 * Build a DataGrid Pro `getTreeDataPath` getter for an organize-by mode.
 * Each row path is `[groupLabel, rowId]` so the grid renders one group per
 * label with its rows as children (paths stay unique). Returns `null` when
 * grouping is off.
 */
export function treeDataPathForOrganize(
  value: OrganizeByValue
): ((row: ScanGridRow) => readonly string[]) | null {
  switch (value) {
    case 'ssid':
      return (row) => [row.ssid || '\u2039hidden\u203a', `row:${row.id}`];
    case 'ap':
      return (row) => [row.bssid, `row:${row.id}`];
    case 'vendor':
      return (row) => [row.vendor ?? '\u2014', `row:${row.id}`];
    default:
      return null;
  }
}

export type UseScanOrganizeResult = {
  organizeBy: OrganizeByValue;
  setOrganizeBy: (value: OrganizeByValue) => void;
};

/** Persisted row-grouping mode for the scan grid. */
export function useScanOrganize(): UseScanOrganizeResult {
  const [organizeBy, setOrganizeByState] = useState<OrganizeByValue>(() => loadOrganizeBy());

  const setOrganizeBy = useCallback((value: OrganizeByValue) => {
    setOrganizeByState(value);
    saveOrganizeBy(value);
  }, []);

  return { organizeBy, setOrganizeBy };
}
