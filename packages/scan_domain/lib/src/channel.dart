/// Channel band, width, frequency spans, and visualization helpers.

enum CoreWlanChannelBand { unknown, ghz2, ghz5, ghz6 }

enum CoreWlanChannelWidth { unknown, mhz20, mhz40, mhz80, mhz160 }

enum WifiBand { ghz24, ghz5, ghz6 }

extension WifiBandValue on WifiBand {
  double get asDouble => switch (this) {
        WifiBand.ghz24 => 2.4,
        WifiBand.ghz5 => 5,
        WifiBand.ghz6 => 6,
      };
}

typedef BandGhz = WifiBand;

enum ChannelWidthMhz { mhz20, mhz40, mhz80, mhz160 }

extension ChannelWidthMhzValue on ChannelWidthMhz {
  int get asInt => switch (this) {
        ChannelWidthMhz.mhz20 => 20,
        ChannelWidthMhz.mhz40 => 40,
        ChannelWidthMhz.mhz80 => 80,
        ChannelWidthMhz.mhz160 => 160,
      };
}

class FrequencySpanMhz {
  const FrequencySpanMhz({required this.from, required this.to});
  final double from;
  final double to;
}

enum ChannelCenterConfidence {
  ieeePrimary20,
  ieOperation,
  standardLayoutGuess,
}

class ChannelView {
  const ChannelView({
    required this.number,
    required this.band,
    required this.widthMhz,
    required this.primaryCenterMhz,
    required this.occupyingCenterMhz,
    required this.occupyingSpanMhz,
    required this.centerConfidence,
  });

  final int number;
  final WifiBand? band;
  final Object widthMhz; // ChannelWidthMhz or 'unknown'
  final double? primaryCenterMhz;
  final double? occupyingCenterMhz;
  final FrequencySpanMhz? occupyingSpanMhz;
  final ChannelCenterConfidence centerConfidence;
}

const unknownWidth = 'unknown';

const band24Channels = <int>[
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
];

const band5Channels = <int>[
  36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128,
  132, 136, 140, 144, 149, 153, 157, 161, 165, 169, 173, 177,
];

final band6Channels = List<int>.generate(59, (i) => 1 + i * 4);

const widthHalfMhz = <ChannelWidthMhz, double>{
  ChannelWidthMhz.mhz20: 10,
  ChannelWidthMhz.mhz40: 20,
  ChannelWidthMhz.mhz80: 40,
  ChannelWidthMhz.mhz160: 80,
};

WifiBand? normalizeBand(CoreWlanChannelBand band) {
  return switch (band) {
    CoreWlanChannelBand.ghz2 => WifiBand.ghz24,
    CoreWlanChannelBand.ghz5 => WifiBand.ghz5,
    CoreWlanChannelBand.ghz6 => WifiBand.ghz6,
    CoreWlanChannelBand.unknown => null,
  };
}

ChannelWidthMhz? normalizeWidth(CoreWlanChannelWidth width) {
  return switch (width) {
    CoreWlanChannelWidth.mhz20 => ChannelWidthMhz.mhz20,
    CoreWlanChannelWidth.mhz40 => ChannelWidthMhz.mhz40,
    CoreWlanChannelWidth.mhz80 => ChannelWidthMhz.mhz80,
    CoreWlanChannelWidth.mhz160 => ChannelWidthMhz.mhz160,
    CoreWlanChannelWidth.unknown => null,
  };
}

CoreWlanChannelBand bandToCore(WifiBand? band) {
  return switch (band) {
    WifiBand.ghz24 => CoreWlanChannelBand.ghz2,
    WifiBand.ghz5 => CoreWlanChannelBand.ghz5,
    WifiBand.ghz6 => CoreWlanChannelBand.ghz6,
    null => CoreWlanChannelBand.unknown,
  };
}

String coreWlanChannelBandKey(CoreWlanChannelBand band) {
  return switch (band) {
    CoreWlanChannelBand.ghz2 => '2ghz',
    CoreWlanChannelBand.ghz5 => '5ghz',
    CoreWlanChannelBand.ghz6 => '6ghz',
    CoreWlanChannelBand.unknown => 'unknown',
  };
}

