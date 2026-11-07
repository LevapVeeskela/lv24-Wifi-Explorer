import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { ScanSettingsAdvancedPanel } from './ScanSettingsAdvancedPanel';
import { ScanSettingsAnnotationsPanel } from './ScanSettingsAnnotationsPanel';
import { ScanSettingsColumnsPanel } from './ScanSettingsColumnsPanel';
import { ScanSettingsGeneralPanel } from './ScanSettingsGeneralPanel';
import { ScanSettingsVendorPanel } from './ScanSettingsVendorPanel';
import { type SettingsTabId, SETTINGS_TABS, isSettingsTabId } from './settingsTabs';
import { useSettingsMessage } from './useSettingsMessage';
import type { ScanSettings, ScanSettingsAnnotationRule } from './types';

export type ScanSettingsWindowProps = {
  open: boolean;
  onClose: () => void;
  settings: ScanSettings;
  onSettingsChange: (next: ScanSettings) => void;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (next: Record<string, boolean>) => void;
  onResetColumns: () => void;
  initialTab?: SettingsTabId;
  annotations?: readonly ScanSettingsAnnotationRule[];
  onAnnotationUpsert?: (input: { id?: string; bssidPattern: string; text: string }) => void;
  onAnnotationRemove?: (id: string) => void;
  onAnnotationsImportCsv?: (text: string) => void;
  onAnnotationsExportCsv?: () => string;
};

export function ScanSettingsWindow({
  open,
  onClose,
  settings,
  onSettingsChange,
  columnVisibility,
  onColumnVisibilityChange,
  onResetColumns,
  initialTab = 'general',
  annotations = [],
  onAnnotationUpsert,
  onAnnotationRemove,
  onAnnotationsImportCsv,
  onAnnotationsExportCsv,
}: ScanSettingsWindowProps) {
  const msg = useSettingsMessage();
  const [tab, setTab] = useState<SettingsTabId>(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  const tabLabel = (id: SettingsTabId): string => {
    switch (id) {
      case 'general':
        return msg('scan.settings.tab.general');
      case 'columns':
        return msg('scan.settings.tab.columns');
      case 'annotations':
        return msg('scan.settings.tab.annotations');
      case 'vendor':
        return msg('scan.settings.tab.vendor');
      case 'advanced':
        return msg('scan.settings.tab.advanced');
      default:
        return id;
    }
  };

  const activeTab = useMemo(() => (isSettingsTabId(tab) ? tab : 'general'), [tab]);

  const panel = (() => {
    switch (activeTab) {
      case 'columns':
        return (
          <ScanSettingsColumnsPanel
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={onColumnVisibilityChange}
            onResetColumns={onResetColumns}
          />
        );
      case 'annotations':
        return (
          <ScanSettingsAnnotationsPanel
            rules={annotations}
            onExportCsv={onAnnotationsExportCsv}
            onImportCsv={onAnnotationsImportCsv}
            onRemove={onAnnotationRemove}
            onUpsert={onAnnotationUpsert}
          />
        );
      case 'vendor':
        return <ScanSettingsVendorPanel />;
      case 'advanced':
        return <ScanSettingsAdvancedPanel settings={settings} onChange={onSettingsChange} />;
      case 'general':
      default:
        return <ScanSettingsGeneralPanel settings={settings} onChange={onSettingsChange} />;
    }
  })();

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>{msg('scan.settings.windowTitle')}</DialogTitle>
      <DialogContent sx={{ pb: 3, pt: 0 }}>
        <Box sx={{ display: 'flex', minHeight: 360, gap: 0 }}>
          <List
            aria-label={msg('scan.settings.title')}
            sx={{
              width: 200,
              flexShrink: 0,
              borderRight: 1,
              borderColor: 'divider',
              pt: 0,
            }}
          >
            {SETTINGS_TABS.map((id) => (
              <ListItemButton
                key={id}
                selected={activeTab === id}
                onClick={() => setTab(id)}
              >
                <ListItemText primary={tabLabel(id)} slotProps={{ primary: { variant: 'body2' } }} />
              </ListItemButton>
            ))}
          </List>
          <Box sx={{ flex: 1, pl: 3, pr: 1, pt: 1, overflow: 'auto' }}>
            <Typography component="h2" sx={{ mb: 2 }} variant="subtitle1">
              {tabLabel(activeTab)}
            </Typography>
            {panel}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
