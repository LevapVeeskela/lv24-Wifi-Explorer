import 'package:scan_domain/scan_domain.dart';

import '../models/scan_snapshot_dto.dart';
import 'map_observed_bss.dart';

export 'map_observed_bss.dart'
    show
        MapObservedBssOptions,
        mapCoreWlanRecordToObservedBss,
        mapCoreWlanRecordsToObservedBss;

LocationAuthorization locationAuthorizationFromWire(String? raw) {
  switch (raw) {
    case 'granted':
      return LocationAuthorization.granted;
    case 'denied':
      return LocationAuthorization.denied;
    case 'restricted':
      return LocationAuthorization.restricted;
    case 'not-determined':
    default:
      return LocationAuthorization.notDetermined;
  }
}

String locationAuthorizationToWire(LocationAuthorization value) {
  switch (value) {
    case LocationAuthorization.granted:
      return 'granted';
    case LocationAuthorization.denied:
      return 'denied';
    case LocationAuthorization.restricted:
      return 'restricted';
    case LocationAuthorization.notDetermined:
      return 'not-determined';
  }
}

/// Maps wire snapshots into `scan_domain` types.
class ScanDomainMapper {
  const ScanDomainMapper._();

  static LocationAuthorization locationFromSnapshot(ScanSnapshotDto snapshot) {
    return locationAuthorizationFromWire(snapshot.location);
  }

  static List<ObservedBss> observedNetworksFromSnapshot(
    ScanSnapshotDto snapshot, {
    List<ObservedBss>? previous,
  }) {
    return mapCoreWlanRecordsToObservedBss(
      snapshot.networks,
      previous,
      asIsoTime(snapshot.capturedAt),
      options: MapObservedBssOptions(
        location: locationFromSnapshot(snapshot),
      ),
    );
  }
}
