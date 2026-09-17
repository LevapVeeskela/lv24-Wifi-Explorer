import { ButtonBase, Stack, Tooltip, Typography } from '@mui/material';
import {
  detailsCopyButtonSx,
  detailsFieldLabelSx,
  detailsFieldSx,
  detailsValueMonoSx,
  detailsValueSx,
} from './styles';

export type DetailsFieldProps = {
  fieldId: string;
  label: string;
  value: string;
  mono?: boolean;
  copyValue?: string;
  unavailable?: boolean;
  unavailableHint?: string;
  onCopy?: (value: string) => void;
};

export function DetailsField({
  fieldId,
  label,
  value,
  mono,
  copyValue,
  unavailable,
  unavailableHint,
  onCopy,
}: DetailsFieldProps) {
  const valueNode = (
    <Typography
      component="span"
      data-field={fieldId}
      sx={mono ? detailsValueMonoSx : detailsValueSx}
      variant="body2"
    >
      {value}
    </Typography>
  );

  const labeled =
    unavailable && unavailableHint ? <Tooltip title={unavailableHint}>{valueNode}</Tooltip> : valueNode;

  return (
    <Stack spacing={0.25} sx={detailsFieldSx}>
      <Typography sx={detailsFieldLabelSx} variant="caption">
        {label}
      </Typography>
      {onCopy ? (
        <ButtonBase
          sx={detailsCopyButtonSx}
          onClick={() => onCopy(copyValue ?? value)}
        >
          {labeled}
        </ButtonBase>
      ) : (
        labeled
      )}
    </Stack>
  );
}
