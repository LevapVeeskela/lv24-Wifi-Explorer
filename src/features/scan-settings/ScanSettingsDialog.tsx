import {
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { SCAN_INTERVAL_SEC_OPTIONS } from './constants';
import type { ScanSettings, SignalDisplayUnit } from './types';

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
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1, pb: 1 }}>
          <Stack spacing={1}>
            <Typography color="text.secondary" variant="subtitle2">
              {labels.signalUnit}
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={settings.signalUnit}
              onChange={(_, value: SignalDisplayUnit | null) => {
                if (value) onChange({ ...settings, signalUnit: value });
              }}
            >
              <ToggleButton value="dbm">{labels.signalUnitDbm}</ToggleButton>
              <ToggleButton value="percent">{labels.signalUnitPercent}</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack spacing={1}>
            <Typography color="text.secondary" variant="subtitle2">
              {labels.minRssi}
            </Typography>
            <Slider
              max={-40}
              min={-95}
              step={1}
              value={settings.minRssiDbm ?? -95}
              valueLabelDisplay="auto"
              onChange={(_, value) => {
                const num = value as number;
                onChange({
                  ...settings,
                  minRssiDbm: num <= -95 ? null : num,
                });
              }}
            />
          </Stack>

          <FormControl fullWidth size="small">
            <InputLabel id="scan-settings-interval-label">{labels.scanInterval}</InputLabel>
            <Select
              label={labels.scanInterval}
              labelId="scan-settings-interval-label"
              value={settings.scanIntervalSec}
              onChange={(event) => {
                const sec = Number(event.target.value);
                onChange({ ...settings, scanIntervalSec: sec });
              }}
            >
              {SCAN_INTERVAL_SEC_OPTIONS.map((sec) => (
                <MenuItem key={sec} value={sec}>
                  {labels.scanIntervalSec(sec)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