CoreWlanChannelWidth widthToCore(Object width) {
  if (width == unknownWidth) return CoreWlanChannelWidth.unknown;
  if (width is ChannelWidthMhz) {
    return switch (width) {
      ChannelWidthMhz.mhz20 => CoreWlanChannelWidth.mhz20,
      ChannelWidthMhz.mhz40 => CoreWlanChannelWidth.mhz40,
      ChannelWidthMhz.mhz80 => CoreWlanChannelWidth.mhz80,
      ChannelWidthMhz.mhz160 => CoreWlanChannelWidth.mhz160,
    };
  }
  return CoreWlanChannelWidth.unknown;
}

double? primaryCenterMhz(WifiBand? bandGhz, int channelNumber) {
  if (channelNumber <= 0) return null;
  if (bandGhz == WifiBand.ghz24) {
    if (channelNumber == 14) return 2484.0;
    if (channelNumber >= 1 && channelNumber <= 13) {
      return 2407.0 + 5 * channelNumber;
    }
    return null;
  }
  if (bandGhz == WifiBand.ghz5) return 5000.0 + 5 * channelNumber;
  if (bandGhz == WifiBand.ghz6) return 5950.0 + 5 * channelNumber;
  return null;
}

FrequencySpanMhz? primarySpanMhz(WifiBand? bandGhz, int channelNumber) {
  final center = primaryCenterMhz(bandGhz, channelNumber);
  if (center == null) return null;
  return FrequencySpanMhz(
    from: center - widthHalfMhz[ChannelWidthMhz.mhz20]!,
    to: center + widthHalfMhz[ChannelWidthMhz.mhz20]!,
  );
}

double overlapMhz(FrequencySpanMhz a, FrequencySpanMhz b) {
  return (a.to < b.from || b.to < a.from)
      ? 0.0
      : (a.to < b.to ? a.to : b.to) - (a.from > b.from ? a.from : b.from);
}

FrequencySpanMhz spanAround(double center, ChannelWidthMhz width) {
  final half = widthHalfMhz[width]!;
  return FrequencySpanMhz(from: center - half, to: center + half);
}

const _ghz5_40Blocks = <(int, int)>[
  (36, 40),
  (44, 48),
  (52, 56),
  (60, 64),
  (100, 104),
  (108, 112),
  (116, 120),
  (124, 128),
  (132, 136),
  (140, 144),
  (149, 153),
  (157, 161),
  (165, 169),
  (173, 177),
];

const _ghz5_80Blocks = <(int, int)>[
  (36, 48),
  (52, 64),
  (100, 112),
  (116, 128),
  (132, 144),
  (149, 161),
  (165, 177),
];

const _ghz5_160Blocks = <(int, int)>[
  (36, 64),
  (100, 128),
  (149, 177),
];

bool _blockContains(int ch, int first, int last) {
  return ch >= first && ch <= last && (ch - first) % 4 == 0;
}

double _ghz5BlockCenter(int first, int last) {
  return (5000 + 5 * first + (5000 + 5 * last)) / 2;
}

double? _guess5GhzOccupying(int ch, ChannelWidthMhz width) {
  final blocks = switch (width) {
    ChannelWidthMhz.mhz40 => _ghz5_40Blocks,
    ChannelWidthMhz.mhz80 => _ghz5_80Blocks,
    ChannelWidthMhz.mhz160 => _ghz5_160Blocks,
    ChannelWidthMhz.mhz20 => null,
  };
  if (blocks == null) return null;
  for (final (first, last) in blocks) {
    if (_blockContains(ch, first, last)) return _ghz5BlockCenter(first, last);
  }
  return null;
}

double? _guess6GhzOccupying(int ch, ChannelWidthMhz width) {
  if (ch < 1 || ch > 233 || (ch - 1) % 4 != 0) return null;
  final n20 = width.asInt ~/ 20;
  final idx = (ch - 1) ~/ 4;
  final block = idx ~/ n20;
  final firstCh = 1 + block * n20 * 4;
  final lastCh = firstCh + (n20 - 1) * 4;
  if (lastCh > 233) return null;
  return (5950 + 5 * firstCh + (5950 + 5 * lastCh)) / 2;
}

double? _guess24GhzOccupying(int ch, double primaryMhz, ChannelWidthMhz width) {
  if (width != ChannelWidthMhz.mhz40) return null;
  if (ch < 1 || ch > 13) return null;
  return ch <= 7 ? primaryMhz + 10 : primaryMhz - 10;
}

double? standardLayoutOccupyingMhz(
  WifiBand? bandGhz,
  int channelNumber,
  double primaryMhz,
  ChannelWidthMhz width,
) {
  if (bandGhz == WifiBand.ghz24) {
    return _guess24GhzOccupying(channelNumber, primaryMhz, width);
  }
  if (bandGhz == WifiBand.ghz5) return _guess5GhzOccupying(channelNumber, width);
  if (bandGhz == WifiBand.ghz6) return _guess6GhzOccupying(channelNumber, width);
  return null;
}

