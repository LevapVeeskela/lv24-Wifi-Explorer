import '../channel.dart';
import '../phy.dart';
import '../security.dart';

enum ScanIssueId {
  width40on24,
  overlap24,
  crowdedChannel,
  lowSignal,
  lowSnr,
  weakSecurity,
  hiddenSsid,
  legacyOnly,
  highUtil,
  dfs,
}

enum IssueSeverity { warning, info }

class IssueFlag {
  const IssueFlag({
    required this.id,
    required this.severity,
    required this.i18nKey,
  });

  final ScanIssueId id;
  final IssueSeverity severity;
  final String i18nKey;
}

class ScanIssueChannel {
  const ScanIssueChannel({
    required this.band,
    required this.number,
    required this.widthMhz,
  });

  final WifiBand? band;
  final int number;
  final Object widthMhz;
}

class ScanIssueSignal {
  const ScanIssueSignal({required this.rssiDbm, required this.snrDb});
  final double rssiDbm;
  final double? snrDb;
}

class ScanIssueSecurity {
  const ScanIssueSecurity({required this.primary, required this.isOpen});
  final SecurityKind primary;
  final bool isOpen;
}

class ScanIssuePhy {
  const ScanIssuePhy({required this.highest, required this.supported});
  final PhyLetter? highest;
  final List<PhyLetter> supported;
}

class ScanIssueBss {
  const ScanIssueBss({
    required this.channel,
    required this.signal,
    required this.security,
    required this.hiddenSsid,
    required this.phy,
    this.channelUtilPct,
    this.isDfs,
    this.countryCode,
    this.tkipOnly,
  });

  final ScanIssueChannel channel;
  final ScanIssueSignal signal;
  final ScanIssueSecurity security;
  final bool hiddenSsid;
  final ScanIssuePhy phy;
  final int? channelUtilPct;
  final bool? isDfs;
  final String? countryCode;
  final bool? tkipOnly;
}

class EvaluateIssuesOptions {
  const EvaluateIssuesOptions({this.crowdedChannelMinNeighbors});
  final int? crowdedChannelMinNeighbors;
}

String scanIssueMessageKey(ScanIssueId id) {
  return 'scan.issue.${id.name}';
}
