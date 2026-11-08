import { Box } from '@mui/material';
import type { ObservedBss } from '@/domain/bss';
import { rssiSparklinePoints } from '@/entities/signal';

export type RssiSparklineProps = {
  bss: ObservedBss | null;
  color: string;
};

const WIDTH = 64;
const HEIGHT = 20;

/** Compact inline RSSI trend for a grid row (no axes, no labels). */
export function RssiSparkline({ bss, color }: RssiSparklineProps) {
  const points = rssiSparklinePoints(bss, { width: WIDTH, height: HEIGHT });
  if (!points) {
    return <Box sx={{ height: HEIGHT }} aria-hidden />;
  }
  return (
    <Box component="span" sx={{ display: 'inline-block', lineHeight: 0 }}>
      <svg aria-hidden height={HEIGHT} width={WIDTH}>
        <polyline fill="none" points={points} stroke={color} strokeWidth={1.5} />
      </svg>
    </Box>
  );
}
