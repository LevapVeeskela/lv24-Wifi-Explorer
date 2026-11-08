import { Paper } from '@mui/material';
import type { ObservedBss } from '@/domain/bss';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import type { GraphLabelMode } from '@/features/scan-settings/types';
import type { ChartTimescale, SignalChartUnit } from '@/features/signal-history/types';
import { DetailsTabs, type DetailsTabId } from '@/widgets/DetailsTabs';
import { bottomDockSx } from './styles';

export type DetailsTab = DetailsTabId;

export type BottomDockProps = {
  tab: DetailsTab;
  onTabChange: (tab: DetailsTab) => void;
  selectedRow: ScanGridRow | null;
  compareRows: readonly ScanGridRow[];
  allBss: readonly ObservedBss[];
  chartUnit: SignalChartUnit;
  onChartUnitChange: (unit: SignalChartUnit) => void;
  timescale: ChartTimescale;
  onTimescaleChange?: (timescale: ChartTimescale) => void;
  hideEmptySpectrumBand?: boolean;
  graphLabelMode?: GraphLabelMode;
  pinnedColor?: string | null;
  onPinColor?: (color: string | null) => void;
};

export function BottomDock({
  tab,
  onTabChange,
  selectedRow,
  compareRows,
  allBss,
  chartUnit,
  onChartUnitChange,
  timescale,
  onTimescaleChange,
  hideEmptySpectrumBand,
  graphLabelMode,
  pinnedColor = null,
  onPinColor,
}: BottomDockProps) {
  return (
    <Paper elevation={0} square sx={bottomDockSx}>
      <DetailsTabs
        allBss={allBss}
        chartUnit={chartUnit}
        compareRows={compareRows}
        graphLabelMode={graphLabelMode}
        pinnedColor={pinnedColor}
        onPinColor={onPinColor}
        hideEmptySpectrumBand={hideEmptySpectrumBand}
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
