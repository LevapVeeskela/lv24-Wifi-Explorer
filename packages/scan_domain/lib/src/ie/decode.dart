/// Shallow public IEEE 802.11 IE decode. Unknown tag → id + hex only.

import 'dart:convert';

import 'bytes.dart';
import 'types.dart';

const idSsid = 0;
const idRates = 1;
const idTim = 5;
const idDs = 3;
const idCountry = 7;
const idBssLoad = 11;
const idPwrConstraint = 32;
const idHtCap = 45;
const idRsn = 48;
const idExtRates = 50;
const idHtOp = 61;
const idVhtCap = 191;
const idVhtOp = 192;
const idExtCap = 127;
const idVendor = 221;
const idRsnx = 244;
const idExt = 255;

const extHeCap = 35;
const extHeOp = 36;
const extEhtCap = 108;

const _ieeeSuiteOui = '00:0f:ac';
const _wpaOui = [0x00, 0x50, 0xf2];
const _wpaType = 0x01;

const _cipherNames = <int, CipherName>{
  0: CipherName.useGroup,
  1: CipherName.wep40,
  2: CipherName.tkip,
  4: CipherName.ccmp128,
  5: CipherName.wep104,
  6: CipherName.bipCmac128,
  8: CipherName.gcmp128,
  9: CipherName.gcmp256,
  10: CipherName.ccmp256,
  11: CipherName.bipGmac128,
  12: CipherName.bipGmac256,
  13: CipherName.bipCmac256,
};

const _akmNames = <int, AkmName>{
  1: AkmName.ieee8021x,
  2: AkmName.psk,
  3: AkmName.ftIeee8021x,
  4: AkmName.ftPsk,
  5: AkmName.ieee8021xSha256,
  6: AkmName.pskSha256,
  7: AkmName.tdls,
  8: AkmName.sae,
  9: AkmName.ftSae,
  10: AkmName.apPeerkey,
  11: AkmName.ieee8021xSuiteB,
  12: AkmName.ieee8021xSuiteB192,
  13: AkmName.ftIeee8021xSha384,
  14: AkmName.filsSha256,
  15: AkmName.filsSha384,
  16: AkmName.ftFilsSha256,
  17: AkmName.ftFilsSha384,
  18: AkmName.owe,
  24: AkmName.saeExtKey,
  25: AkmName.ftSaeExtKey,
};

/// IEEE 802.11 Extended Capabilities — selected named bits (octet 0–3).
const extCapNamedBits = <({int octet, int bit, String name})>[
  (octet: 0, bit: 0, name: '20/40 BSS coexistence management'),
  (octet: 0, bit: 1, name: 'Generalized link'),
  (octet: 0, bit: 2, name: 'Extended channel switching'),
  (octet: 0, bit: 4, name: 'BSS transition'),
  (octet: 0, bit: 5, name: 'SSID list'),
  (octet: 0, bit: 6, name: 'Operating mode notification'),
  (octet: 1, bit: 0, name: 'UTF-8 SSID'),
  (octet: 1, bit: 2, name: 'TDLS peer U-APSD buffer STA support'),
  (octet: 1, bit: 3, name: 'TDLS peer PSM support'),
  (octet: 1, bit: 4, name: 'TDLS channel switching'),
  (octet: 2, bit: 0, name: 'Interworking'),
  (octet: 2, bit: 2, name: 'QoS map'),
  (octet: 2, bit: 3, name: 'EBR'),
  (octet: 2, bit: 4, name: 'SSPN interface'),
  (octet: 3, bit: 0, name: 'MSGCF capability'),
  (octet: 3, bit: 2, name: 'TDLS support'),
  (octet: 3, bit: 3, name: 'TDLS prohibited'),
  (octet: 3, bit: 4, name: 'TDLS channel switching prohibited'),
  (octet: 3, bit: 7, name: 'Extended spectrum management'),
];

