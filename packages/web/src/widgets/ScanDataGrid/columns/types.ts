import type { FormatMessageFn } from '@/shared/i18n';
import type { SignalDisplayUnit } from '@/features/scan-settings';

/** Shared render context for every column group. */
export type ColumnContext = {
  formatMessage: FormatMessageFn;
  signalUnit: SignalDisplayUnit;
};
