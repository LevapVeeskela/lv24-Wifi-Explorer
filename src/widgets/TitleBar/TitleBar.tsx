import { useState } from 'react';
import {
  Button,
  Chip,
  Divider,
  IconButton,
  ListSubheader,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Pause from '@mui/icons-material/Pause';
import PlayArrow from '@mui/icons-material/PlayArrow';
import DarkMode from '@mui/icons-material/DarkMode';
import LightMode from '@mui/icons-material/LightMode';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { useColorScheme } from '@mui/material/styles';
import type { CsvExportScope } from '@/features/export';
import type { ThemePreference } from '@/shared/lib/persistence/keys';
import { markManualThemePreference } from '@/features/scan-settings';
import { fileMenuButtonSx, fileMenuSubheaderSx, titleBarSx, titleClusterSx, titleLabelSx } from './styles';
import { t } from './t';

/** Electron native menu: File ⌘O/⌘S, Scan ⌘⇧S/⌘⇧T — hide duplicate TitleBar File when `window.wifiExplorer` is set. */
function hasNativeAppMenu(): boolean {
  return typeof window !== 'undefined' && window.wifiExplorer != null;
}

function fileShortcutSuffix(key: 'O' | 'P' | 'S'): string {
  const mod =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)
      ? '⌘'
      : 'Ctrl+';
  return `${mod}${key}`;
}

export type TitleBarProps = {
  scanning: boolean;
  demoMode: boolean;
  connectedSsid: string | null;
  linkSummary: string | null;
  exportSelectedDisabled?: boolean;
  onToggleScan: () => void;
  onAbout: () => void;
  onExportCsv: (scope: CsvExportScope) => void;
  onPrintVisible: () => void;
  onSaveSnapshot: () => void;
  onOpenSnapshot: () => void;
};

export function TitleBar({
  scanning,
  demoMode,
  connectedSsid,
  linkSummary,
  exportSelectedDisabled = false,
  onToggleScan,
  onAbout,
  onExportCsv,
  onPrintVisible,
  onSaveSnapshot,
  onOpenSnapshot,
}: TitleBarProps) {
  const { mode, setMode } = useColorScheme();
  const [fileMenuEl, setFileMenuEl] = useState<null | HTMLElement>(null);
  const fileMenuOpen = Boolean(fileMenuEl);

  const stateLabel = demoMode
    ? t('scan.title.demo')
    : scanning
      ? t('scan.title.scanning')
      : t('scan.title.paused');

  const toggleTheme = () => {
    const next: ThemePreference = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    markManualThemePreference(next);
  };

  const closeFileMenu = () => setFileMenuEl(null);
  const showTitleBarFileMenu = !hasNativeAppMenu();

  return (
    <Stack direction="row" sx={titleBarSx}>
      <Stack direction="row" spacing={1} sx={titleClusterSx}>
        <Typography sx={titleLabelSx} variant="subtitle2">
          {stateLabel}
          {connectedSsid ? ` · ${connectedSsid}` : ''}
        </Typography>
        {demoMode ? <Chip label={t('scan.title.demo')} size="small" /> : null}
      </Stack>

      <Stack direction="row" spacing={1} sx={titleClusterSx}>
        {linkSummary ? (
          <>
            <Typography color="text.secondary" variant="caption">
              {linkSummary}
            </Typography>
            <Divider flexItem orientation="vertical" />
          </>
        ) : null}
        {showTitleBarFileMenu ? (
          <>
            <Button
              aria-controls={fileMenuOpen ? 'scan-file-menu' : undefined}
              aria-expanded={fileMenuOpen}
              aria-haspopup="true"
              aria-label={t('scan.file.menu')}
              size="small"
              sx={fileMenuButtonSx}
              onClick={(event) => setFileMenuEl(event.currentTarget)}
            >
              {t('scan.file.menu')}
            </Button>
            <Menu
              anchorEl={fileMenuEl}
              id="scan-file-menu"
              open={fileMenuOpen}
              onClose={closeFileMenu}
            >
              <MenuItem
                onClick={() => {
                  closeFileMenu();
                  onOpenSnapshot();
                }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', width: '100%' }}>
                  <Typography component="span" variant="inherit">
                    {t('scan.file.open')}
                  </Typography>
                  <Typography color="text.secondary" component="span" sx={{ ml: 'auto' }} variant="body2">
                    {fileShortcutSuffix('O')}
                  </Typography>
                </Stack>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeFileMenu();
                  onSaveSnapshot();
                }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', width: '100%' }}>
                  <Typography component="span" variant="inherit">
                    {t('scan.file.save')}
                  </Typography>
                  <Typography color="text.secondary" component="span" sx={{ ml: 'auto' }} variant="body2">
                    {fileShortcutSuffix('S')}
                  </Typography>
                </Stack>
              </MenuItem>
              <Divider />
              <ListSubheader disableSticky sx={fileMenuSubheaderSx}>
                {t('scan.export.csv')}
              </ListSubheader>
              <MenuItem
                onClick={() => {
                  closeFileMenu();
                  onExportCsv('visible');
                }}
              >
                {t('scan.export.visible')}
              </MenuItem>
              <MenuItem
                disabled={exportSelectedDisabled}
                onClick={() => {
                  closeFileMenu();
                  onExportCsv('selected');
                }}
              >
                {t('scan.export.selected')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeFileMenu();
                  onExportCsv('all');
                }}
              >
                {t('scan.export.all')}
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  closeFileMenu();
                  onPrintVisible();
                }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', width: '100%' }}>
                  <Typography component="span" variant="inherit">
                    {t('scan.print.visible')}
                  </Typography>
                  <Typography color="text.secondary" component="span" sx={{ ml: 'auto' }} variant="body2">
                    {fileShortcutSuffix('P')}
                  </Typography>
                </Stack>
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  closeFileMenu();
                  onAbout();
                }}
              >
                {t('scan.status.about')}
              </MenuItem>
            </Menu>
          </>
        ) : null}
        <Tooltip title={scanning ? t('scan.title.paused') : t('scan.title.scanning')}>
          <IconButton aria-label={t('scan.a11y.scanToggle')} size="small" onClick={onToggleScan}>
            {scanning ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('scan.a11y.theme')}>
          <IconButton aria-label={t('scan.a11y.theme')} size="small" onClick={toggleTheme}>
            {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('scan.status.about')}>
          <IconButton aria-label={t('scan.status.about')} size="small" onClick={onAbout}>
            <InfoOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
