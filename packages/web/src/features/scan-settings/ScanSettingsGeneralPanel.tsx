import {
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { SCAN_INTERVAL_SEC_OPTIONS } from './constants';
import { useSettingsMessage } from './useSettingsMessage';
import type { ScanSettings, SignalDisplayUnit } from './types';
import { normalizeAppLocale, writeLocalePreference, type AppLocale } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n';

const LOCALE_OPTIONS: { value: AppLocale; labelKey: string }[] = [
  { value: 'ru', labelKey: 'scan.settings.language.ru' },
  { value: 'en', labelKey: 'scan.settings.language.en' },
  { value: 'zh', labelKey: 'scan.settings.language.zh' },
];

export type ScanSettingsGeneralPanelProps = {
  settings: ScanSettings;
  onChange: (next: ScanSettings) => void;
};

export function ScanSettingsGeneralPanel({ settings, onChange }: ScanSettingsGeneralPanelProps) {
  const msg = useSettingsMessage();
  const { locale } = useScanIntl();
  const activeLocale = normalizeAppLocale(locale);
  return (
    <Stack spacing={3}>
      <FormControl fullWidth size="small">
        <InputLabel id="scan-settings-language-label">{msg('scan.settings.language')}</InputLabel>
        <Select
          label={msg('scan.settings.language')}
          labelId="scan-settings-language-label"
          value={activeLocale}
          onChange={(event) => {
            writeLocalePreference(normalizeAppLocale(String(event.target.value)));
          }}
        >
          {LOCALE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {msg(option.labelKey)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack spacing={1}>
        <Typography color="text.secondary" variant="subtitle2">
          {msg('scan.settings.signalUnit')}
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={settings.signalUnit}
          onChange={(_, value: SignalDisplayUnit | null) => {
            if (value) onChange({ ...settings, signalUnit: value });
          }}
        >
          <ToggleButton value="dbm">{msg('scan.settings.signalUnit.dbm')}</ToggleButton>
          <ToggleButton value="percent">{msg('scan.settings.signalUnit.percent')}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Stack spacing={1}>
        <Typography color="text.secondary" variant="subtitle2">
          {msg('scan.filter.minRssi')}
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
        <InputLabel id="scan-settings-interval-label">
          {msg('scan.settings.scanInterval')}
        </InputLabel>
        <Select
          label={msg('scan.settings.scanInterval')}
          labelId="scan-settings-interval-label"
          value={settings.scanIntervalSec}
          onChange={(event) => {
            const sec = Number(event.target.value);
            onChange({ ...settings, scanIntervalSec: sec });
          }}
        >
          {SCAN_INTERVAL_SEC_OPTIONS.map((sec) => (
            <MenuItem key={sec} value={sec}>
              {msg('scan.settings.scanIntervalSec', { sec })}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            checked={settings.autoStartScanOnLaunch}
            onChange={(_, checked) => onChange({ ...settings, autoStartScanOnLaunch: checked })}
          />
        }
        label={msg('scan.settings.autoStartScan')}
      />

      <FormControlLabel
        control={
          <Switch
            checked={settings.includeHiddenSsid}
            onChange={(_, checked) => onChange({ ...settings, includeHiddenSsid: checked })}
          />
        }
        label={msg('scan.settings.includeHiddenSsid')}
      />
    </Stack>
  );
}
