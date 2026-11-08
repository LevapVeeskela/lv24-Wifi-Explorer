import type { SignalChartUnit } from '@/features/signal-history';
import type { SignalDisplayUnit } from './types';

export function signalDisplayToChartUnit(unit: SignalDisplayUnit): SignalChartUnit {
  return unit === 'dbm' ? 'dbm' : 'pct';
}

export function chartUnitToSignalDisplay(unit: SignalChartUnit): SignalDisplayUnit {
  return unit === 'dbm' ? 'dbm' : 'percent';
}
