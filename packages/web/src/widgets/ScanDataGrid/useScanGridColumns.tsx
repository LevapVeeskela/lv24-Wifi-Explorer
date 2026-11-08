import { useMemo } from 'react';
import type { GridColDef } from '@mui/x-data-grid-pro';
import type { ScanGridRow } from '@/entities/bss';
import type { SignalDisplayUnit } from '@/features/scan-settings';
import { useScanIntl } from '@/shared/i18n';
import { buildScanGridColumns } from './columns';

export function useScanGridColumns(
  signalUnit: SignalDisplayUnit = 'percent'
): GridColDef<ScanGridRow>[] {
  const { formatMessage } = useScanIntl();

  return useMemo(
    (): GridColDef<ScanGridRow>[] => buildScanGridColumns({ formatMessage, signalUnit }),
    [formatMessage, signalUnit]
  );
}