ChannelView computeChannelView(
  int? channelNumber,
  CoreWlanChannelBand channelBand,
  CoreWlanChannelWidth channelWidth, {
  int? htSecondaryOffset,
  int? ccfs0,
}) {
  final number = channelNumber ?? 0;
  final bandGhz = normalizeBand(channelBand);
  final widthMhz = normalizeWidth(channelWidth);
  final primary = primaryCenterMhz(bandGhz, number);

  if (primary == null) {
    return ChannelView(
      number: number,
      band: bandGhz,
      widthMhz: widthMhz ?? unknownWidth,
      primaryCenterMhz: null,
      occupyingCenterMhz: null,
      occupyingSpanMhz: null,
      centerConfidence: widthMhz == ChannelWidthMhz.mhz20 || widthMhz == null
          ? ChannelCenterConfidence.ieeePrimary20
          : ChannelCenterConfidence.standardLayoutGuess,
    );
  }

  if (widthMhz == ChannelWidthMhz.mhz20 || widthMhz == null) {
    return ChannelView(
      number: number,
      band: bandGhz,
      widthMhz: widthMhz ?? unknownWidth,
      primaryCenterMhz: primary,
      occupyingCenterMhz: primary,
      occupyingSpanMhz:
          widthMhz == ChannelWidthMhz.mhz20 ? spanAround(primary, ChannelWidthMhz.mhz20) : null,
      centerConfidence: ChannelCenterConfidence.ieeePrimary20,
    );
  }

  double? fromIe;
  if (widthMhz == ChannelWidthMhz.mhz40 &&
      (htSecondaryOffset == 1 || htSecondaryOffset == -1)) {
    fromIe = primary + 10 * htSecondaryOffset!;
  } else if ((widthMhz == ChannelWidthMhz.mhz40 ||
          widthMhz == ChannelWidthMhz.mhz80 ||
          widthMhz == ChannelWidthMhz.mhz160) &&
      ccfs0 != null &&
      ccfs0 > 0) {
    fromIe = primaryCenterMhz(bandGhz, ccfs0);
  }

  if (fromIe != null) {
    return ChannelView(
      number: number,
      band: bandGhz,
      widthMhz: widthMhz,
      primaryCenterMhz: primary,
      occupyingCenterMhz: fromIe,
      occupyingSpanMhz: spanAround(fromIe, widthMhz),
      centerConfidence: ChannelCenterConfidence.ieOperation,
    );
  }

  final guessed = standardLayoutOccupyingMhz(bandGhz, number, primary, widthMhz);
  return ChannelView(
    number: number,
    band: bandGhz,
    widthMhz: widthMhz,
    primaryCenterMhz: primary,
    occupyingCenterMhz: guessed,
    occupyingSpanMhz:
        guessed != null ? spanAround(guessed, widthMhz) : null,
    centerConfidence: ChannelCenterConfidence.standardLayoutGuess,
  );
}

FrequencySpanMhz? occupyingSpanOf(ChannelView view) {
  if (view.occupyingSpanMhz != null) return view.occupyingSpanMhz;
  final center = view.occupyingCenterMhz ?? view.primaryCenterMhz;
  if (center == null) return null;
  final width = view.widthMhz is ChannelWidthMhz
      ? view.widthMhz as ChannelWidthMhz
      : ChannelWidthMhz.mhz20;
  return spanAround(center, width);
}

List<int> channelsForBand(WifiBand bandGhz) {
  return switch (bandGhz) {
    WifiBand.ghz24 => band24Channels,
    WifiBand.ghz5 => band5Channels,
    WifiBand.ghz6 => band6Channels,
  };
}

int channelWidthMhzValue(Object widthMhz) {
  if (widthMhz == unknownWidth) return 20;
  if (widthMhz is ChannelWidthMhz) return widthMhz.asInt;
  return 20;
}

bool primaryChannelsOverlap(
  ({int number, Object widthMhz}) a,
  ({int number, Object widthMhz}) b,
) {
  final halfA = channelWidthMhzValue(a.widthMhz) / 2;
  final halfB = channelWidthMhzValue(b.widthMhz) / 2;
  return (a.number - b.number).abs() * 5 < halfA + halfB;
}
