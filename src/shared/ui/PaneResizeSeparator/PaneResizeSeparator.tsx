import { Box } from '@mui/material';
import { useRef } from 'react';
import {
  updateVerticalBoundaryByDrag,
  updateVerticalBoundaryByKey,
  type VerticalPaneBounds,
  type VerticalPaneFractions,
} from '@/shared/lib/paneLayout/verticalPaneLayout';
import { paneResizeSeparatorHorizontalSx, paneResizeSeparatorVerticalSx } from './styles';

export type PaneResizeSeparatorProps = {
  orientation: 'horizontal' | 'vertical';
  fractions: VerticalPaneFractions;
  bounds: VerticalPaneBounds;
  onChange: (next: VerticalPaneFractions) => void;
  label: string;
  testId?: string;
  onDoubleClick?: () => void;
};

type ActivePointer = {
  pointerId: number;
  startY: number;
  fractions: VerticalPaneFractions;
};

const HANDLED_KEYS = new Set(['ArrowUp', 'ArrowDown', 'Home', 'End']);

export function PaneResizeSeparator({
  orientation,
  fractions,
  bounds,
  onChange,
  label,
  testId,
  onDoubleClick,
}: PaneResizeSeparatorProps) {
  const activePointer = useRef<ActivePointer | null>(null);
  const separatorRef = useRef<HTMLDivElement | null>(null);
  const isHorizontal = orientation === 'horizontal';

  const finishPointer = (pointerId: number, releaseCapture: boolean) => {
    if (activePointer.current?.pointerId !== pointerId) return;
    if (releaseCapture) {
      try {
        separatorRef.current?.releasePointerCapture(pointerId);
      } catch {
        // Pointer capture may already have been released.
      }
    }
    activePointer.current = null;
  };

  return (
    <Box
      component="div"
      aria-label={label}
      aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
      aria-valuemax={bounds.top.max}
      aria-valuemin={bounds.top.min}
      aria-valuenow={Math.round(fractions.top * bounds.shellHeight)}
      data-testid={testId ?? 'scan-pane-separator'}
      onKeyDown={(event) => {
        if (!HANDLED_KEYS.has(event.key)) return;
        event.preventDefault();
        onChange(updateVerticalBoundaryByKey(fractions, event.key, event.shiftKey, bounds));
      }}
      onDoubleClick={onDoubleClick}
      onLostPointerCapture={(event) => finishPointer(event.pointerId, false)}
      onPointerCancel={(event) => finishPointer(event.pointerId, false)}
      onPointerDown={(event) => {
        activePointer.current = {
          pointerId: event.pointerId,
          startY: event.clientY,
          fractions,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const active = activePointer.current;
        if (!active || active.pointerId !== event.pointerId) return;
        onChange(
          updateVerticalBoundaryByDrag(active.fractions, event.clientY - active.startY, bounds)
        );
      }}
      onPointerUp={(event) => finishPointer(event.pointerId, true)}
      ref={separatorRef}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="separator"
      sx={isHorizontal ? paneResizeSeparatorHorizontalSx : paneResizeSeparatorVerticalSx}
      tabIndex={0}
    />
  );
}
