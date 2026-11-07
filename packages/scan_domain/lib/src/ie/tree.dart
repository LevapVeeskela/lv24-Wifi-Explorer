/// Field tree for the Advanced IE pane — from [DecodedIe], no third-party dumps.

import 'names.dart';
import 'types.dart';

IeTreeNode _leaf(
  String key,
  String label,
  String? value, {
  String? messageKey,
  Map<String, Object>? messageValues,
}) {
  return IeTreeNode(
    key: key,
    label: label,
    value: value,
    messageKey: messageKey,
    messageValues: messageValues,
    children: const [],
  );
}

IeTreeNode _branch(
  String key,
  String label,
  String? value,
  List<IeTreeNode> children, {
  String? messageKey,
}) {
  return IeTreeNode(
    key: key,
    label: label,
    value: value,
    messageKey: messageKey,
    children: children,
  );
}

String _fmtBool(bool? v) {
  if (v == null) return '—';
  return v ? 'yes' : 'no';
}

String _fmtCipher(CipherSuite? s) {
  if (s == null) return '—';
  return '${s.name.wire} (${s.oui}:${s.type})';
}

List<IeTreeNode> _cipherList(
  String label,
  String key,
  List<CipherSuite> suites,
) {
  if (suites.isEmpty) return [];
  return [
    for (var i = 0; i < suites.length; i++)
      _leaf(
        '$key.$i',
        '$label ${i + 1}',
        _fmtCipher(suites[i]),
        messageKey: 'scan.ie.pairwise',
        messageValues: {'index': i + 1},
      ),
  ];
}

List<IeTreeNode> _akmList(String key, List<AkmSuite> suites) {
  if (suites.isEmpty) return [];
  return [
    for (var i = 0; i < suites.length; i++)
      _leaf(
        '$key.$i',
        'AKM ${i + 1}',
        '${suites[i].name.wire} (${suites[i].oui}:${suites[i].type})',
        messageKey: 'scan.ie.akm',
        messageValues: {'index': i + 1},
      ),
  ];
}

String _fmtRate(double mbps) {
  if (mbps == mbps.roundToDouble()) return mbps.toInt().toString();
  return mbps.toString();
}

String _ratesMbpsList(List<double> rates) {
  if (rates.isEmpty) return '—';
  return rates.map((r) => '${_fmtRate(r)} Mbps').join(', ');
}

String _hexByte(int? v) {
  if (v == null) return '—';
  return '0x${v.toRadixString(16).padLeft(2, '0')}';
}

