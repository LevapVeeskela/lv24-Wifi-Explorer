import type { ObservedBss } from '@/domain/bss';

export type SparklineGeometry = { width: number; height: number };

/** Map an RSSI history to SVG polyline points within a fixed box. */
export function rssiSparklinePoints(
  bss: ObservedBss | null,
  geometry: SparklineGeometry = { width: 64, height: 20 }
): string {
  const { width, height } = geometry;
  const history = bss?.rssiHistory;
  const values: number[] = history && history.length > 0 ? [...history].map((p) => p.rssiDbm) : [];
  if (values.length === 0 && bss) values.push(bss.signal.rssiDbm);
  if (values.length === 0) return '';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const pad = 2;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : pad + (index / (values.length - 1)) * innerW;
      // Higher RSSI (closer to 0) → higher on the chart.
      const y = span === 0 ? height / 2 : pad + innerH - ((value - min) / span) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