DecodedIe _with({
  required int id,
  required List<int> payload,
  int? extId,
  required IeKind kind,
  String? ssid,
  bool? hidden,
  List<double> ratesMbps = const [],
  List<double> basicRatesMbps = const [],
  int? channel,
  String? countryCode,
  int? environment,
  List<CountryTriplet> triplets = const [],
  int? stationCount,
  int? channelUtilization,
  double? channelUtilPct,
  int? availableAdmissionCapacity,
  int? dtimCount,
  int? dtimPeriod,
  int? bitmapControl,
  int partialBitmapLength = 0,
  int? localPowerConstraintDb,
  int? octetCount,
  List<ExtCapNamedBit> setFlags = const [],
  bool? fortyMhz,
  bool? shortGi20,
  bool? shortGi40,
  int? nss,
  int? rsnVersion,
  CipherSuite? groupCipher,
  List<CipherSuite> pairwise = const [],
  List<AkmSuite> akm = const [],
  bool? mfpc,
  bool? mfpr,
  int? primaryChannel,
  int? secondaryOffset,
  bool? staChannelWidthAny,
  int? maxMcs,
  bool? shortGi80,
  bool? shortGi160,
  int? channelWidthSet,
  int? widthCode,
  int? widthMhz,
  int? ccfs0,
  int? ccfs1,
  String? oui,
  int? vendorType,
  int? wpaVersion,
  bool? saeHashToElement,
  int? bssColor,
  bool? bssColorDisabled,
  int? sixGhzPrimaryChannel,
}) {
  return DecodedIe(
    id: id,
    extId: extId,
    raw: payload,
    rawHex: toHex(payload),
    kind: kind,
    ssid: ssid,
    hidden: hidden,
    ratesMbps: ratesMbps,
    basicRatesMbps: basicRatesMbps,
    channel: channel,
    countryCode: countryCode,
    environment: environment,
    triplets: triplets,
    stationCount: stationCount,
    channelUtilization: channelUtilization,
    channelUtilPct: channelUtilPct,
    availableAdmissionCapacity: availableAdmissionCapacity,
    dtimCount: dtimCount,
    dtimPeriod: dtimPeriod,
    bitmapControl: bitmapControl,
    partialBitmapLength: partialBitmapLength,
    localPowerConstraintDb: localPowerConstraintDb,
    octetCount: octetCount,
    setFlags: setFlags,
    fortyMhz: fortyMhz,
    shortGi20: shortGi20,
    shortGi40: shortGi40,
    nss: nss,
    rsnVersion: rsnVersion,
    groupCipher: groupCipher,
    pairwise: pairwise,
    akm: akm,
    mfpc: mfpc,
    mfpr: mfpr,
    primaryChannel: primaryChannel,
    secondaryOffset: secondaryOffset,
    staChannelWidthAny: staChannelWidthAny,
    maxMcs: maxMcs,
    shortGi80: shortGi80,
    shortGi160: shortGi160,
    channelWidthSet: channelWidthSet,
    widthCode: widthCode,
    widthMhz: widthMhz,
    ccfs0: ccfs0,
    ccfs1: ccfs1,
    oui: oui,
    vendorType: vendorType,
    wpaVersion: wpaVersion,
    saeHashToElement: saeHashToElement,
    bssColor: bssColor,
    bssColorDisabled: bssColorDisabled,
    sixGhzPrimaryChannel: sixGhzPrimaryChannel,
  );
}

/// 2-bit MCS map (VHT/HE): 3 = not supported. Allowed nss: 1|2|3|4|8.
int? nssFromMcsMap(int lo, int hi) {
  final map = (lo & 0xff) | ((hi & 0xff) << 8);
  var nss = 0;
  for (var i = 0; i < 8; i += 1) {
    final bits = (map >> (i * 2)) & 0x3;
    if (bits != 3) nss = i + 1;
  }
  if (nss == 0) return null;
  if (nss >= 8) return 8;
  if (nss == 5 || nss == 6 || nss == 7) return 4;
  return nss;
}

int? nssFromHtMcsSet(List<int> mcsSet) {
  if (mcsSet.length < 4) return null;
  int? nss;
  for (var ss = 0; ss < 4; ss += 1) {
    if (mcsSet[ss] != 0) nss = ss + 1;
  }
  return nss;
}

/// VHT Rx MCS map: 0=MCS0–7, 1=MCS0–8, 2=MCS0–9, 3=none.
int? maxMcsFromVhtMap(int lo, int hi) {
  final map = (lo & 0xff) | ((hi & 0xff) << 8);
  int? max;
  for (var i = 0; i < 8; i += 1) {
    final bits = (map >> (i * 2)) & 0x3;
    if (bits == 0) {
      max = max == null || max < 7 ? 7 : max;
    } else if (bits == 1) {
      max = max == null || max < 8 ? 8 : max;
    } else if (bits == 2) {
      max = 9;
    }
  }
  return max;
}

