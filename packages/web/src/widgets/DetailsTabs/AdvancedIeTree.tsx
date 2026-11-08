import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ContentCopy from '@mui/icons-material/ContentCopy';
import ExpandMore from '@mui/icons-material/ExpandMore';
import type { ScanGridRow } from '@/entities/bss';
import { buildIeTree, decodeInformationElements, type IeTreeNode } from '@/domain/ie';
import { createFormatMessage, type FormatMessageFn } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n';
import {
  advancedIeTreeBytesSx,
  advancedIeTreeElementRowSx,
  advancedIeTreeElementTitleSx,
  advancedIeTreeEmptySx,
  advancedIeTreeLabelSx,
  advancedIeTreeRootSx,
  advancedIeTreeRowSx,
  advancedIeTreeToolbarSx,
  advancedIeTreeValueSx,
} from './advancedIeTreeStyles';

export type AdvancedIeTreeProps = {
  row: ScanGridRow | null;
};

const COPIED_FEEDBACK_MS = 1500;

function isElementRootKey(key: string): boolean {
  return /^ie\.\d+$/.test(key);
}

function isMetaKey(key: string): boolean {
  return key.startsWith('meta.');
}

async function writeClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || navigator.clipboard == null) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Flat text for one node subtree, `label: value` per line. */
function nodeLines(node: IeTreeNode, depth = 0): string[] {
  const indent = '  '.repeat(depth);
  const head =
    node.value == null ? `${indent}${node.label}` : `${indent}${node.label}: ${node.value}`;
  return [head, ...node.children.flatMap((child) => nodeLines(child, depth + 1))];
}

/** Leaf fields (element roots excluded when they only group children). */
function collectFields(nodes: readonly IeTreeNode[]): IeTreeNode[] {
  const out: IeTreeNode[] = [];
  for (const node of nodes) {
    if (isMetaKey(node.key)) continue;
    if (node.value != null) out.push(node);
    out.push(...collectFields(node.children));
  }
  return out;
}

type TreeRowsProps = {
  nodes: readonly IeTreeNode[];
  depth: number;
  collapsed: ReadonlySet<string>;
  elementBytes: ReadonlyMap<string, number>;
  formatMessage: FormatMessageFn;
  onToggle: (key: string) => void;
  onCopy: (text: string) => void;
};

