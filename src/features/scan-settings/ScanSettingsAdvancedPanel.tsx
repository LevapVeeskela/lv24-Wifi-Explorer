import {
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
} from '@mui/material';
import { useSettingsMessage } from './useSettingsMessage';
import type { GraphLabelMode, ScanSettings } from './types';

export type ScanSettingsAdvancedPanelProps = {
  settings: ScanSettings;
  onChange: (next: ScanSettings) => void;
};

const GRAPH_LABEL_OPTIONS: GraphLabelMode[] = ['ssid', 'apName', 'annotation'];

export function ScanSettingsAdvancedPanel({ settings, onChange }: ScanSettingsAdvancedPanelProps) {
  const msg = useSettingsMessage();

  function graphLabelLabel(mode: GraphLabelMode): string {
    switch (mode) {
      case 'ssid':
        return msg('scan.settings.advanced.graphLabels.ssid');
      case 'apName':
        return msg('scan.settings.advanced.graphLabels.apName');
      case 'annotation':
        return msg('scan.settings.advanced.graphLabels.annotation');
      default:
        return mode;
    }
  }

  return (
    <Stack spacing={2}>
      <FormControlLabel
        control={
          <Switch
            checked={settings.hideEmptySpectrumBand}
            onChange={(_, checked) => onChange({ ...settings, hideEmptySpectrumBand: checked })}
          />
        }
        label={msg('scan.settings.advanced.hideEmptySpectrum')}
      />

      <FormControl fullWidth size="small">
        <InputLabel id="scan-settings-graph-labels">{msg('scan.settings.advanced.graphLabels')}</InputLabel>
        <Select
          label={msg('scan.settings.advanced.graphLabels')}
          labelId="scan-settings-graph-labels"
          value={settings.graphLabelMode}
          onChange={(event) =>
            onChange({ ...settings, graphLabelMode: event.target.value as GraphLabelMode })
          }
        >
          {GRAPH_LABEL_OPTIONS.map((mode) => (
            <MenuItem key={mode} value={mode}>
              {graphLabelLabel(mode)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            checked={settings.appearanceFollowSystem}
            onChange={(_, checked) => onChange({ ...settings, appearanceFollowSystem: checked })}
          />
        }
        label={msg('scan.settings.advanced.followSystem')}
      />
    </Stack>
  );
}
