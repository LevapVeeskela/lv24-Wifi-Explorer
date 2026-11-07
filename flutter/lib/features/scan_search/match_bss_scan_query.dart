import 'package:scan_domain/scan_domain.dart';

import 'scan_query_ast.dart';

class ScanSearchMatchContext {
  const ScanSearchMatchContext({this.annotation, this.apName});

  final String? annotation;
  final String? apName;
}

bool matchBssScanQuery(
  ObservedBss bss,
  ScanQueryAst ast, [
  ScanSearchMatchContext ctx = const ScanSearchMatchContext(),
]) {
  switch (ast.type) {
    case ScanQueryAstType.all:
      return true;
    case ScanQueryAstType.not:
      return !matchBssScanQuery(bss, ast.inner!, ctx);
    case ScanQueryAstType.boolNode:
      final left = ast.left!;
      final right = ast.right!;
      return ast.boolOp == 'and'
          ? matchBssScanQuery(bss, left, ctx) && matchBssScanQuery(bss, right, ctx)
          : matchBssScanQuery(bss, left, ctx) || matchBssScanQuery(bss, right, ctx);
    case ScanQueryAstType.pred:
      return _matchPredicate(bss, ast.pred!, ctx);
  }
}

bool _compareNum(CompareOp op, num left, num right) {
  return switch (op) {
    CompareOp.gte => left >= right,
    CompareOp.lte => left <= right,
    CompareOp.gt => left > right,
    CompareOp.lt => left < right,
    CompareOp.eq => left == right,
  };
}

String _fold(String s) => s.toLowerCase();

List<String> _ssidFields(ObservedBss bss, ScanSearchMatchContext ctx) {
  final out = <String>[];
  final gated = bss.identity.ssid;
  if (gated is LocationAvailable<SsidIdentity>) {
    final id = gated.value;
    if (id.displayName.isNotEmpty) out.add(id.displayName);
    final utf8 = id.utf8;
    if (utf8 != null && utf8.isNotEmpty) out.add(utf8);
  }
  if (ctx.annotation != null && ctx.annotation!.isNotEmpty) {
    out.add(ctx.annotation!);
  }
  if (ctx.apName != null && ctx.apName!.isNotEmpty) {
    out.add(ctx.apName!);
  }
  final vendor = bss.vendor.organization;
  if (vendor != null && vendor.isNotEmpty) out.add(vendor);
  return out;
}

String? _bssidNormalized(ObservedBss bss) {
  final gated = bss.identity.bssid;
  if (gated is! LocationAvailable<String>) return null;
  return gated.value.toLowerCase();
}

bool _isHidden(ObservedBss bss) {
  final gated = bss.identity.ssid;
  if (gated is! LocationAvailable<SsidIdentity>) return false;
  return gated.value.hidden;
}

double _rssiToPercent(double rssiDbm) {
  final clamped = rssiDbm.clamp(-100.0, -30.0);
  return ((clamped + 100) / 70) * 100;
}

String securityKindWire(SecurityKind kind) {
  return switch (kind) {
    SecurityKind.open => 'open',
    SecurityKind.wep => 'wep',
    SecurityKind.wpaPersonal => 'wpa-personal',
    SecurityKind.wpaPersonalMixed => 'wpa-personal-mixed',
    SecurityKind.wpa2Personal => 'wpa2-personal',
    SecurityKind.wpa3Personal => 'wpa3-personal',
    SecurityKind.wpa3Transition => 'wpa3-transition',
    SecurityKind.personalGeneric => 'personal-generic',
    SecurityKind.dynamicWep => 'dynamic-wep',
    SecurityKind.wpaEnterprise => 'wpa-enterprise',
    SecurityKind.wpaEnterpriseMixed => 'wpa-enterprise-mixed',
    SecurityKind.wpa2Enterprise => 'wpa2-enterprise',
    SecurityKind.wpa3Enterprise => 'wpa3-enterprise',
    SecurityKind.enterpriseGeneric => 'enterprise-generic',
    SecurityKind.owe => 'owe',
    SecurityKind.oweTransition => 'owe-transition',
    SecurityKind.unknown => 'unknown',
  };
}