/// HE Rx MCS map: 0=MCS0–7, 1=MCS0–9, 2=MCS0–11, 3=none.
int? maxMcsFromHeMap(int lo, int hi) {
  final map = (lo & 0xff) | ((hi & 0xff) << 8);
  int? max;
  for (var i = 0; i < 8; i += 1) {
    final bits = (map >> (i * 2)) & 0x3;
    if (bits == 0) {
      max = max == null || max < 7 ? 7 : max;
    } else if (bits == 1) {
      max = max == null || max < 9 ? 9 : max;
    } else if (bits == 2) {
      max = 11;
    }
  }
  return max;
}

/// EHT Rx MCS map (≤80 MHz): 0=0–7, 1=0–9, 2=0–11, 3=0–13.
int? maxMcsFromEhtMap(int lo, int hi) {
  final map = (lo & 0xff) | ((hi & 0xff) << 8);
  int? max;
  for (var i = 0; i < 8; i += 1) {
    final bits = (map >> (i * 2)) & 0x3;
    if (bits == 0) {
      max = max == null || max < 7 ? 7 : max;
    } else if (bits == 1) {
      max = max == null || max < 9 ? 9 : max;
    } else if (bits == 2) {
      max = max == null || max < 11 ? 11 : max;
    } else if (bits == 3) {
      max = 13;
    }
  }
  return max;
}

/// EHT Rx map NSS: same as HE (3 = stream absent).
int? nssFromEhtMcsMap(int lo, int hi) => nssFromMcsMap(lo, hi);

int? _maxNss(int? a, int? b) {
  if (a == null) return b;
  if (b == null) return a;
  return a > b ? a : b;
}

ShallowIeView emptyShallow(String level, int byteLength) {
  final tags = level == 'shallow-tags';
  return ShallowIeView(
    level: level,
    byteLength: byteLength,
    wpaVendorIe: tags ? false : null,
    rsnIe: tags ? false : null,
    htCapabilities: tags ? false : null,
    vhtCapabilities: tags ? false : null,
    heCapabilities: tags ? false : null,
    ehtCapabilities: tags ? false : null,
  );
}

DecodedIe _decodeSsid(List<int> payload) {
  final hidden = payload.isEmpty;
  var ssid = '';
  try {
    ssid = utf8.decode(payload, allowMalformed: true);
  } catch (_) {
    ssid = '';
  }
  return _with(
    id: idSsid,
    payload: payload,
    kind: IeKind.ssid,
    ssid: ssid,
    hidden: hidden,
  );
}

DecodedIe _decodeRates(int id, List<int> payload) {
  final ratesMbps = <double>[];
  final basicRatesMbps = <double>[];
  for (final byte in payload) {
    final mbps = (byte & 0x7f) * 0.5;
    ratesMbps.add(mbps);
    if (byte & 0x80 != 0) basicRatesMbps.add(mbps);
  }
  return _with(
    id: id,
    payload: payload,
    kind: IeKind.rates,
    ratesMbps: ratesMbps,
    basicRatesMbps: basicRatesMbps,
  );
}

DecodedIe _decodeDs(List<int> payload) {
  return _with(
    id: idDs,
    payload: payload,
    kind: IeKind.ds,
    channel: payload.isNotEmpty ? payload[0] & 0xff : 0,
  );
}

DecodedIe _decodeCountry(List<int> payload) {
  final countryCode =
      payload.length >= 2 ? asciiLetters(payload[0], payload[1]) : null;
  final environment = payload.length >= 3 ? payload[2] & 0xff : null;
  final triplets = <CountryTriplet>[];
  for (var i = 3; i + 2 < payload.length; i += 3) {
    triplets.add(
      CountryTriplet(
        firstChannel: payload[i] & 0xff,
        channelCount: payload[i + 1] & 0xff,
        maxTxPowerDbm: payload[i + 2] & 0xff,
      ),
    );
  }
  return _with(
    id: idCountry,
    payload: payload,
    kind: IeKind.country,
    countryCode: countryCode,
    environment: environment,
    triplets: triplets,
  );
}