IeTreeNode _treeForElement(int index, DecodedIe el) {
  final rootKey = 'ie.$index';
  final title = ieTreeTitle(el.id, el.extId);
  final rawChild = _leaf(
    '$rootKey.raw',
    'Raw hex',
    el.rawHex,
    messageKey: 'scan.ie.rawHex',
  );

  switch (el.kind) {
    case IeKind.ssid:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.ssid',
          'SSID',
          el.hidden == true
              ? '(hidden)'
              : (el.ssid?.isNotEmpty == true ? el.ssid! : '—'),
          messageKey: 'scan.ie.ssid',
        ),
        _leaf(
          '$rootKey.hidden',
          'Hidden',
          _fmtBool(el.hidden),
          messageKey: 'scan.ie.hidden',
        ),
        rawChild,
      ]);
    case IeKind.rates:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.rates',
          'Rates',
          _ratesMbpsList(el.ratesMbps),
          messageKey: 'scan.ie.rates',
        ),
        _leaf(
          '$rootKey.basic',
          'Basic rates',
          _ratesMbpsList(el.basicRatesMbps),
          messageKey: 'scan.ie.basicRates',
        ),
        rawChild,
      ]);
    case IeKind.ds:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.channel',
          'Channel',
          '${el.channel}',
          messageKey: 'scan.ie.channel',
        ),
        rawChild,
      ]);
    case IeKind.country:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.code',
          'Country code',
          el.countryCode ?? '—',
          messageKey: 'scan.ie.countryCode',
        ),
        _leaf(
          '$rootKey.env',
          'Environment',
          el.environment == null ? '—' : '${el.environment}',
          messageKey: 'scan.ie.environment',
        ),
        for (var i = 0; i < el.triplets.length; i++)
          _leaf(
            '$rootKey.triplet.$i',
            'Regulatory triplet ${i + 1}',
            'ch ${el.triplets[i].firstChannel} × ${el.triplets[i].channelCount}, max ${el.triplets[i].maxTxPowerDbm} dBm',
            messageKey: 'scan.ie.regulatoryTriplet',
            messageValues: {'index': i + 1},
          ),
        rawChild,
      ]);
    case IeKind.bssLoad:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.stations',
          'Station count',
          el.stationCount == null ? '—' : '${el.stationCount}',
          messageKey: 'scan.ie.stationCount',
        ),
        _leaf(
          '$rootKey.util',
          'Channel utilization',
          el.channelUtilPct == null
              ? '—'
              : '${el.channelUtilPct!.toStringAsFixed(1)}%',
          messageKey: 'scan.ie.channelUtilization',
        ),
        _leaf(
          '$rootKey.aac',
          'Available admission capacity',
          el.availableAdmissionCapacity == null
              ? '—'
              : '${el.availableAdmissionCapacity}',
          messageKey: 'scan.ie.admissionCapacity',
        ),
        rawChild,
      ]);
    case IeKind.tim:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.dtimCount',
          'DTIM count',
          el.dtimCount == null ? '—' : '${el.dtimCount}',
          messageKey: 'scan.ie.dtimCount',
        ),
        _leaf(
          '$rootKey.dtimPeriod',
          'DTIM period',
          el.dtimPeriod == null ? '—' : '${el.dtimPeriod}',
          messageKey: 'scan.ie.dtimPeriod',
        ),
        _leaf(
          '$rootKey.bitmapControl',
          'Bitmap control',
          _hexByte(el.bitmapControl),
          messageKey: 'scan.ie.bitmapControl',
        ),
        _leaf(
          '$rootKey.bitmapLen',
          'Partial bitmap length',
          '${el.partialBitmapLength}',
          messageKey: 'scan.ie.partialBitmapLength',
        ),
        rawChild,
      ]);
    case IeKind.powerConstraint:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.local',
          'Local power constraint',
          el.localPowerConstraintDb == null
              ? '—'
              : '${el.localPowerConstraintDb} dB',
          messageKey: 'scan.ie.localPowerConstraint',
        ),
        rawChild,
      ]);
    case IeKind.htCapabilities:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.nss',
          'Spatial streams',
          el.nss == null ? '—' : '${el.nss}',
          messageKey: 'scan.ie.spatialStreams',
        ),
        _leaf(
          '$rootKey.40mhz',
          '40 MHz',
          _fmtBool(el.fortyMhz),
          messageKey: 'scan.ie.fortyMhz',
        ),
        _leaf(
          '$rootKey.sgi20',
          'Short GI 20 MHz',
          _fmtBool(el.shortGi20),
          messageKey: 'scan.ie.shortGi20',
        ),
        _leaf(
          '$rootKey.sgi40',
          'Short GI 40 MHz',
          _fmtBool(el.shortGi40),
          messageKey: 'scan.ie.shortGi40',
        ),
        rawChild,
      ]);
    case IeKind.rsn:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.ver',
          'Version',
          el.rsnVersion == null ? '—' : '${el.rsnVersion}',
          messageKey: 'scan.ie.version',
        ),
        _leaf(
          '$rootKey.group',
          'Group cipher',
          _fmtCipher(el.groupCipher),
          messageKey: 'scan.ie.groupCipher',
        ),
        ..._cipherList('Pairwise', '$rootKey.pairwise', el.pairwise),
        ..._akmList('$rootKey.akm', el.akm),
        _leaf(
          '$rootKey.mfpc',
          'MFPC (PMF capable)',
          _fmtBool(el.mfpc),
          messageKey: 'scan.ie.mfpc',
        ),
        _leaf(
          '$rootKey.mfpr',
          'MFPR (PMF required)',
          _fmtBool(el.mfpr),
          messageKey: 'scan.ie.mfpr',
        ),
        rawChild,
      ]);
    case IeKind.htOperation:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.primary',
          'Primary channel',
          el.primaryChannel == null ? '—' : '${el.primaryChannel}',
          messageKey: 'scan.ie.primaryChannel',
        ),
        _leaf(
          '$rootKey.secondary',
          'Secondary offset',
          el.secondaryOffset == null ? '—' : '${el.secondaryOffset}',
          messageKey: 'scan.ie.secondaryOffset',
        ),
        _leaf(
          '$rootKey.any40',
          'STA channel width any 40',
          _fmtBool(el.staChannelWidthAny),
          messageKey: 'scan.ie.staWidthAny40',
        ),
        rawChild,
      ]);
    case IeKind.vhtCapabilities:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.nss',
          'Spatial streams',
          el.nss == null ? '—' : '${el.nss}',
          messageKey: 'scan.ie.spatialStreams',
        ),
        _leaf(
          '$rootKey.maxMcs',
          'Max MCS',
          el.maxMcs == null ? '—' : '${el.maxMcs}',
          messageKey: 'scan.ie.maxMcs',
        ),
        _leaf(
          '$rootKey.sgi80',
          'Short GI 80 MHz',
          _fmtBool(el.shortGi80),
          messageKey: 'scan.ie.shortGi80',
        ),
        _leaf(
          '$rootKey.sgi160',
          'Short GI 160 MHz',
          _fmtBool(el.shortGi160),
          messageKey: 'scan.ie.shortGi160',
        ),
        _leaf(
          '$rootKey.chWidthSet',
          'Supported channel width set',
          el.channelWidthSet == null ? '—' : '${el.channelWidthSet}',
          messageKey: 'scan.ie.channelWidthSet',
        ),
        rawChild,
      ]);
    case IeKind.vhtOperation:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.widthCode',
          'Channel width code',
          el.widthCode == null ? '—' : '${el.widthCode}',
          messageKey: 'scan.ie.widthCode',
        ),
        _leaf(
          '$rootKey.widthMhz',
          'Channel width',
          el.widthMhz == null ? '—' : '${el.widthMhz} MHz',
          messageKey: 'scan.ie.channelWidth',
        ),
        _leaf(
          '$rootKey.ccfs0',
          'Center freq segment 0',
          el.ccfs0 == null ? '—' : '${el.ccfs0}',
          messageKey: 'scan.ie.ccfs0',
        ),
        _leaf(
          '$rootKey.ccfs1',
          'Center freq segment 1',
          el.ccfs1 == null ? '—' : '${el.ccfs1}',
          messageKey: 'scan.ie.ccfs1',
        ),
        rawChild,
      ]);
    case IeKind.extendedCapabilities:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.octets',
          'Length',
          '${el.octetCount}',
          messageKey: 'scan.ie.length',
        ),
        for (var i = 0; i < el.setFlags.length; i++)
          _leaf('$rootKey.flag.$i', el.setFlags[i].name, 'set'),
        rawChild,
      ]);
    case IeKind.vendorWpa:
      return _branch(rootKey, title, 'WPA IE', [
        _leaf(
          '$rootKey.oui',
          'OUI',
          el.oui ?? '—',
          messageKey: 'scan.ie.oui',
        ),
        _leaf(
          '$rootKey.ver',
          'Version',
          el.wpaVersion == null ? '—' : '${el.wpaVersion}',
          messageKey: 'scan.ie.version',
        ),
        _leaf(
          '$rootKey.group',
          'Group cipher',
          _fmtCipher(el.groupCipher),
          messageKey: 'scan.ie.groupCipher',
        ),
        ..._cipherList('Pairwise', '$rootKey.pairwise', el.pairwise),
        ..._akmList('$rootKey.akm', el.akm),
        rawChild,
      ]);
    case IeKind.vendor:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.oui',
          'OUI',
          el.oui ?? '—',
          messageKey: 'scan.ie.oui',
        ),
        _leaf(
          '$rootKey.type',
          'Vendor type',
          el.vendorType == null ? '—' : _hexByte(el.vendorType),
          messageKey: 'scan.ie.vendorType',
        ),
        rawChild,
      ]);
    case IeKind.rsnx:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.h2e',
          'SAE hash-to-element',
          _fmtBool(el.saeHashToElement),
          messageKey: 'scan.ie.saeH2e',
        ),
        rawChild,
      ]);
    case IeKind.heCapabilities:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.nss',
          'Spatial streams',
          el.nss == null ? '—' : '${el.nss}',
          messageKey: 'scan.ie.spatialStreams',
        ),
        _leaf(
          '$rootKey.maxMcs',
          'Max MCS (≤80 MHz)',
          el.maxMcs == null ? '—' : '${el.maxMcs}',
          messageKey: 'scan.ie.maxMcs80',
        ),
        rawChild,
      ]);
    case IeKind.heOperation:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.color',
          'BSS color',
          el.bssColor == null ? '—' : '${el.bssColor}',
          messageKey: 'scan.ie.bssColor',
        ),
        _leaf(
          '$rootKey.colorOff',
          'BSS color disabled',
          _fmtBool(el.bssColorDisabled),
          messageKey: 'scan.ie.bssColorDisabled',
        ),
        _leaf(
          '$rootKey.6gPrimary',
          '6 GHz primary channel',
          el.sixGhzPrimaryChannel == null ? '—' : '${el.sixGhzPrimaryChannel}',
          messageKey: 'scan.ie.sixGhzPrimary',
        ),
        _leaf(
          '$rootKey.ccfs0',
          'Center freq segment 0',
          el.ccfs0 == null ? '—' : '${el.ccfs0}',
          messageKey: 'scan.ie.ccfs0',
        ),
        rawChild,
      ]);
    case IeKind.ehtCapabilities:
      return _branch(rootKey, title, null, [
        _leaf(
          '$rootKey.nss',
          'Spatial streams',
          el.nss == null ? '—' : '${el.nss}',
          messageKey: 'scan.ie.spatialStreams',
        ),
        _leaf(
          '$rootKey.maxMcs',
          'Max MCS (≤80 MHz)',
          el.maxMcs == null ? '—' : '${el.maxMcs}',
          messageKey: 'scan.ie.maxMcs80',
        ),
        rawChild,
      ]);
    case IeKind.unknown:
      return _branch(rootKey, title, null, [rawChild]);
  }
}

List<IeTreeNode> buildIeTree(IeDecodeResult result) {
  final meta = <IeTreeNode>[
    _leaf(
      'meta.level',
      'Parse level',
      result.level.wire,
      messageKey: 'scan.ie.parseLevel',
    ),
    _leaf(
      'meta.length',
      'Byte length',
      '${result.byteLength}',
      messageKey: 'scan.ie.byteLength',
    ),
    _leaf(
      'meta.count',
      'Element count',
      '${result.elements.length}',
      messageKey: 'scan.ie.elementCount',
    ),
  ];
  final elements = [
    for (var i = 0; i < result.elements.length; i++)
      _treeForElement(i, result.elements[i]),
  ];
  return [...meta, ...elements];
}

bool isElementRootTreeKey(String key) {
  return RegExp(r'^ie\.\d+$').hasMatch(key);
}
