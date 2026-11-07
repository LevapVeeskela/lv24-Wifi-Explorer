/// Information elements from public scan `informationElementData`.
/// Clean-room port of Electron `src/domain/ie/types.ts`.
///
/// Deep vendor / RNR / FILS / encrypted / per-packet IEs are unsupported
/// without monitor mode.

enum IeParseLevel {
  absent,
  rawOnly,
  shallowTags,
  unsupportedDeep,
}

extension IeParseLevelWire on IeParseLevel {
  String get wire => switch (this) {
        IeParseLevel.absent => 'absent',
        IeParseLevel.rawOnly => 'raw-only',
        IeParseLevel.shallowTags => 'shallow-tags',
        IeParseLevel.unsupportedDeep => 'unsupported-deep',
      };

  static IeParseLevel fromWire(String? value) {
    return switch (value) {
      'raw-only' => IeParseLevel.rawOnly,
      'shallow-tags' => IeParseLevel.shallowTags,
      'unsupported-deep' => IeParseLevel.unsupportedDeep,
      _ => IeParseLevel.absent,
    };
  }
}

const ieUnsupportedDeep = <String>[
  'rnr-tbtt',
  'fils-indication',
  'vendor-oui-beyond-wpa-wps',
  'rsnxe-full-akm-matrix',
  'he-operation-6ghz-wide',
  'eht-operation-320',
  'encrypted-ie',
  'per-packet-ie',
];

enum IeKind {
  ssid,
  rates,
  ds,
  country,
  bssLoad,
  tim,
  powerConstraint,
  extendedCapabilities,
  htCapabilities,
  rsn,
  htOperation,
  vhtCapabilities,
  vhtOperation,
  vendor,
  vendorWpa,
  rsnx,
  heCapabilities,
  heOperation,
  ehtCapabilities,
  unknown,
}

class ExtCapNamedBit {
  const ExtCapNamedBit({
    required this.octet,
    required this.bit,
    required this.name,
  });

  final int octet;
  final int bit;
  final String name;
}

enum CipherName {
  useGroup('use-group'),
  wep40('wep-40'),
  tkip('tkip'),
  ccmp128('ccmp-128'),
  wep104('wep-104'),
  gcmp128('gcmp-128'),
  gcmp256('gcmp-256'),
  ccmp256('ccmp-256'),
  bipCmac128('bip-cmac-128'),
  bipGmac128('bip-gmac-128'),
  bipGmac256('bip-gmac-256'),
  bipCmac256('bip-cmac-256'),
  unknown('unknown');

  const CipherName(this.wire);
  final String wire;
}

enum AkmName {
  ieee8021x('ieee8021x'),
  psk('psk'),
  ftIeee8021x('ft-ieee8021x'),
  ftPsk('ft-psk'),
  ieee8021xSha256('ieee8021x-sha256'),
  pskSha256('psk-sha256'),
  tdls('tdls'),
  sae('sae'),
  ftSae('ft-sae'),
  apPeerkey('ap-peerkey'),
  ieee8021xSuiteB('ieee8021x-suite-b'),
  ieee8021xSuiteB192('ieee8021x-suite-b-192'),
  ftIeee8021xSha384('ft-ieee8021x-sha384'),
  filsSha256('fils-sha256'),
  filsSha384('fils-sha384'),
  ftFilsSha256('ft-fils-sha256'),
  ftFilsSha384('ft-fils-sha384'),
  owe('owe'),
  ftSaeExtKey('ft-sae-ext-key'),
  saeExtKey('sae-ext-key'),
  unknown('unknown');

  const AkmName(this.wire);
  final String wire;
}

class CipherSuite {
  const CipherSuite({required this.oui, required this.type, required this.name});

  final String oui;
  final int type;
  final CipherName name;
}

class AkmSuite {
  const AkmSuite({required this.oui, required this.type, required this.name});

  final String oui;
  final int type;
  final AkmName name;
}

class CountryTriplet {
  const CountryTriplet({
    required this.firstChannel,
    required this.channelCount,
    required this.maxTxPowerDbm,
  });

  final int firstChannel;
  final int channelCount;
  final int maxTxPowerDbm;
}

/// Shallow IE tags used by [ObservedBss.ie] and channel math.
class ShallowIeView {
  const ShallowIeView({
    this.level = 'absent',
    this.byteLength = 0,
    this.presentIds = const [],
    this.wpaVendorIe,
    this.rsnIe,
    this.htCapabilities,
    this.vhtCapabilities,
    this.heCapabilities,
    this.ehtCapabilities,
    this.countryFromIe,
    this.nssHint,
    this.htPrimaryChannel,
    this.htSecondaryOffset,
    this.ccfs0,
  });

