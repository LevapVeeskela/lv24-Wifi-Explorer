import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { ScanSettingsGeneralPanel } from './ScanSettingsGeneralPanel';
import type { ScanSettings } from './types';

export type ScanSettingsDialogProps = {
  open: boolean;
  settings: ScanSettings;
  onClose: () => void;
  onChange: (next: ScanSettings) => void;
  labels: {
    title: string;
    signalUnit: string;
    signalUnitDbm: string;
    signalUnitPercent: string;
    minRssi: string;
    scanInterval: string;
    scanIntervalSec: (sec: number) => string;
  };
};

/** Compact general settings (AppBar). Full SPEC window: `ScanSettingsWindow`. */
export function ScanSettingsDialog({
  open,
  settings,
  onClose,
  onChange,
  labels,
}: ScanSettingsDialogProps) {
  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle>{labels.title}</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 1 }}>
        <ScanSettingsGeneralPanel settings={settings} onChange={onChange} />
      </DialogContent>
    </Dialog>
  );
}
