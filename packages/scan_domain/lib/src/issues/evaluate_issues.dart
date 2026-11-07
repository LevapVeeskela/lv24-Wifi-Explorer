import '../channel.dart';
import '../phy.dart';
import '../security.dart';
import 'dfs.dart';
import 'thresholds.dart';
import 'types.dart';

const _legacyPhy = {PhyLetter.a, PhyLetter.b, PhyLetter.g};

int? _channelWidthMhz(Object width) {
  if (width == unknownWidth) return null;
  if (width is ChannelWidthMhz) return width.asInt;
  return null;
}

bool _isWidth40On24(ScanIssueBss bss) {
  if (bss.channel.band != WifiBand.ghz24) return false;
  final w = _channelWidthMhz(bss.channel.widthMhz);
  return w != null && w >= scanIssueThresholds.band24MinWidthMhz;
}

bool _isOverlap24(ScanIssueBss bss) {
  if (bss.channel.band != WifiBand.ghz24) return false;
  final ch = bss.channel.number;
  if (nonOverlapping24Channels.contains(ch)) return false;
  if (ch == 14 && bss.countryCode?.toUpperCase() == 'JP') return false;
  return true;
}

int _countOverlappingNeighbors(
  ScanIssueBss bss,
  List<ScanIssueBss> neighbors,
) {
  var count = 0;
  for (final other in neighbors) {
    if (identical(other, bss)) continue;
    if (other.channel.band != bss.channel.band || bss.channel.band == null) {
      continue;
    }
    if (primaryChannelsOverlap(
      (number: bss.channel.number, widthMhz: bss.channel.widthMhz),
      (number: other.channel.number, widthMhz: other.channel.widthMhz),
    )) {
      count += 1;
    }
  }
  return count;
}

bool _isCrowdedChannel(
  ScanIssueBss bss,
  List<ScanIssueBss> neighbors,
  int minNeighbors,
) {
  return _countOverlappingNeighbors(bss, neighbors) >= minNeighbors;
}

bool _isLowSignal(ScanIssueBss bss) {
  return bss.signal.rssiDbm < scanIssueThresholds.lowSignalRssiDbm;
}

bool _isLowSnr(ScanIssueBss bss) {
  final snr = bss.signal.snrDb;
  if (snr == null) return false;
  return snr < scanIssueThresholds.lowSnrDb;
}

bool _isWeakSecurity(ScanIssueBss bss) {
  if (bss.security.isOpen || bss.security.primary == SecurityKind.open) {
    return true;
  }
  if (bss.security.primary == SecurityKind.wep) return true;
  if (bss.tkipOnly == true) return true;
  return false;
}

bool _isLegacyOnly(ScanIssueBss bss) {
  final highest = bss.phy.highest;
  if (highest == null) return false;
  return _legacyPhy.contains(highest);
}

bool _isHighUtil(ScanIssueBss bss) {
  final util = bss.channelUtilPct;
  if (util == null) return false;
  return util >= scanIssueThresholds.highUtilPct;
}

bool _isDfs(ScanIssueBss bss) {
  if (bss.isDfs is bool) return bss.isDfs!;
  return inferDfsChannel(bss.channel.band, bss.channel.number);
}

IssueFlag _flag(ScanIssueId id, IssueSeverity severity) {
  return IssueFlag(
    id: id,
    severity: severity,
    i18nKey: scanIssueMessageKey(id),
  );
}

List<IssueFlag> evaluateIssues(
  ScanIssueBss bss,
  List<ScanIssueBss> neighbors, [
  EvaluateIssuesOptions? options,
]) {
  final crowdedMin = options?.crowdedChannelMinNeighbors ??
      scanIssueThresholds.crowdedChannelMinNeighbors;

  final issues = <IssueFlag>[];

  if (_isWidth40On24(bss)) {
    issues.add(_flag(ScanIssueId.width40on24, IssueSeverity.warning));
  }
  if (_isOverlap24(bss)) {
    issues.add(_flag(ScanIssueId.overlap24, IssueSeverity.warning));
  }
  if (_isCrowdedChannel(bss, neighbors, crowdedMin)) {
    issues.add(_flag(ScanIssueId.crowdedChannel, IssueSeverity.warning));
  }
  if (_isLowSignal(bss)) {
    issues.add(_flag(ScanIssueId.lowSignal, IssueSeverity.warning));
  }
  if (_isLowSnr(bss)) {
    issues.add(_flag(ScanIssueId.lowSnr, IssueSeverity.warning));
  }
  if (_isWeakSecurity(bss)) {
    issues.add(_flag(ScanIssueId.weakSecurity, IssueSeverity.warning));
  }
  if (bss.hiddenSsid) {
    issues.add(_flag(ScanIssueId.hiddenSsid, IssueSeverity.warning));
  }
  if (_isLegacyOnly(bss)) {
    issues.add(_flag(ScanIssueId.legacyOnly, IssueSeverity.warning));
  }
  if (_isHighUtil(bss)) {
    issues.add(_flag(ScanIssueId.highUtil, IssueSeverity.warning));
  }
  if (_isDfs(bss)) {
    issues.add(_flag(ScanIssueId.dfs, IssueSeverity.info));
  }

  return issues;
}
