export type VerticalPaneFractions = {
  top: number;
  bottom: number;
};

export type VerticalPaneBounds = {
  shellHeight: number;
  top: { min: number; max: number };
  bottom: { min: number; max: number };
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getVerticalPaneBounds(shellHeight: number, topMin: number, bottomMin: number): VerticalPaneBounds {
  const height = Number.isFinite(shellHeight) && shellHeight > 0 ? shellHeight : 640;
  const topMax = Math.max(topMin, height - bottomMin);
  return {
    shellHeight: height,
    top: { min: topMin, max: topMax },
    bottom: { min: bottomMin, max: Math.max(bottomMin, height - topMin) },
  };
}

export function fractionsFromTopPx(topPx: number, bounds: VerticalPaneBounds): VerticalPaneFractions {
  const top = clamp(topPx, bounds.top.min, bounds.top.max);
  const bottom = bounds.shellHeight - top;
  return {
    top: top / bounds.shellHeight,
    bottom: bottom / bounds.shellHeight,
  };
}

export function updateVerticalBoundaryByDrag(
  fractions: VerticalPaneFractions,
  deltaY: number,
  bounds: VerticalPaneBounds
): VerticalPaneFractions {
  const currentTopPx = fractions.top * bounds.shellHeight;
  return fractionsFromTopPx(currentTopPx + deltaY, bounds);
}

export function updateVerticalBoundaryByKey(
  fractions: VerticalPaneFractions,
  key: string,
  shiftKey: boolean,
  bounds: VerticalPaneBounds
): VerticalPaneFractions {
  const step = shiftKey ? 48 : 16;
  const currentTopPx = fractions.top * bounds.shellHeight;
  switch (key) {
    case 'ArrowUp':
      return fractionsFromTopPx(currentTopPx - step, bounds);
    case 'ArrowDown':
      return fractionsFromTopPx(currentTopPx + step, bounds);
    case 'Home':
      return fractionsFromTopPx(bounds.top.min, bounds);
    case 'End':
      return fractionsFromTopPx(bounds.top.max, bounds);
    default:
      return fractions;
  }
}
