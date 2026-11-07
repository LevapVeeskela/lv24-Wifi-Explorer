import 'package:scan_domain/scan_domain.dart';
import 'package:test/test.dart';

import 'test_support.dart';

void main() {
  group('evaluateIssues', () {
    test('flags width40on24 when 2.4 GHz width is at least 40 MHz', () {
      expect(
        issueIds(issueBssWith(
          channel: const ScanIssueChannel(
            band: WifiBand.ghz24,
            number: 6,
            widthMhz: ChannelWidthMhz.mhz40,
          ),
        )),
        contains(ScanIssueId.width40on24),
      );
      expect(
        issueIds(issueBssWith(
          channel: const ScanIssueChannel(
            band: WifiBand.ghz5,
            number: 36,
            widthMhz: ChannelWidthMhz.mhz40,
          ),
        )),
        isNot(contains(ScanIssueId.width40on24)),
      );
    });

    test('flags overlap24 for non 1/6/11 on 2.4 GHz', () {
      expect(
        issueIds(issueBssWith(
          channel: const ScanIssueChannel(
            band: WifiBand.ghz24,
            number: 3,
            widthMhz: ChannelWidthMhz.mhz20,
          ),
        )),
        contains(ScanIssueId.overlap24),
      );
      expect(
        issueIds(issueBssWith(
          channel: const ScanIssueChannel(
            band: WifiBand.ghz24,
            number: 6,
            widthMhz: ChannelWidthMhz.mhz20,
          ),
        )),
        isNot(contains(ScanIssueId.overlap24)),
      );
    });

    test('skips overlap24 for Japan channel 14', () {
      final jp = issueBssWith(
        channel: const ScanIssueChannel(
          band: WifiBand.ghz24,
          number: 14,
          widthMhz: ChannelWidthMhz.mhz20,
        ),
        countryCode: 'JP',
      );
      expect(issueIds(jp), isNot(contains(ScanIssueId.overlap24)));

      final nonJp = issueBssWith(
        channel: const ScanIssueChannel(
          band: WifiBand.ghz24,
          number: 14,
          widthMhz: ChannelWidthMhz.mhz20,
        ),
        countryCode: 'US',
      );
      expect(issueIds(nonJp), contains(ScanIssueId.overlap24));
    });

    test('flags crowdedChannel when enough overlapping neighbors', () {
      final self = issueBssWith(
        channel: const ScanIssueChannel(
          band: WifiBand.ghz24,
          number: 6,
          widthMhz: ChannelWidthMhz.mhz20,
        ),
      );
      final neighbors = [
        issueBssWith(
          channel: const ScanIssueChannel(
            band: WifiBand.ghz24,
            number: 4,
            widthMhz: ChannelWidthMhz.mhz20,
          ),
        ),
        issueBssWith(
          channel: const ScanIssueChannel(
            band: WifiBand.ghz24,
            number: 5,
            widthMhz: ChannelWidthMhz.mhz20,
          ),
        ),
        issueBssWith(
          channel: const ScanIssueChannel(
            band: WifiBand.ghz24,
            number: 7,
            widthMhz: ChannelWidthMhz.mhz20,
          ),
        ),
        issueBssWith(
          channel: const ScanIssueChannel(
            band: WifiBand.ghz24,
            number: 8,
            widthMhz: ChannelWidthMhz.mhz20,
          ),
        ),
      ];
      expect(issueIds(self, neighbors), contains(ScanIssueId.crowdedChannel));
      expect(
        evaluateIssues(self, neighbors.sublist(0, 3), const EvaluateIssuesOptions(crowdedChannelMinNeighbors: 4))
            .map((f) => f.id),
        isNot(contains(ScanIssueId.crowdedChannel)),
      );
      expect(
        evaluateIssues(self, neighbors.sublist(0, 3), const EvaluateIssuesOptions(crowdedChannelMinNeighbors: 3))
            .map((f) => f.id),
        contains(ScanIssueId.crowdedChannel),
      );
    });

    test('uses open thresholds for low signal and SNR', () {
      expect(
        issueIds(issueBssWith(signal: const ScanIssueSignal(rssiDbm: -71, snrDb: 40))),
        contains(ScanIssueId.lowSignal),
      );
      expect(
        issueIds(issueBssWith(signal: const ScanIssueSignal(rssiDbm: -70, snrDb: 40))),
        isNot(contains(ScanIssueId.lowSignal)),
      );
      expect(
        issueIds(issueBssWith(signal: const ScanIssueSignal(rssiDbm: -55, snrDb: 24))),
        contains(ScanIssueId.lowSnr),
      );
      expect(
        issueIds(issueBssWith(signal: const ScanIssueSignal(rssiDbm: -55, snrDb: null))),
        isNot(contains(ScanIssueId.lowSnr)),
      );
      expect(scanIssueThresholds.lowSignalRssiDbm, -70);
      expect(scanIssueThresholds.lowSnrDb, 25);
    });

    test('flags weak security for open, WEP, and TKIP-only', () {
      expect(
        issueIds(issueBssWith(
          security: const ScanIssueSecurity(primary: SecurityKind.open, isOpen: true),
        )),
        contains(ScanIssueId.weakSecurity),
      );
      expect(
        issueIds(issueBssWith(
          security: const ScanIssueSecurity(primary: SecurityKind.wep, isOpen: false),
        )),
        contains(ScanIssueId.weakSecurity),
      );
      expect(issueIds(issueBssWith(tkipOnly: true)), contains(ScanIssueId.weakSecurity));
      expect(
        issueIds(issueBssWith(
          security: const ScanIssueSecurity(
            primary: SecurityKind.wpa2Personal,
            isOpen: false,
          ),
        )),
        isNot(contains(ScanIssueId.weakSecurity)),
      );
    });

    test('flags hidden SSID and legacy-only PHY', () {
      expect(issueIds(issueBssWith(hiddenSsid: true)), contains(ScanIssueId.hiddenSsid));
      expect(
        issueIds(issueBssWith(
          phy: const ScanIssuePhy(highest: PhyLetter.g, supported: [PhyLetter.b, PhyLetter.g]),
        )),
        contains(ScanIssueId.legacyOnly),
      );
      expect(
        issueIds(issueBssWith(
          phy: const ScanIssuePhy(highest: PhyLetter.n, supported: [PhyLetter.g, PhyLetter.n]),
        )),
        isNot(contains(ScanIssueId.legacyOnly)),
      );
    });

    test('flags high utilization only when present', () {
      expect(issueIds(issueBssWith(channelUtilPct: 70)), contains(ScanIssueId.highUtil));
      expect(issueIds(issueBssWith(channelUtilPct: 69)), isNot(contains(ScanIssueId.highUtil)));
      expect(issueIds(issueBssWith()), isNot(contains(ScanIssueId.highUtil)));
    });

    test('marks DFS as info severity', () {
      final flags = evaluateIssues(
        issueBssWith(
          channel: const ScanIssueChannel(
            band: WifiBand.ghz5,
            number: 52,
            widthMhz: ChannelWidthMhz.mhz20,
          ),
        ),
        const [],
      );
      final dfs = flags.firstWhere((f) => f.id == ScanIssueId.dfs);
      expect(dfs.severity, IssueSeverity.info);
      expect(dfs.i18nKey, 'scan.issue.dfs');
    });
  });
}
