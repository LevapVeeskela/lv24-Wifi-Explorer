import { Button, Divider, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { ColumnProfilesControls, useColumnProfiles } from '@/features/column-profiles';
import { useColumnRules, type ColumnRulesHighlight } from '@/features/column-rules';
import { SCAN_GRID_COLUMNS } from './columnCatalog';
import { useSettingsMessage } from './useSettingsMessage';

function withHighlightToggled(
  highlights: ColumnRulesHighlight[],
  key: ColumnRulesHighlight,
  on: boolean,
): ColumnRulesHighlight[] {
  const next = new Set(highlights);
  if (on) next.add(key);
  else next.delete(key);
  return [...next];
}

export type ScanSettingsColumnsPanelProps = {
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (next: Record<string, boolean>) => void;
  onResetColumns: () => void;
};

export function ScanSettingsColumnsPanel({
  columnVisibility,
  onColumnVisibilityChange,
  onResetColumns,
}: ScanSettingsColumnsPanelProps) {
  const msg = useSettingsMessage();
  const { config: columnRules, setConfig: setColumnRules } = useColumnRules();
  const columnProfiles = useColumnProfiles({
    columnVisibility,
    onApplyVisibility: onColumnVisibilityChange,
  });

  return (
    <Stack spacing={2}>
      <ColumnProfilesControls profiles={columnProfiles} />
      <Divider />
      <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            columnProfiles.resetToDefault();
            onResetColumns();
          }}
        >
          {msg('scan.settings.columns.reset')}
        </Button>
      </Stack>
      <Stack spacing={0.5}>
        {SCAN_GRID_COLUMNS.filter((col) => col.hideable).map((col) => (
          <FormControlLabel
            key={col.field}
            control={
              <Switch
                checked={columnVisibility[col.field] !== false}
                onChange={(_, checked) =>
                  onColumnVisibilityChange({ ...columnVisibility, [col.field]: checked })
                }
              />
            }
            label={msg(col.labelKey)}
          />
        ))}
      </Stack>
      <Divider />
      <Typography color="text.secondary" variant="body2">
        {msg('scan.settings.columns.cellRules')}
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={columnRules.enabled}
            onChange={(_, checked) => setColumnRules({ ...columnRules, enabled: checked })}
          />
        }
        label={msg('scan.settings.columns.cellRules.enabled')}
      />
      <FormControlLabel
        control={
          <Switch
            checked={columnRules.highlights.includes('rssi')}
            disabled={!columnRules.enabled}
            onChange={(_, checked) =>
              setColumnRules({
                ...columnRules,
                highlights: withHighlightToggled(columnRules.highlights, 'rssi', checked),
              })
            }
          />
        }
        label={msg('scan.settings.columns.cellRules.rssi')}
      />
      <FormControlLabel
        control={
          <Switch
            checked={columnRules.highlights.includes('security')}
            disabled={!columnRules.enabled}
            onChange={(_, checked) =>
              setColumnRules({
                ...columnRules,
                highlights: withHighlightToggled(columnRules.highlights, 'security', checked),
              })
            }
          />
        }
        label={msg('scan.settings.columns.cellRules.security')}
      />
      <Typography color="text.secondary" variant="caption">
        {msg('scan.settings.columns.orderHint')}
      </Typography>
    </Stack>
  );
}
