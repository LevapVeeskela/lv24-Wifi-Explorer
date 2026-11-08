import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useScanIntl } from '@/shared/i18n';
import {
  aboutActionsSx,
  aboutBodySx,
  aboutCaptionSx,
  aboutContentSx,
  aboutDialogPaperSx,
  aboutProductSx,
  aboutTitleSx,
  aboutVersionSx,
} from './styles';

export const PRODUCT_NAME = 'LV24 WiFi Explorer';

export type AboutDialogProps = {
  open: boolean;
  onClose: () => void;
  version: string;
  scanCoreVersion?: string;
};

export function AboutDialog({ open, onClose, version, scanCoreVersion }: AboutDialogProps) {
  const { formatMessage } = useScanIntl();
  const productName = formatMessage('scan.about.title') || PRODUCT_NAME;
  const scanCoreLine = scanCoreVersion
    ? `${formatMessage('scan.about.scanCore')} ${formatMessage('scan.status.version', { version: scanCoreVersion })}`
    : formatMessage('scan.about.scanCore');

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: aboutDialogPaperSx } }}
    >
      <DialogTitle sx={aboutTitleSx}>
        <Typography component="span" sx={aboutProductSx} variant="h6">
          {productName}
        </Typography>
      </DialogTitle>
      <DialogContent sx={aboutContentSx}>
        <Typography sx={aboutVersionSx} variant="body2">
          {formatMessage('scan.status.version', { version })}
        </Typography>
        <Typography sx={aboutBodySx} variant="body2">
          {scanCoreLine}
        </Typography>
        <Typography sx={aboutBodySx} variant="body2">
          {formatMessage('scan.about.location')}
        </Typography>
        <Typography sx={aboutCaptionSx} variant="caption">
          {formatMessage('scan.about.attribution')}
        </Typography>
      </DialogContent>
      <DialogActions sx={aboutActionsSx}>
        <Button onClick={onClose}>{formatMessage('scan.status.about')}</Button>
      </DialogActions>
    </Dialog>
  );
}
