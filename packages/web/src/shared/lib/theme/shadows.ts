import type { Theme } from '@mui/material/styles';

import { SHADOW_RGB } from './tokens';

/** Warm (stone-900) shadow at the given alpha. */
const s = (a: string) => `rgb(${SHADOW_RGB} / ${a})`;

/** MUI elevation levels 0–24, tuned to a warm stone neutral (no blue cast). */
export const softShadows: Theme['shadows'] = [
  'none',
  `0 1px 2px ${s('0.05')}`,
  `0 1px 3px ${s('0.06')}, 0 1px 2px ${s('0.05')}`,
  `0 2px 5px ${s('0.07')}, 0 1px 2px ${s('0.05')}`,
  `0 4px 8px ${s('0.07')}, 0 1px 3px ${s('0.05')}`,
  `0 6px 12px ${s('0.08')}, 0 2px 4px ${s('0.05')}`,
  `0 8px 16px ${s('0.08')}, 0 2px 5px ${s('0.05')}`,
  `0 10px 20px ${s('0.09')}, 0 3px 6px ${s('0.05')}`,
  `0 12px 24px ${s('0.10')}, 0 4px 8px ${s('0.06')}`,
  `0 14px 28px ${s('0.10')}, 0 5px 10px ${s('0.06')}`,
  `0 16px 32px ${s('0.11')}, 0 6px 12px ${s('0.06')}`,
  `0 18px 36px ${s('0.11')}, 0 7px 14px ${s('0.06')}`,
  `0 20px 40px ${s('0.12')}, 0 8px 16px ${s('0.07')}`,
  `0 22px 44px ${s('0.12')}, 0 9px 18px ${s('0.07')}`,
  `0 24px 48px ${s('0.13')}, 0 10px 20px ${s('0.07')}`,
  `0 26px 52px ${s('0.13')}, 0 11px 22px ${s('0.07')}`,
  `0 28px 56px ${s('0.14')}, 0 12px 24px ${s('0.08')}`,
  `0 30px 60px ${s('0.14')}, 0 13px 26px ${s('0.08')}`,
  `0 32px 64px ${s('0.15')}, 0 14px 28px ${s('0.08')}`,
  `0 34px 68px ${s('0.15')}, 0 15px 30px ${s('0.08')}`,
  `0 36px 72px ${s('0.16')}, 0 16px 32px ${s('0.09')}`,
  `0 38px 76px ${s('0.16')}, 0 17px 34px ${s('0.09')}`,
  `0 40px 80px ${s('0.17')}, 0 18px 36px ${s('0.09')}`,
  `0 42px 84px ${s('0.17')}, 0 19px 38px ${s('0.10')}`,
  `0 44px 88px ${s('0.18')}, 0 20px 40px ${s('0.10')}`,
];