bool _flagHas(ObservedBss bss, bool Function(String wire) test) {
  return bss.security.flags.any((f) => test(securityKindWire(f)));
}

String? _phyLetterFromShortcut(String token) {
  return switch (token) {
    'a' => 'a',
    'b' => 'b',
    'g' => 'g',
    'n' || '11n' || '802.11n' => 'n',
    'ac' || '11ac' || '802.11ac' => 'ac',
    'ax' || '11ax' || '802.11ax' => 'ax',
    'be' || '11be' || '802.11be' => 'be',
    '802.11a' => 'a',
    '802.11b' => 'b',
    '802.11g' => 'g',
    _ => null,
  };
}

bool _matchesSecurity(ObservedBss bss, String token) {
  switch (token) {
    case 'open':
      return bss.security.isOpen;
    case 'secure':
      return bss.security.isSecure;
    case 'wep':
      return _flagHas(bss, (f) => f == 'wep');
    case 'wpa':
      return _flagHas(bss, (f) => f.contains('wpa'));
    case 'wpa2':
      return _flagHas(bss, (f) => f.contains('wpa2'));
    case 'wpa3':
      return _flagHas(bss, (f) => f.contains('wpa3'));
    case 'owe':
      return _flagHas(bss, (f) => f == 'owe' || f == 'owe-transition');
    case '802.1x':
      return _flagHas(bss, (f) => f.contains('enterprise'));
    case 'psk':
      return _flagHas(bss, (f) => f.contains('personal') || f == 'personal-generic');
    case 'sae':
      return _flagHas(
        bss,
        (f) => f == 'wpa3-personal' || f == 'wpa3-transition',
      );
    default:
      return false;
  }
}

bool _matchesGeneration(ObservedBss bss, String gen) {
  final highest = bss.phy.highest;
  final band = bss.channel.band;
  return switch (gen) {
    'wifi7' => highest == PhyLetter.be,
    'wifi6e' => highest == PhyLetter.ax && band == WifiBand.ghz6,
    'wifi6' => highest == PhyLetter.ax,
    'wifi5' => highest == PhyLetter.ac,
    'wifi4' => highest == PhyLetter.n,
    _ => false,
  };
}

double? _bandGhz(WifiBand? band) => band?.asDouble;

int? _widthMhz(Object widthMhz) {
  if (widthMhz == unknownWidth) return null;
  if (widthMhz is ChannelWidthMhz) return widthMhz.asInt;
  return null;
}

double? _parseKeyedBand(String value) {
  final w = _fold(value);
  if (w == '2.4' || w == '24' || w == '2.4ghz' || w == '24ghz') return 2.4;
  if (w == '5' || w == '5ghz') return 5;
  if (w == '6' || w == '6ghz') return 6;
  return null;
}

