import 'channel.dart';
import 'identity.dart';
import 'ie/types.dart';
import 'phy.dart';
import 'security.dart';
import 'signal.dart';
import 'timeseries.dart';

class CoreWlanNetworkRecord {
  const CoreWlanNetworkRecord({
    required this.ssid,
    required this.ssidData,
    required this.bssid,
    required this.rssiDbm,
    required this.noiseDbm,
    required this.channelNumber,
    required this.channelBand,
    required this.channelWidth,
    required this.countryCode,
    required this.beaconIntervalMs,
    required this.ibss,
    required this.informationElementData,
    required this.supportedSecurity,
    required this.supportedPhyModes,
  });

  final String? ssid;
  final List<int>? ssidData;
  final String? bssid;
  final double rssiDbm;
  final double noiseDbm;
  final int? channelNumber;
  final CoreWlanChannelBand channelBand;
  final CoreWlanChannelWidth channelWidth;
  final String? countryCode;
  final int beaconIntervalMs;
  final bool ibss;
  final List<int>? informationElementData;
  final List<SecurityKind> supportedSecurity;
  final List<PhyLetter> supportedPhyModes;
}

class VendorView {
  const VendorView({
    required this.oui,
    required this.locallyAdministered,
    required this.multicast,
    required this.organization,
    required this.match,
    this.registryFile,
  });

  final String? oui;
  final bool locallyAdministered;
  final bool multicast;
  final String? organization;
  final String match;
  final String? registryFile;
}

class ObservedBss {
  const ObservedBss({
    required this.identity,
    required this.ibss,
    required this.countryCode,
    required this.beaconIntervalMs,
    required this.signal,
    required this.channel,
    required this.security,
    required this.phy,
    required this.maxRate,
    required this.vendor,
    required this.ie,
    required this.presence,
    required this.rssiHistory,
    required this.lastRaw,
  });

  final BssIdentity identity;
  final bool ibss;
  final LocationGated<String?> countryCode;
  final int beaconIntervalMs;
  final SignalView signal;
  final ChannelView channel;
  final SecurityView security;
  final PhyView phy;
  final Object? maxRate;
  final VendorView vendor;
  final ShallowIeView ie;
  final PresenceView presence;
  final List<RssiHistoryPoint> rssiHistory;
  final CoreWlanNetworkRecord lastRaw;
}

class AssociatedLink {
  const AssociatedLink({
    required this.interfaceName,
    required this.capturedAt,
    required this.ssid,
    required this.bssid,
    required this.rssiDbm,
    required this.noiseDbm,
    required this.transmitRateMbps,
    required this.activePhy,
    required this.security,
    required this.transmitPowerMw,
    required this.hardwareAddress,
    required this.countryCode,
  });

  final String interfaceName;
  final IsoTime capturedAt;
  final LocationGated<String?> ssid;
  final LocationGated<Bssid> bssid;
  final double rssiDbm;
  final double noiseDbm;
  final double transmitRateMbps;
  final PhyLetter? activePhy;
  final SecurityKind security;
  final double transmitPowerMw;
  final String? hardwareAddress;
  final LocationGated<String?> countryCode;
}
