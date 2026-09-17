import { useEffect, useMemo, useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import type { ObservedBss } from '@/domain/bss';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import type { ChartTimescale, SignalChartUnit } from '@/features/signal-history/types';
import { createFormatMessage, type MessageKey } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';
import { AdvancedDetailsPane } from '@/widgets/AdvancedDetailsPane';
import { ChartStrip, OccupancyBandStrip, SignalHistoryChart } from '@/widgets/ChartStrip';
import { NetworkDetailsPane } from '@/widgets/NetworkDetailsPane';
import { detailsTabPanelHiddenSx, detailsTabPanelSx, detailsTabsRootSx } from './styles';

export const DETAILS_TAB_IDS = ['details', 'signal', 'occupancy', 'advanced'] as const;

export type DetailsTabId = (typeof DETAILS_TAB_IDS)[number];

const TAB_MESSAGE: Record<DetailsTabId, MessageKey> = {
  details: 'scan.tab.details',
  signal: 'scan.tab.signal',
  occupancy: 'scan.tab.occupancy',
  advanced: 'scan.tab.advanced',
};

export type DetailsTabsProps = {
  tab: DetailsTabId;
  onTabChange: (tab: DetailsTabId) => void;
  selectedRow: ScanGridRow | null;
  allBss: readonly ObservedBss[];
  chartUnit: SignalChartUnit;
  onChartUnitChange: (unit: SignalChartUnit) => void;
  timescale: ChartTimescale;
  onTimescaleChange?: (timescale: ChartTimescale) => void;
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
  allBss,
  chartUnit,
  onChartUnitChange,
  timescale: timescaleProp,
  onTimescaleChange,
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
        <NetworkDetailsPane row={selectedRow} />
        <ChartStrip
          allBss={allBss}
          chartUnit={chartUnit}
          selectedRow={selectedRow}
          timescale={timescale}
          onChartUnitChange={onChartUnitChange}
          onTimescaleChange={setTimescale}
        />
      </TabPanel>
      <TabPanel current={tab} id="signal">
        <SignalHistoryChart
          height={280}
          row={selectedRow}
          timescale={timescale}
          unit={chartUnit}
          onTimescaleChange={setTimescale}
          onUnitChange={onChartUnitChange}
        />
      </TabPanel>
      <TabPanel current={tab} id="occupancy">
        <OccupancyBandStrip bssList={allBss} height={280} selectedRow={selectedRow} />
      </TabPanel>
      <TabPanel current={tab} id="advanced">
        <AdvancedDetailsPane row={selectedRow} />
      </TabPanel>
    </Box>
  );
}