function IeTreeRows({
  nodes,
  depth,
  collapsed,
  elementBytes,
  formatMessage,
  onToggle,
  onCopy,
}: TreeRowsProps) {
  return (
    <>
      {nodes.map((node) => {
        const isRoot = isElementRootKey(node.key);
        const hasChildren = node.children.length > 0;
        const isCollapsed = isRoot && collapsed.has(node.key);
        const bytes = isRoot ? elementBytes.get(node.key) : undefined;
        const labelSx = isRoot ? advancedIeTreeElementTitleSx : advancedIeTreeLabelSx;

        return (
          <Box key={node.key}>
            <Box sx={isRoot ? advancedIeTreeElementRowSx(depth) : advancedIeTreeRowSx(depth)}>
              {isRoot && hasChildren ? (
                <IconButton
                  aria-label={formatMessage(
                    isCollapsed ? 'scan.adv.expandAll' : 'scan.adv.collapseAll'
                  )}
                  onClick={() => onToggle(node.key)}
                  size="small"
                  sx={{ p: 0.25 }}
                >
                  {isCollapsed ? (
                    <ChevronRight fontSize="inherit" />
                  ) : (
                    <ExpandMore fontSize="inherit" />
                  )}
                </IconButton>
              ) : null}
              <Typography component="span" sx={labelSx} variant="body2">
                {node.label}
              </Typography>
              {bytes != null ? (
                <Tooltip title={formatMessage('scan.adv.length')}>
                  <Typography component="span" sx={advancedIeTreeBytesSx} variant="caption">
                    {formatMessage('scan.adv.bytes', { count: bytes })}
                  </Typography>
                </Tooltip>
              ) : null}
              {node.value != null ? (
                <Typography component="span" sx={advancedIeTreeValueSx} variant="body2">
                  {node.value}
                </Typography>
              ) : null}
              <Box sx={{ flex: 1 }} />
              {isRoot ? (
                <Tooltip title={formatMessage('scan.adv.copyElement')}>
                  <IconButton
                    aria-label={formatMessage('scan.adv.copyElement')}
                    onClick={() => onCopy(nodeLines(node).join('\n'))}
                    size="small"
                    sx={{ p: 0.25 }}
                  >
                    <ContentCopy fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              ) : node.value != null ? (
                <Tooltip title={formatMessage('scan.adv.copyField')}>
                  <IconButton
                    aria-label={formatMessage('scan.adv.copyField')}
                    onClick={() => onCopy(`${node.label}: ${node.value}`)}
                    size="small"
                    sx={{ p: 0.25 }}
                  >
                    <ContentCopy fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Box>
            {hasChildren && !isCollapsed ? (
              <IeTreeRows
                collapsed={collapsed}
                depth={depth + 1}
                elementBytes={elementBytes}
                formatMessage={formatMessage}
                nodes={node.children}
                onCopy={onCopy}
                onToggle={onToggle}
              />
            ) : null}
          </Box>
        );
      })}
    </>
  );
}

export function AdvancedIeTree({ row }: AdvancedIeTreeProps) {
  const { locale } = useScanIntl();
  const formatMessage = useMemo(() => createFormatMessage(locale), [locale]);

  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set<string>());
  const [copied, setCopied] = useState(false);
  const [copiedTick, setCopiedTick] = useState(0);

  const rowId = row?.id ?? null;

  const decoded = useMemo(() => {
    if (!row) return null;
    return decodeInformationElements(row.source.lastRaw.informationElementData);
  }, [row]);

  const tree = useMemo(() => (decoded == null ? null : buildIeTree(decoded)), [decoded]);

  const elementBytes = useMemo(() => {
    const map = new Map<string, number>();
    decoded?.elements.forEach((element, index) => {
      map.set(`ie.${index}`, element.raw.length);
    });
    return map;
  }, [decoded]);

  useEffect(() => {
    setCollapsed(new Set<string>());
  }, [rowId]);

  useEffect(() => {
    if (copiedTick === 0) return undefined;
    const timer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copiedTick]);

  const copy = useCallback((text: string) => {
    void (async () => {
      const ok = await writeClipboard(text);
      if (ok) {
        setCopied(true);
        setCopiedTick((tick) => tick + 1);
      }
    })();
  }, []);

  const toggle = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsed(new Set(decoded?.elements.map((_, index) => `ie.${index}`) ?? []));
  }, [decoded]);

  const expandAll = useCallback(() => {
    setCollapsed(new Set<string>());
  }, []);

  if (!row) return null;

  const unavailable = row.source.ie.level === 'absent';
  const hasElements = !unavailable && tree != null && tree.length > 0;
  const elementCount = decoded?.elements.length ?? 0;
  const byteLength = decoded?.byteLength ?? 0;

  const copyAll = (withNames: boolean) => {
    const fields = collectFields(tree ?? []);
    copy(
      fields
        .map((node) => (withNames ? `${node.label}: ${node.value}` : String(node.value)))
        .join('\n')
    );
  };

  return (
    <Accordion defaultExpanded disableGutters square>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', width: '100%', pr: 1 }}>
          <Typography variant="subtitle2">{formatMessage('scan.adv.ies')} — tree</Typography>
          {hasElements ? (
            <Typography variant="caption" color="text.secondary">
              {elementCount} · {formatMessage('scan.adv.bytes', { count: byteLength })}
            </Typography>
          ) : null}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={advancedIeTreeRootSx}>
        {!hasElements || tree == null ? (
          <Typography sx={advancedIeTreeEmptySx} variant="body2">
            {unavailable ? formatMessage('scan.field.unavailable') : '—'}
          </Typography>
        ) : (
          <Stack spacing={0}>
            <Stack direction="row" spacing={0.5} sx={advancedIeTreeToolbarSx}>
              <Button onClick={() => copyAll(false)} size="small">
                {formatMessage('scan.adv.copyAll')}
              </Button>
              <Button onClick={() => copyAll(true)} size="small">
                {formatMessage('scan.adv.copyAllNames')}
              </Button>
              <Button onClick={expandAll} size="small">
                {formatMessage('scan.adv.expandAll')}
              </Button>
              <Button onClick={collapseAll} size="small">
                {formatMessage('scan.adv.collapseAll')}
              </Button>
              <Box sx={{ flex: 1 }} />
              {copied ? (
                <Typography color="success.main" variant="caption">
                  {formatMessage('scan.adv.copied')}
                </Typography>
              ) : null}
            </Stack>
            <IeTreeRows
              collapsed={collapsed}
              depth={0}
              elementBytes={elementBytes}
              formatMessage={formatMessage}
              nodes={tree}
              onCopy={copy}
              onToggle={toggle}
            />
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