DecodedIe _decodeTim(List<int> payload) {
  return _with(
    id: idTim,
    payload: payload,
    kind: IeKind.tim,
    dtimCount: payload.isNotEmpty ? payload[0] & 0xff : null,
    dtimPeriod: payload.length >= 2 ? payload[1] & 0xff : null,
    bitmapControl: payload.length >= 3 ? payload[2] & 0xff : null,
    partialBitmapLength: payload.length > 3 ? payload.length - 3 : 0,
  );
}

DecodedIe _decodePowerConstraint(List<int> payload) {
  return _with(
    id: idPwrConstraint,
    payload: payload,
    kind: IeKind.powerConstraint,
    localPowerConstraintDb: payload.isNotEmpty ? payload[0] & 0xff : null,
  );
}

DecodedIe _decodeExtendedCapabilities(List<int> payload) {
  final setFlags = <ExtCapNamedBit>[];
  for (final def in extCapNamedBits) {
    if (def.octet >= payload.length) continue;
    if ((payload[def.octet] & (1 << def.bit)) != 0) {
      setFlags.add(
        ExtCapNamedBit(octet: def.octet, bit: def.bit, name: def.name),
      );
    }
  }
  return _with(
    id: idExtCap,
    payload: payload,
    kind: IeKind.extendedCapabilities,
    octetCount: payload.length,
    setFlags: setFlags,
  );
}

DecodedIe _decodeBssLoad(List<int> payload) {
  final stationCount = u16le(payload, 0);
  final channelUtilization = payload.length >= 3 ? payload[2] & 0xff : null;
  final channelUtilPct = channelUtilization == null
      ? null
      : (channelUtilization * 100) / 255;
  return _with(
    id: idBssLoad,
    payload: payload,
    kind: IeKind.bssLoad,
    stationCount: stationCount,
    channelUtilization: channelUtilization,
    channelUtilPct: channelUtilPct,
    availableAdmissionCapacity: u16le(payload, 3),
  );
}

DecodedIe _decodeHtCap(List<int> payload) {
  final info = u16le(payload, 0);
  final nss = payload.length >= 7 ? nssFromHtMcsSet(payload.sublist(3, 7)) : null;
  return _with(
    id: idHtCap,
    payload: payload,
    kind: IeKind.htCapabilities,
    fortyMhz: info == null ? null : (info & (1 << 1)) != 0,
    shortGi20: info == null ? null : (info & (1 << 5)) != 0,
    shortGi40: info == null ? null : (info & (1 << 6)) != 0,
    nss: nss,
  );
}

int? _htSecondaryOffset(List<int> payload) {
  if (payload.length < 2) return null;
  final raw = payload[1] & 0x3;
  if (raw == 0) return 0;
  if (raw == 1) return 1;
  if (raw == 3) return -1;
  return null;
}

DecodedIe _decodeHtOp(List<int> payload) {
  return _with(
    id: idHtOp,
    payload: payload,
    kind: IeKind.htOperation,
    primaryChannel: payload.isNotEmpty ? payload[0] & 0xff : null,
    secondaryOffset: _htSecondaryOffset(payload),
    staChannelWidthAny: payload.length >= 2 ? (payload[1] & 0x4) != 0 : null,
  );
}

String? _readSuiteOui(List<int> payload, int offset) {
  if (offset + 2 >= payload.length) return null;
  return formatOui(payload.sublist(offset, offset + 3));
}

CipherSuite? _readCipher(List<int> payload, int offset) {
  final oui = _readSuiteOui(payload, offset);
  if (oui == null || offset + 3 >= payload.length) return null;
  final type = payload[offset + 3] & 0xff;
  final name = oui == _ieeeSuiteOui
      ? (_cipherNames[type] ?? CipherName.unknown)
      : CipherName.unknown;
  return CipherSuite(oui: oui, type: type, name: name);
}

AkmSuite? _readAkm(List<int> payload, int offset) {
  final oui = _readSuiteOui(payload, offset);
  if (oui == null || offset + 3 >= payload.length) return null;
  final type = payload[offset + 3] & 0xff;
  final name = oui == _ieeeSuiteOui
      ? (_akmNames[type] ?? AkmName.unknown)
      : AkmName.unknown;
  return AkmSuite(oui: oui, type: type, name: name);
}

