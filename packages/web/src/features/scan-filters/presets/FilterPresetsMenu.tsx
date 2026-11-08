import BookmarkAdd from '@mui/icons-material/BookmarkAdd';
import Delete from '@mui/icons-material/Delete';
import {
  Box,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useScanIntl } from '@/shared/i18n';
import type { UseFilterPresetsResult } from './useFilterPresets';

export type FilterPresetsMenuProps = {
  presets: UseFilterPresetsResult;
};

/**
 * AppBar control for saved filter presets: apply a preset, save the current
 * filters as a named preset, or delete one. Self-contained (owns its anchor).
 */
export function FilterPresetsMenu({ presets }: FilterPresetsMenuProps) {
  const { formatMessage } = useScanIntl();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [newName, setNewName] = useState('');
  const open = Boolean(anchorEl);

  const close = () => {
    setAnchorEl(null);
    setNewName('');
  };

  const saveCurrent = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    presets.saveCurrentAsPreset(trimmed);
    setNewName('');
  };

  return (
    <>
      <Tooltip title={formatMessage('scan.filterPresets.title')}>
        <IconButton
          aria-controls={open ? 'filter-presets-menu' : undefined}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={formatMessage('scan.filterPresets.title')}
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <BookmarkAdd />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} id="filter-presets-menu" open={open} onClose={close}>
        {presets.presets.length === 0 ? (
          <MenuItem disabled>
            <Typography color="text.secondary" variant="body2">
              {formatMessage('scan.filterPresets.empty')}
            </Typography>
          </MenuItem>
        ) : (
          presets.presets.map((preset) => (
            <MenuItem
              key={preset.id}
              onClick={() => {
                presets.applyPreset(preset.id);
                close();
              }}
            >
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', width: '100%' }}>
                <Typography noWrap variant="body2">
                  {preset.name}
                </Typography>
                <IconButton
                  aria-label={formatMessage('scan.filterPresets.delete', { name: preset.name })}
                  edge="end"
                  size="small"
                  sx={{ ml: 'auto', color: 'text.disabled' }}
                  onClick={(event) => {
                    event.stopPropagation();
                    presets.deletePreset(preset.id);
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Stack>
            </MenuItem>
          ))
        )}
        <Divider />
        <Box sx={{ px: 1, py: 0.5 }}>
          <TextField
            fullWidth
            placeholder={formatMessage('scan.filterPresets.newName')}
            size="small"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                saveCurrent();
              }
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={formatMessage('scan.filterPresets.save')}
                      color="primary"
                      disabled={!newName.trim()}
                      edge="end"
                      size="small"
                      onClick={saveCurrent}
                    >
                      <BookmarkAdd fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
      </Menu>
    </>
  );
}