  final String level;
  final int byteLength;
  final List<int> presentIds;
  final bool? wpaVendorIe;
  final bool? rsnIe;
  final bool? htCapabilities;
  final bool? vhtCapabilities;
  final bool? heCapabilities;
  final bool? ehtCapabilities;
  final String? countryFromIe;
  final int? nssHint;
  final int? htPrimaryChannel;
  final int? htSecondaryOffset;
  final int? ccfs0;
}

class DecodedIe {
  const DecodedIe({
    required this.id,
    required this.extId,
    required this.raw,
    required this.rawHex,
    required this.kind,
    this.ssid,
    this.hidden,
    this.ratesMbps = const [],
    this.basicRatesMbps = const [],
    this.channel,
    this.countryCode,
    this.environment,
    this.triplets = const [],
    this.stationCount,
    this.channelUtilization,
    this.channelUtilPct,
    this.availableAdmissionCapacity,
    this.dtimCount,
    this.dtimPeriod,
    this.bitmapControl,
    this.partialBitmapLength = 0,
    this.localPowerConstraintDb,
    this.octetCount,
    this.setFlags = const [],
    this.fortyMhz,
    this.shortGi20,
    this.shortGi40,
    this.nss,
    this.rsnVersion,
    this.groupCipher,
    this.pairwise = const [],
    this.akm = const [],
    this.mfpc,
    this.mfpr,
    this.primaryChannel,
    this.secondaryOffset,
    this.staChannelWidthAny,
    this.maxMcs,
    this.shortGi80,
    this.shortGi160,
    this.channelWidthSet,
    this.widthCode,
    this.widthMhz,
    this.ccfs0,
    this.ccfs1,
    this.oui,
    this.vendorType,
    this.wpaVersion,
    this.saeHashToElement,
    this.bssColor,
    this.bssColorDisabled,
    this.sixGhzPrimaryChannel,
  });

  final int id;
  final int? extId;
  final List<int> raw;
  final String rawHex;
  final IeKind kind;

  final String? ssid;
  final bool? hidden;

  final List<double> ratesMbps;
  final List<double> basicRatesMbps;

  final int? channel;

  final String? countryCode;
  final int? environment;
  final List<CountryTriplet> triplets;

  final int? stationCount;
  final int? channelUtilization;
  final double? channelUtilPct;
  final int? availableAdmissionCapacity;

  final int? dtimCount;
  final int? dtimPeriod;
  final int? bitmapControl;
  final int partialBitmapLength;

  final int? localPowerConstraintDb;

  final int? octetCount;
  final List<ExtCapNamedBit> setFlags;

  final bool? fortyMhz;
  final bool? shortGi20;
  final bool? shortGi40;
  final int? nss;

  final int? rsnVersion;
  final CipherSuite? groupCipher;
  final List<CipherSuite> pairwise;
  final List<AkmSuite> akm;
  final bool? mfpc;
  final bool? mfpr;

  final int? primaryChannel;
  final int? secondaryOffset;
  final bool? staChannelWidthAny;

  final int? maxMcs;
  final bool? shortGi80;
  final bool? shortGi160;
  final int? channelWidthSet;

  final int? widthCode;
  final int? widthMhz;
  final int? ccfs0;
  final int? ccfs1;

  final String? oui;
  final int? vendorType;
  final int? wpaVersion;

  final bool? saeHashToElement;

  final int? bssColor;
  final bool? bssColorDisabled;
  final int? sixGhzPrimaryChannel;
}

class IeDecodeResult {
  const IeDecodeResult({
    required this.level,
    required this.byteLength,
    required this.elements,
    required this.shallow,
  });

  final IeParseLevel level;
  final int byteLength;
  final List<DecodedIe> elements;
  final ShallowIeView shallow;
}

class IeTreeNode {
  const IeTreeNode({
    required this.key,
    required this.label,
    required this.value,
    this.messageKey,
    this.messageValues,
    this.children = const [],
  });

  final String key;
  /// English fallback (IEEE / Electron parity).
  final String label;
  /// `scan.ie.*` key for Flutter [scan_l10n].
  final String? messageKey;
  final Map<String, Object>? messageValues;
  final String? value;
  final List<IeTreeNode> children;
}