DecodedIe _decodeRsn(List<int> payload) {
  final version = u16le(payload, 0);
  var offset = 2;
  final groupCipher = _readCipher(payload, offset);
  if (groupCipher != null) offset += 4;
  final pairwise = <CipherSuite>[];
  final pairwiseCount = u16le(payload, offset);
  if (pairwiseCount != null) {
    offset += 2;
    for (var i = 0; i < pairwiseCount; i += 1) {
      final suite = _readCipher(payload, offset);
      if (suite == null) break;
      pairwise.add(suite);
      offset += 4;
    }
  }
  final akm = <AkmSuite>[];
  final akmCount = u16le(payload, offset);
  if (akmCount != null) {
    offset += 2;
    for (var i = 0; i < akmCount; i += 1) {
      final suite = _readAkm(payload, offset);
      if (suite == null) break;
      akm.add(suite);
      offset += 4;
    }
  }
  final caps = u16le(payload, offset);
  return _with(
    id: idRsn,
    payload: payload,
    kind: IeKind.rsn,
    rsnVersion: version,
    groupCipher: groupCipher,
    pairwise: pairwise,
    akm: akm,
    mfpr: caps == null ? null : (caps & (1 << 6)) != 0,
    mfpc: caps == null ? null : (caps & (1 << 7)) != 0,
  );
}

DecodedIe _decodeVhtCap(List<int> payload) {
  final info = payload.length >= 4
      ? (payload[0] |
              (payload[1] << 8) |
              (payload[2] << 16) |
              (payload[3] << 24)) &
          0xffffffff
      : null;
  final nss = payload.length >= 6 ? nssFromMcsMap(payload[4], payload[5]) : null;
  final maxMcs =
      payload.length >= 6 ? maxMcsFromVhtMap(payload[4], payload[5]) : null;
  return _with(
    id: idVhtCap,
    payload: payload,
    kind: IeKind.vhtCapabilities,
    nss: nss,
    maxMcs: maxMcs,
    shortGi80: info == null ? null : (info & (1 << 5)) != 0,
    shortGi160: info == null ? null : (info & (1 << 6)) != 0,
    channelWidthSet: info == null ? null : (info >> 2) & 0x3,
  );
}

int? _vhtWidthMhz(int widthCode) {
  if (widthCode == 0) return 20;
  if (widthCode == 1) return 80;
  if (widthCode == 2) return 160;
  if (widthCode == 3) return 160;
  return null;
}

DecodedIe _decodeVhtOp(List<int> payload) {
  final widthCode = payload.isNotEmpty ? payload[0] & 0xff : null;
  return _with(
    id: idVhtOp,
    payload: payload,
    kind: IeKind.vhtOperation,
    widthCode: widthCode,
    widthMhz: widthCode == null ? null : _vhtWidthMhz(widthCode),
    ccfs0: payload.length >= 2 ? payload[1] & 0xff : null,
    ccfs1: payload.length >= 3 ? payload[2] & 0xff : null,
  );
}

bool isWpaVendor(List<int> payload) {
  return payload.length >= 4 &&
      payload[0] == _wpaOui[0] &&
      payload[1] == _wpaOui[1] &&
      payload[2] == _wpaOui[2] &&
      payload[3] == _wpaType;
}

DecodedIe _decodeWpaVendor(List<int> payload) {
  final oui = formatOui(payload);
  final version = u16le(payload, 4);
  var offset = 6;
  final groupCipher = _readCipher(payload, offset);
  if (groupCipher != null) offset += 4;
  final pairwise = <CipherSuite>[];
  final pairwiseCount = u16le(payload, offset);
  if (pairwiseCount != null) {
    offset += 2;
    for (var i = 0; i < pairwiseCount; i += 1) {
      final suite = _readCipher(payload, offset);
      if (suite == null) break;
      pairwise.add(suite);
      offset += 4;
    }
  }
  final akm = <AkmSuite>[];
  final akmCount = u16le(payload, offset);
  if (akmCount != null) {
    offset += 2;
    for (var i = 0; i < akmCount; i += 1) {
      final suite = _readAkm(payload, offset);
      if (suite == null) break;
      akm.add(suite);
      offset += 4;
    }
  }
  return _with(
    id: idVendor,
    payload: payload,
    kind: IeKind.vendorWpa,
    oui: oui,
    wpaVersion: version,
    groupCipher: groupCipher,
    pairwise: pairwise,
    akm: akm,
  );
}

