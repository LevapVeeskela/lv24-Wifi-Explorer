import 'package:scan_domain/scan_domain.dart';

const occupancyBands = <WifiBand>[
  WifiBand.ghz24,
  WifiBand.ghz5,
  WifiBand.ghz6,
];

bool _liveForOccupancy(ObservedBss bss) {
  return bss.presence.presence != Presence.disappeared;
}

bool bandHasBss(List<ObservedBss> bssList, WifiBand band) {
  return bssList.any(
    (bss) => _liveForOccupancy(bss) && bss.channel.band == band,
  );
}

List<WifiBand> visibleOccupancyBands(
  List<ObservedBss> bssList,
  bool hideEmptyBands,
) {
  if (!hideEmptyBands) return List<WifiBand>.from(occupancyBands);
  return occupancyBands.where((band) => bandHasBss(bssList, band)).toList();
}

WifiBand pickOccupancyBand(
  WifiBand? preferred,
  List<WifiBand> visible, {
  WifiBand fallback = WifiBand.ghz5,
}) {
  if (preferred != null && visible.contains(preferred)) return preferred;
  if (visible.isNotEmpty) return visible.first;
  return fallback;
}
