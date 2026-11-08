import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { chartVisuallyHiddenSx } from './styles';

export type ChartA11yRow = {
  x: string;
  y: string;
};

export type ChartA11yTableProps = {
  caption: string;
  rows: readonly ChartA11yRow[];
  labelX: string;
  labelY: string;
  activeIndex: number;
};

export function ChartA11yTable({
  caption,
  rows,
  labelX,
  labelY,
  activeIndex,
}: ChartA11yTableProps) {
  const [index, setIndex] = useState(activeIndex);

  useEffect(() => {
    setIndex(Math.min(Math.max(0, activeIndex), Math.max(0, rows.length - 1)));
  }, [activeIndex, rows.length]);

  return (
    <Box component="div" sx={chartVisuallyHiddenSx}>
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{labelX}</th>
            <th scope="col">{labelY}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.x}-${i}`} aria-selected={i === index}>
              <td>{row.x}</td>
              <td>{row.y}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}
