import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_issues/compute_issue_keys.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_networks.dart';
import 'package:lv24_wifi_explorer/shared/i18n/app_localizations.dart';
import 'package:lv24_wifi_explorer/widgets/details/advanced_details_tab.dart';
import 'package:lv24_wifi_explorer/widgets/scan_issue_chips.dart';
import 'package:scan_domain/scan_domain.dart';
import 'package:scan_l10n/scan_l10n.dart';

ObservedBss _tripleIssueBss() {
  return mapFallback(
    [
      const CoreWlanNetworkRecord(
        ssid: null,
        ssidData: [],
        bssid: '00:11:22:33:44:66',
        rssiDbm: -82,
        noiseDbm: -96,
        channelNumber: 3,
        channelBand: CoreWlanChannelBand.ghz2,
        channelWidth: CoreWlanChannelWidth.mhz20,
        countryCode: 'RU',
        beaconIntervalMs: 100,
        ibss: false,
        informationElementData: [0, 0],
        supportedSecurity: [SecurityKind.wpa2Personal],
        supportedPhyModes: [PhyLetter.n],
      ),
    ],
    '2026-09-17T20:00:00.000Z',
  ).single;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('demo + channel-3 hidden row expose MVP issue keys', () {
    final networks = bundledDemoObservedBss();
    final harbor = networks.firstWhere((n) => n.lastRaw.ssid == 'Harbor-IoT');
    final hidden = networks.firstWhere((n) => n.lastRaw.ssid == null);
    final overlap = _tripleIssueBss();

    expect(computeIssueKeys(harbor, networks), contains('scan.issue.lowSignal'));
    expect(computeIssueKeys(hidden, networks), contains('scan.issue.hiddenSsid'));
    expect(
      computeIssueKeys(overlap, [overlap]),
      containsAll([
        'scan.issue.lowSignal',
        'scan.issue.overlap24',
        'scan.issue.hiddenSsid',
      ]),
    );
  });

  testWidgets('issues accordion shows scan_l10n labels for MVP keys', (tester) async {
    final bss = _tripleIssueBss();
    final en = ScanL10n(ScanLocale.en);
    final l10n = lookupAppLocalizations(const Locale('en'));

    tester.view.physicalSize = const Size(800, 2000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(
          body: SingleChildScrollView(
            child: AdvancedDetailsTab(bss: bss, allBss: [bss]),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.widgetWithText(ExpansionTile, l10n.scanAdvIssues));
    await tester.pumpAndSettle();

    expect(find.byType(ScanIssueChips), findsOneWidget);
    expect(find.text(en.issue('lowSignal')), findsOneWidget);
    expect(find.text(en.issue('overlap24')), findsOneWidget);
    expect(find.text(en.issue('hiddenSsid')), findsOneWidget);
  });
}
