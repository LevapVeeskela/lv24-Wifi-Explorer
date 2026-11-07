import { useMemo } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { buildIeTree, decodeInformationElements, type IeTreeNode } from '@/domain/ie';
import { createFormatMessage } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';
import {
  advancedIeTreeElementTitleSx,
  advancedIeTreeEmptySx,
  advancedIeTreeLabelSx,
  advancedIeTreeRootSx,
  advancedIeTreeRowSx,
  advancedIeTreeValueSx,
} from './advancedIeTreeStyles';

export type AdvancedIeTreeProps = {
  row: ScanGridRow | null;
};

function isElementRootKey(key: string): boolean {
  return /^ie\.\d+$/.test(key);
}

function IeTreeRows({ nodes, depth }: { nodes: readonly IeTreeNode[]; depth: number }) {
  return (
    <>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const elementRoot = isElementRootKey(node.key);
        const labelSx = elementRoot ? advancedIeTreeElementTitleSx : advancedIeTreeLabelSx;

        return (
          <Box key={node.key}>
            <Box sx={advancedIeTreeRowSx(depth)}>
              <Typography component="span" sx={labelSx} variant="body2">
                {node.label}
              </Typography>
              {node.value != null ? (
                <Typography component="span" sx={advancedIeTreeValueSx} variant="body2">
                  {node.value}
                </Typography>
              ) : null}
            </Box>
            {hasChildren ? <IeTreeRows depth={depth + 1} nodes={node.children} /> : null}
          </Box>
        );
      })}
    </>
  );
}

export function AdvancedIeTree({ row }: AdvancedIeTreeProps) {
  const { locale } = useScanIntl();
  const formatMessage = useMemo(() => createFormatMessage(locale), [locale]);

  const tree = useMemo(() => {
    if (!row) return null;
    const bytes = row.source.lastRaw.informationElementData;
    return buildIeTree(decodeInformationElements(bytes));
  }, [row]);

  if (!row) return null;

  const unavailable = row.source.ie.level === 'absent';

  return (
    <Accordion defaultExpanded disableGutters square>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="subtitle2">{formatMessage('scan.adv.ies')} — tree</Typography>
      </AccordionSummary>
      <AccordionDetails sx={advancedIeTreeRootSx}>
        {unavailable || tree == null ? (
          <Typography sx={advancedIeTreeEmptySx} variant="body2">
            {formatMessage('scan.field.unavailable')}
          </Typography>
        ) : tree.length === 0 ? (
          <Typography sx={advancedIeTreeEmptySx} variant="body2">
            —
          </Typography>
        ) : (
          <Stack spacing={0}>
            <IeTreeRows depth={0} nodes={tree} />
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