bool _matchKeyed(
  ObservedBss bss,
  String field,
  CompareOp? op,
  String value,
  ScanSearchMatchContext ctx,
) {
  switch (field) {
    case 'ssid':
      final hay = _ssidFields(bss, ctx).join(' ').toLowerCase();
      final needle = _fold(value);
      if (op == CompareOp.eq) {
        return hay == needle ||
            _ssidFields(bss, ctx).any((s) => _fold(s) == needle);
      }
      return hay.contains(needle);
    case 'bssid':
      final mac = _bssidNormalized(bss);
      if (mac == null) return false;
      final needle = _fold(value.replaceAll('-', ':'));
      return mac.contains(needle);
    case 'vendor':
      final org = bss.vendor.organization;
      if (org == null) return false;
      return _fold(org).contains(_fold(value));
    case 'channel':
      final ch = bss.channel.number;
      final range = RegExp(r'^(\d+)\s*-\s*(\d+)$').firstMatch(value);
      if (range != null) {
        final from = int.parse(range.group(1)!);
        final to = int.parse(range.group(2)!);
        final lo = from < to ? from : to;
        final hi = from < to ? to : from;
        return ch >= lo && ch <= hi;
      }
      final n = int.tryParse(value);
      if (n == null) return false;
      if (op != null) return _compareNum(op, ch, n);
      return ch == n;
    case 'width':
      final w = _widthMhz(bss.channel.widthMhz);
      if (w == null) return false;
      final n = int.tryParse(value);
      if (n == null) return false;
      if (op != null) return _compareNum(op, w, n);
      return w == n;
    case 'band':
      final parsed = _parseKeyedBand(value);
      if (parsed == null) return false;
      return _bandGhz(bss.channel.band) == parsed;
    case 'snr':
      final snr = bss.signal.snrDb;
      if (snr == null || op == null) return false;
      return _compareNum(op, snr, double.parse(value));
    case 'signal':
      if (op == null) return false;
      if (value.endsWith('%')) {
        final n = double.tryParse(value.substring(0, value.length - 1));
        if (n == null) return false;
        return _compareNum(op, _rssiToPercent(bss.signal.rssiDbm), n);
      }
      final n = double.tryParse(value);
      if (n == null) return false;
      return _compareNum(op, bss.signal.rssiDbm, n);
    case 'noise':
      final noise = bss.signal.noiseDbm;
      if (noise == null || op == null) return false;
      return _compareNum(op, noise, double.parse(value));
    case 'country':
      switch (bss.countryCode) {
        case LocationAvailable(value: final code):
          if (code == null || code.isEmpty) return false;
          return _fold(code) == _fold(value);
        default:
          return false;
      }
    case 'mode':
      final letter = _phyLetterFromShortcut(value) ?? _fold(value);
      final phy = phyLetterFromString(letter);
      if (phy == null) return false;
      return bss.phy.supported.contains(phy);
    default:
      return false;
  }
}

bool _matchPredicate(
  ObservedBss bss,
  ScanPredicate pred,
  ScanSearchMatchContext ctx,
) {
  switch (pred.kind) {
    case ScanPredicateKind.keyword:
      final hay = _ssidFields(bss, ctx).join(' ').toLowerCase();
      return hay.contains(_fold(pred.text!));
    case ScanPredicateKind.phrase:
      final needle = _fold(pred.text!);
      return _ssidFields(bss, ctx).any((field) => _fold(field) == needle);
    case ScanPredicateKind.band:
      return _bandGhz(bss.channel.band) == pred.band;
    case ScanPredicateKind.width:
      return _widthMhz(bss.channel.widthMhz) == pred.mhz;
    case ScanPredicateKind.channel:
      return bss.channel.number == pred.channel;
    case ScanPredicateKind.channelRange:
      final lo = pred.channelFrom! < pred.channelTo! ? pred.channelFrom! : pred.channelTo!;
      final hi = pred.channelFrom! < pred.channelTo! ? pred.channelTo! : pred.channelFrom!;
      final ch = bss.channel.number;
      return ch >= lo && ch <= hi;
    case ScanPredicateKind.bssidOctet:
      final mac = _bssidNormalized(bss);
      if (mac == null) return false;
      final fragment = pred.bssidFragment!.replaceAll('-', ':');
      return mac.replaceAll('-', ':').contains(fragment);
    case ScanPredicateKind.signal:
      return _compareNum(pred.compareOp!, bss.signal.rssiDbm, pred.valueDbm!);
    case ScanPredicateKind.signalPct:
      return _compareNum(
        pred.compareOp!,
        _rssiToPercent(bss.signal.rssiDbm),
        pred.valuePct!,
      );
    case ScanPredicateKind.security:
      return _matchesSecurity(bss, pred.securityToken!);
    case ScanPredicateKind.phy:
      final letter = _phyLetterFromShortcut(pred.phyToken!);
      if (letter == null) return false;
      final phy = phyLetterFromString(letter);
      if (phy == null) return false;
      return bss.phy.supported.contains(phy);
    case ScanPredicateKind.generation:
      return _matchesGeneration(bss, pred.generation!);
    case ScanPredicateKind.hidden:
      return _isHidden(bss);
    case ScanPredicateKind.keyed:
      return _matchKeyed(
        bss,
        pred.keyedField!,
        pred.compareOp,
        pred.keyedValue!,
        ctx,
      );
  }
}
