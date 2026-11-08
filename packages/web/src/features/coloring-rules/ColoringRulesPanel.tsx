import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Delete from '@mui/icons-material/Delete';
import { COLORING_FIELDS, COLORING_OPS } from './constants';
import { importColoringRules } from './importExport';
import { newColoringRuleId, normalizeColor, withUniquePriorities } from './normalize';
import { saveColoringRules } from './persist';
import type { ColoringField, ColoringOp, ColoringRulesConfig } from './types';
import { useScanIntl } from '@/shared/i18n';
import { openWorkbenchFile, saveWorkbenchFile } from '@/shared/lib/files/rendererFileIo';

export type ColoringRulesPanelProps = {
  store: ColoringRulesConfig;
  onChange: (next: ColoringRulesConfig) => void;
};

const DEFAULT_COLOR = '#fb6e4a';

export function ColoringRulesPanel({ store, onChange }: ColoringRulesPanelProps) {
  const { formatMessage } = useScanIntl();
  const [name, setName] = useState('');
  const [field, setField] = useState<ColoringField>('ssid');
  const [op, setOp] = useState<ColoringOp>('contains');
  const [value, setValue] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);

  const commit = (next: ColoringRulesConfig) => {
    const normalized = { ...next, rules: withUniquePriorities(next.rules) };
    onChange(normalized);
    saveColoringRules(normalized);
  };

  const addRule = () => {
    const normalizedColor = normalizeColor(color);
    if (!normalizedColor || value.trim().length === 0) return;
    commit({
      ...store,
      rules: [
        ...store.rules,
        {
          id: newColoringRuleId(),
          name: name.trim() || value.trim(),
          enabled: true,
          priority: store.rules.length,
          color: normalizedColor,
          field,
          op,
          value: value.trim(),
        },
      ],
    });
    setName('');
    setValue('');
  };

  const removeRule = (id: string) => {
    commit({ ...store, rules: store.rules.filter((rule) => rule.id !== id) });
  };

  const toggleRule = (id: string, enabled: boolean) => {
    commit({
      ...store,
      rules: store.rules.map((rule) => (rule.id === id ? { ...rule, enabled } : rule)),
    });
  };

  const exportRules = async () => {
    const { exportColoringRules } = await import('@/features/coloring-rules');
    await saveWorkbenchFile({
      defaultPath: 'lv24-coloring-rules.json',
      contents: exportColoringRules(store),
      mimeType: 'application/json',
    });
  };

  const importRules = async () => {
    const picked = await openWorkbenchFile({ accept: '.json,application/json' });
    if (picked.canceled) return;
    const parsed = importColoringRules(picked.text);
    if (!parsed.ok) return;
    commit(parsed.store);
  };

  return (
    <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 2, pt: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2">{formatMessage('scan.coloring.title')}</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button onClick={() => void importRules()} size="small">
            {formatMessage('scan.coloring.import')}
          </Button>
          <Button onClick={() => void exportRules()} size="small">
            {formatMessage('scan.coloring.export')}
          </Button>
          <Switch
            checked={store.enabled}
            onChange={(_, enabled) => commit({ ...store, enabled })}
            size="small"
          />
        </Stack>
      </Stack>
      {store.rules.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
          {formatMessage('scan.coloring.empty')}
        </Typography>
      ) : (
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {store.rules.map((rule) => (
            <Stack
              direction="row"
              key={rule.id}
              spacing={1}
              sx={{ alignItems: 'center', minHeight: 34 }}
            >
              <Box sx={{ background: rule.color, borderRadius: 1, height: 18, width: 18 }} />
              <Typography sx={{ flex: 1 }} variant="body2">
                {rule.name} · {rule.field} {rule.op} {rule.value}
              </Typography>
              <Switch
                checked={rule.enabled}
                onChange={(_, enabled) => toggleRule(rule.id, enabled)}
                size="small"
              />
              <IconButton
                aria-label={formatMessage('scan.coloring.delete')}
                onClick={() => removeRule(rule.id)}
                size="small"
              >
                <Delete fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      )}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 1.5 }}>
        <TextField
          label={formatMessage('scan.coloring.name')}
          onChange={(event) => setName(event.target.value)}
          size="small"
          value={name}
        />
        <Select
          onChange={(event) => setField(event.target.value as ColoringField)}
          size="small"
          value={field}
        >
          {COLORING_FIELDS.map((id) => (
            <MenuItem key={id} value={id}>
              {id}
            </MenuItem>
          ))}
        </Select>
        <Select
          onChange={(event) => setOp(event.target.value as ColoringOp)}
          size="small"
          value={op}
        >
          {COLORING_OPS.map((id) => (
            <MenuItem key={id} value={id}>
              {id}
            </MenuItem>
          ))}
        </Select>
        <TextField
          label={formatMessage('scan.coloring.value')}
          onChange={(event) => setValue(event.target.value)}
          size="small"
          value={value}
        />
        <TextField
          onChange={(event) => setColor(event.target.value)}
          size="small"
          sx={{ width: 110 }}
          type="color"
          value={color}
        />
        <Button
          disabled={value.trim().length === 0}
          onClick={addRule}
          size="small"
          variant="contained"
        >
          {formatMessage('scan.coloring.add')}
        </Button>
      </Stack>
    </Box>
  );
}
