import type { ScanGridRow } from '@/entities/bss';
import type { SignalDisplayUnit } from '@/features/scan-settings';
import type { MessageKey } from '@/shared/i18n';

export type PrintColumn = {
  id: string;
  label: string;
};

export type PrintVisibleTableRequest = {
  productTitle: string;
  rows: readonly ScanGridRow[];
  columns: readonly PrintColumn[];
  signalUnit: SignalDisplayUnit;
  hiddenSsidLabel: string;
  networkTypeLabels: {
    ibss: string;
    infrastructure: string;
  };
  formatIssueKey: (key: MessageKey) => string;
  printedAt?: Date;
};

export type PrintBuildResult = {
  html: string;
  rowCount: number;
  columnCount: number;
};