DecodedIe _decodeVendor(List<int> payload) {
  if (isWpaVendor(payload)) return _decodeWpaVendor(payload);
  return _with(
    id: idVendor,
    payload: payload,
    kind: IeKind.vendor,
    oui: formatOui(payload),
    vendorType: payload.length >= 4 ? payload[3] & 0xff : null,
  );
}

DecodedIe _decodeRsnx(List<int> payload) {
  final first = payload.isNotEmpty ? payload[0] & 0xff : null;
  return _with(
    id: idRsnx,
    payload: payload,
    kind: IeKind.rsnx,
    saeHashToElement: first == null ? null : (first & (1 << 5)) != 0,
  );
}

DecodedIe _decodeHeCap(List<int> afterExt, List<int> fullPayload) {
  final nss = afterExt.length >= 19
      ? nssFromMcsMap(afterExt[17], afterExt[18])
      : null;
  final maxMcs = afterExt.length >= 19
      ? maxMcsFromHeMap(afterExt[17], afterExt[18])
      : null;
  return _with(
    id: idExt,
    payload: fullPayload,
    extId: extHeCap,
    kind: IeKind.heCapabilities,
    nss: nss,
    maxMcs: maxMcs,
  );
}

DecodedIe _decodeEhtCap(List<int> afterExt, List<int> fullPayload) {
  final nss = afterExt.length >= 13
      ? nssFromEhtMcsMap(afterExt[11], afterExt[12])
      : null;
  final maxMcs = afterExt.length >= 13
      ? maxMcsFromEhtMap(afterExt[11], afterExt[12])
      : null;
  return _with(
    id: idExt,
    payload: fullPayload,
    extId: extEhtCap,
    kind: IeKind.ehtCapabilities,
    nss: nss,
    maxMcs: maxMcs,
  );
}

DecodedIe _decodeHeOp(List<int> afterExt, List<int> fullPayload) {
  final params = afterExt.length >= 3
      ? (afterExt[0] | (afterExt[1] << 8) | (afterExt[2] << 16)) & 0xffffff
      : 0;
  final colorByte = afterExt.length >= 4 ? afterExt[3] & 0xff : null;
  final vhtPresent = (params & (1 << 7)) != 0;
  final colocated = (params & (1 << 8)) != 0;
  final sixGhzPresent = (params & (1 << 10)) != 0;
  var optional = 6;
  if (vhtPresent) optional += 3;
  if (colocated) optional += 1;
  int? sixGhzPrimaryChannel;
  int? ccfs0;
  if (sixGhzPresent && afterExt.length >= optional + 5) {
    sixGhzPrimaryChannel = afterExt[optional] & 0xff;
    ccfs0 = afterExt[optional + 2] & 0xff;
  }
  return _with(
    id: idExt,
    payload: fullPayload,
    extId: extHeOp,
    kind: IeKind.heOperation,
    bssColor: colorByte == null ? null : colorByte & 0x3f,
    bssColorDisabled: colorByte == null ? null : (colorByte & 0x80) != 0,
    sixGhzPrimaryChannel: sixGhzPrimaryChannel,
    ccfs0: ccfs0,
  );
}

DecodedIe _decodeUnknown(int id, List<int> payload, {int? extId}) {
  return _with(id: id, payload: payload, extId: extId, kind: IeKind.unknown);
}

DecodedIe _decodeOne(int id, List<int> payload) {
  if (id == idSsid) return _decodeSsid(payload);
  if (id == idRates) return _decodeRates(idRates, payload);
  if (id == idTim) return _decodeTim(payload);
  if (id == idDs) return _decodeDs(payload);
  if (id == idCountry) return _decodeCountry(payload);
  if (id == idBssLoad) return _decodeBssLoad(payload);
  if (id == idPwrConstraint) return _decodePowerConstraint(payload);
  if (id == idHtCap) return _decodeHtCap(payload);
  if (id == idRsn) return _decodeRsn(payload);
  if (id == idExtRates) return _decodeRates(idExtRates, payload);
  if (id == idHtOp) return _decodeHtOp(payload);
  if (id == idVhtCap) return _decodeVhtCap(payload);
  if (id == idVhtOp) return _decodeVhtOp(payload);
  if (id == idExtCap) return _decodeExtendedCapabilities(payload);
  if (id == idVendor) return _decodeVendor(payload);
  if (id == idRsnx) return _decodeRsnx(payload);
  if (id == idExt) {
    final extId = payload.isNotEmpty ? payload[0] & 0xff : null;
    final rest = payload.length > 1 ? payload.sublist(1) : <int>[];
    if (extId == extHeCap) return _decodeHeCap(rest, payload);
    if (extId == extHeOp) return _decodeHeOp(rest, payload);
    if (extId == extEhtCap) return _decodeEhtCap(rest, payload);
    return _decodeUnknown(idExt, payload, extId: extId);
  }
  return _decodeUnknown(id, payload);
}

