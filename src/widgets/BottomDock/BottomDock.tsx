import { Paper } from '@mui/material';
import type { ObservedBss } from '@/domain/bss';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import type { ChartTimescale, SignalChartUnit } from '@/features/signal-history/types';
import { DetailsTabs, type DetailsTabId } from '@/widgets/DetailsTabs';
import { bottomDockSx } from './styles';

export type DetailsTab = DetailsTabId;

export type BottomDockProps = {
  tab: DetailsTab;
  onTabChange: (tab: DetailsTab) => void;
  selectedRow: ScanGridRow | null;
  allBss: readonly ObservedBss[];
  chartUnit: SignalChartUnit;
  onChartUnitChange: (unit: SignalChartUnit) => void;
  timescale: ChartTimescale;
  onTimescaleChange?: (timescale: ChartTimescale) => void;
};

export function BottomDock({
  tab,
  onTabChange,
  selectedRow,
  allBss,
  chartUnit,
  onChartUnitChange,
  timescale,
  onTimescaleChange,
}: BottomDockProps) {
  return (
    <Paper elevation={0} square sx={bottomDockSx}>
      <DetailsTabs
        allBss={allBss}
        chartUnit={chartUnit}
        selectedRow={selectedRow}
        tab={tab}
        timescale={timescale}
        onChartUnitChange={onChartUnitChange}
        onTabChange={onTabChange}
        onTimescaleChange={onTimescaleChange}
      />
    </Paper>
  );
}
