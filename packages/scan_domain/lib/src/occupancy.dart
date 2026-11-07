import 'bss.dart';
import 'channel.dart';
import 'signal.dart';
import 'timeseries.dart';

const occupancyKind = 'visualization-not-cca';

typedef OccupancyKind = String;

class OccupancyBar {
  const OccupancyBar({
    required this.channel,
    required this.score,
    required this.selected,
    required this.source,
  });

  final int channel;
  final int score;
  final bool selected;
  final OccupancyKind source;
}

const _targetWidthMhz = 20;

bool _liveForOccupancy(ObservedBss bss) {
  return bss.presence.presence != Presence.disappeared;
}

double occupancyContribution(
  ObservedBss bss,
  WifiBand band,
  int channel,
) {
  if (bss.channel.band != band) return 0;
  final target = primarySpanMhz(band, channel);
  final span = occupyingSpanOf(bss.channel);
  if (target == null || span == null) return 0;
  final overlap = overlapMhz(span, target);
  if (overlap <= 0) return 0;
  final strength = percentFromDbm(bss.signal.rssiDbm).toDouble();
  return strength * (overlap / _targetWidthMhz);
}

int occupancyScore(
  List<ObservedBss> rows,
  WifiBand band,
  int channel,
) {
  var sum = 0.0;
  for (final bss in rows) {
    if (!_liveForOccupancy(bss)) continue;
    sum += occupancyContribution(bss, band, channel);
  }
  if (!sum.isFinite || sum <= 0) return 0;
  return sum.round().clamp(0, 100);
}

List<OccupancyBar> computeBandOccupancy(
  List<ObservedBss> rows,
  WifiBand band, {
  int? selectedChannel,
}) {
  return channelsForBand(band).map((channel) {
    return OccupancyBar(
      channel: channel,
      score: occupancyScore(rows, band, channel),
      selected: selectedChannel == channel,
      source: occupancyKind,
    );
  }).toList();
}

List<OccupancyBar> computeOccupancy(
  List<ObservedBss> rows, {
  int? selectedChannel,
  Object band = 'all',
}) {
  final bands = band == 'all'
      ? const [WifiBand.ghz24, WifiBand.ghz5, WifiBand.ghz6]
      : [band as WifiBand];
  final bars = <OccupancyBar>[];
  for (final item in bands) {
    bars.addAll(computeBandOccupancy(rows, item, selectedChannel: selectedChannel));
  }
  return bars;
}
