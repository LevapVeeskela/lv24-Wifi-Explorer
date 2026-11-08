import { useEffect, useMemo, useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import type { ObservedBss } from '@/domain/bss';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import type { GraphLabelMode } from '@/features/scan-settings/types';
import type { ChartTimescale, SignalChartUnit } from '@/features/signal-history/types';
import { createFormatMessage, type MessageKey } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';
import { BssComparePane } from '@/features/bss-compare';
import { AdvancedDetailsPane } from '@/widgets/AdvancedDetailsPane';
import { IssuesInspectorPanel } from '@/widgets/IssuesInspector';
import { AdvancedIeTree } from './AdvancedIeTree';
import { ChartStrip, OccupancyBandStrip, SignalHistoryChart } from '@/widgets/ChartStrip';
import { NetworkDetailsPane } from '@/widgets/NetworkDetailsPane';
import { detailsTabPanelHiddenSx, detailsTabPanelSx, detailsTabsRootSx } from './styles';

export const DETAILS_TAB_IDS = [
  'details',
  'signal',
  'occupancy',
  'compare',
  'advanced',
  'issues',
] as const;

export type DetailsTabId = (typeof DETAILS_TAB_IDS)[number];

const TAB_MESSAGE: Record<DetailsTabId, MessageKey> = {
  details: 'scan.tab.details',
  signal: 'scan.tab.signal',
  occupancy: 'scan.tab.occupancy',
  compare: 'scan.tab.compare',
  advanced: 'scan.tab.advanced',
  issues: 'scan.issues.title',
};

export type DetailsTabsProps = {
  tab: DetailsTabId;
  onTabChange: (tab: DetailsTabId) => void;
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

function TabPanel({
  id,
  current,
  children,
}: {
  id: DetailsTabId;
  current: DetailsTabId;
  children: React.ReactNode;
}) {
  const hidden = id !== current;
  return (
    <Box
      aria-labelledby={`scan-tab-${id}`}
      hidden={hidden}
      id={`scan-tabpanel-${id}`}
      role="tabpanel"
      sx={hidden ? detailsTabPanelHiddenSx : detailsTabPanelSx}
    >
      {hidden ? null : children}
    </Box>
  );
}

export function DetailsTabs({
  tab,
  onTabChange,
  selectedRow,
  compareRows,
  allBss,
  chartUnit,
  onChartUnitChange,
  timescale: timescaleProp,
  onTimescaleChange,
  hideEmptySpectrumBand = true,
  graphLabelMode = 'ssid',
  pinnedColor = null,
  onPinColor,
}: DetailsTabsProps) {
  const { locale } = useScanIntl();
  const formatMessage = useMemo(() => createFormatMessage(locale), [locale]);
  const [localTimescale, setLocalTimescale] = useState(timescaleProp);
  useEffect(() => {
    setLocalTimescale(timescaleProp);
  }, [timescaleProp]);
  const timescale = onTimescaleChange ? timescaleProp : localTimescale;
  const setTimescale = onTimescaleChange ?? setLocalTimescale;

  return (
    <Box sx={detailsTabsRootSx}>
      <Tabs
        allowScrollButtonsMobile
        scrollButtons="auto"
        value={tab}
        variant="scrollable"
        onChange={(_, value: DetailsTabId) => onTabChange(value)}
      >
        {DETAILS_TAB_IDS.map((id) => (
          <Tab
            key={id}
            aria-controls={`scan-tabpanel-${id}`}
            id={`scan-tab-${id}`}
            label={formatMessage(TAB_MESSAGE[id])}
            value={id}
          />
        ))}
      </Tabs>
      <TabPanel current={tab} id="details">
        <NetworkDetailsPane row={selectedRow} pinnedColor={pinnedColor} onPinColor={onPinColor} />
        <ChartStrip
          allBss={allBss}
          chartUnit={chartUnit}
          graphLabelMode={graphLabelMode}
          hideEmptyBands={hideEmptySpectrumBand}
          selectedRow={selectedRow}
          timescale={timescale}
          onChartUnitChange={onChartUnitChange}
          onTimescaleChange={setTimescale}
        />
      </TabPanel>
      <TabPanel current={tab} id="signal">
        <SignalHistoryChart
          graphLabelMode={graphLabelMode}
          height={280}
          row={selectedRow}
          timescale={timescale}
          unit={chartUnit}
          onTimescaleChange={setTimescale}
          onUnitChange={onChartUnitChange}
        />
      </TabPanel>
      <TabPanel current={tab} id="occupancy">
        <OccupancyBandStrip
          bssList={allBss}
          height={280}
          hideEmptyBands={hideEmptySpectrumBand}
          selectedRow={selectedRow}
        />
      </TabPanel>
      <TabPanel current={tab} id="compare">
        <BssComparePane rows={compareRows} />
      </TabPanel>
      <TabPanel current={tab} id="advanced">
        <AdvancedDetailsPane row={selectedRow} />
        <AdvancedIeTree row={selectedRow} />
      </TabPanel>
      <TabPanel current={tab} id="issues">
        <IssuesInspectorPanel />
      </TabPanel>
    </Box>
  );
}
