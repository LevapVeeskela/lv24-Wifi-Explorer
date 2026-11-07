enum ChartTimescale { s30, m1, m5, m15, h1 }

const chartTimescaleOrder = <ChartTimescale>[
  ChartTimescale.s30,
  ChartTimescale.m1,
  ChartTimescale.m5,
  ChartTimescale.m15,
  ChartTimescale.h1,
];

const chartTimescaleMs = <ChartTimescale, int>{
  ChartTimescale.s30: 30_000,
  ChartTimescale.m1: 60_000,
  ChartTimescale.m5: 5 * 60_000,
  ChartTimescale.m15: 15 * 60_000,
  ChartTimescale.h1: 60 * 60_000,
};

String chartTimescaleLabel(ChartTimescale scale) {
  return switch (scale) {
    ChartTimescale.s30 => '30s',
    ChartTimescale.m1 => '1m',
    ChartTimescale.m5 => '5m',
    ChartTimescale.m15 => '15m',
    ChartTimescale.h1 => '1h',
  };
}

int timescaleWindowMs(ChartTimescale timescale) =>
    chartTimescaleMs[timescale] ?? chartTimescaleMs[ChartTimescale.m5]!;

enum SignalChartUnit { pct, dbm }