ShallowIeView buildShallow(
  int byteLength,
  List<DecodedIe> elements,
  List<int> presentIds,
) {
  var wpaVendorIe = false;
  var rsnIe = false;
  var htCapabilities = false;
  var vhtCapabilities = false;
  var heCapabilities = false;
  var ehtCapabilities = false;
  String? countryFromIe;
  int? nssHint;
  int? htPrimaryChannel;
  int? htSecondary;
  int? ccfs0;

  for (final el in elements) {
    switch (el.kind) {
      case IeKind.country:
        countryFromIe = el.countryCode ?? countryFromIe;
      case IeKind.htCapabilities:
        htCapabilities = true;
        nssHint = _maxNss(nssHint, el.nss);
      case IeKind.rsn:
        rsnIe = true;
      case IeKind.htOperation:
        if (el.primaryChannel != null) htPrimaryChannel = el.primaryChannel;
        htSecondary = el.secondaryOffset;
      case IeKind.vhtCapabilities:
        vhtCapabilities = true;
        nssHint = _maxNss(nssHint, el.nss);
      case IeKind.vhtOperation:
        if (el.ccfs0 != null) ccfs0 = el.ccfs0;
      case IeKind.vendorWpa:
        wpaVendorIe = true;
      case IeKind.vendor:
        if (isWpaVendor(el.raw)) wpaVendorIe = true;
      case IeKind.heCapabilities:
        heCapabilities = true;
        nssHint = _maxNss(nssHint, el.nss);
      case IeKind.heOperation:
        if (el.ccfs0 != null) ccfs0 = el.ccfs0;
      case IeKind.ehtCapabilities:
        ehtCapabilities = true;
        nssHint = _maxNss(nssHint, el.nss);
      case IeKind.unknown:
        if (el.id == idExt && el.extId == extEhtCap) {
          ehtCapabilities = true;
        }
      default:
        break;
    }
  }

  return ShallowIeView(
    level: 'shallow-tags',
    byteLength: byteLength,
    presentIds: presentIds,
    wpaVendorIe: wpaVendorIe,
    rsnIe: rsnIe,
    htCapabilities: htCapabilities,
    vhtCapabilities: vhtCapabilities,
    heCapabilities: heCapabilities,
    ehtCapabilities: ehtCapabilities,
    countryFromIe: countryFromIe,
    nssHint: nssHint,
    htPrimaryChannel: htPrimaryChannel,
    htSecondaryOffset: htSecondary,
    ccfs0: ccfs0,
  );
}

IeDecodeResult decodeInformationElements(List<int>? data) {
  if (data == null || data.isEmpty) {
    final byteLength = data?.length ?? 0;
    return IeDecodeResult(
      level: IeParseLevel.absent,
      byteLength: byteLength,
      elements: const [],
      shallow: emptyShallow('absent', byteLength),
    );
  }

  final tlvs = walkIeTlvs(data);
  if (tlvs.isEmpty) {
    return IeDecodeResult(
      level: IeParseLevel.rawOnly,
      byteLength: data.length,
      elements: const [],
      shallow: emptyShallow('raw-only', data.length),
    );
  }

  final presentIds = <int>[];
  final elements = <DecodedIe>[];
  for (final tlv in tlvs) {
    if (!presentIds.contains(tlv.id)) presentIds.add(tlv.id);
    elements.add(_decodeOne(tlv.id, tlv.payload));
  }

  return IeDecodeResult(
    level: IeParseLevel.shallowTags,
    byteLength: data.length,
    elements: elements,
    shallow: buildShallow(data.length, elements, presentIds),
  );
}

/// Compatible with the previous shallow TLV walk.
ShallowIeView parseShallowIe(List<int>? data) {
  return decodeInformationElements(data).shallow;
}
