import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_sunset_theme/lv24_sunset_theme.dart';
import 'package:lv24_wifi_explorer/features/annotations/string_storage.dart';
import 'package:lv24_wifi_explorer/features/onboarding/onboarding.dart';
import 'package:lv24_wifi_explorer/features/scan_degradation/scan_degradation.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_scan_session.dart';
import 'package:lv24_wifi_explorer/shared/i18n/app_localizations.dart';
import 'package:lv24_wifi_explorer/widgets/location_banner.dart';
import 'package:scan_domain/scan_domain.dart';
import 'package:scan_l10n/scan_l10n.dart';

Widget _harness(Widget child, {Locale locale = const Locale('en')}) {
  return MaterialApp(
    theme: AppTheme.light,
    locale: locale,
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: scanSupportedLocales,
    home: Scaffold(body: child),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late AppLocalizations en;

  setUp(() {
    en = lookupAppLocalizations(const Locale('en'));
  });

  test('shouldOfferLocationOnboarding matches first-run / denied', () {
    expect(
      shouldOfferLocationOnboarding(
        input: const LocationOnboardingOfferInput(
          locationNeedsSheet: true,
          dismissed: false,
        ),
      ),
      isTrue,
    );
    expect(
      shouldOfferLocationOnboarding(
        input: const LocationOnboardingOfferInput(
          locationNeedsSheet: true,
          dismissed: true,
        ),
      ),
      isFalse,
    );
    expect(
      shouldOfferLocationOnboarding(
        input: const LocationOnboardingOfferInput(
          locationNeedsSheet: true,
          dismissed: false,
          viewingSnapshot: true,
        ),
      ),
      isFalse,
    );
    expect(
      locationNeedsOnboardingSheet(LocationAuthorization.restricted),
      isFalse,
    );
    expect(
      locationNeedsOnboardingSheet(LocationAuthorization.granted),
      isFalse,
    );
  });

  test('dismissed store persists Electron localStorage key', () {
    final storage = InMemoryStringStorage();
    final store = LocationOnboardingDismissedStore(storage: storage);
    expect(store.dismissed, isFalse);
    store.dismiss();
    expect(store.dismissed, isTrue);
    expect(storage.read(locationOnboardingDismissedStorageKey), '1');
    expect(
      LocationOnboardingDismissedStore(storage: storage).dismissed,
      isTrue,
    );
  });

  test('platform copy is honest per target', () {
    expect(
      LocationPlatformCopy(en, LocationPlatformKind.ios).title,
      en.permissionsPlatformIosTitle,
    );
    expect(
      LocationPlatformCopy(en, LocationPlatformKind.android).body,
      contains('WifiManager'),
    );
    expect(
      LocationPlatformCopy(en, LocationPlatformKind.linux).body,
      contains('D-Bus'),
    );
    expect(
      LocationPlatformCopy(en, LocationPlatformKind.macos).body,
      contains('ScanCore'),
    );
    expect(
      locationPlatformKindFor(TargetPlatform.iOS),
      LocationPlatformKind.ios,
    );
    expect(
      LocationPlatformCopy(en, LocationPlatformKind.windows).body,
      contains('WlanQueryInterface'),
    );
    expect(
      locationPlatformKindFor(TargetPlatform.windows),
      LocationPlatformKind.windows,
    );
    expect(
      LocationPlatformCopy(en, LocationPlatformKind.other).settingsHint,
      contains('associated-link'),
    );
    expect(
      LocationPlatformCopy(en, LocationPlatformKind.other).settingsHint,
      isNot(contains('WLAN adapter')),
    );
    expect(en.scanDemoBanner, contains('Windows'));
    expect(en.scanDegradedDemoBody, contains('Windows'));
  });

  test('scanDegradationFrom prefers adapter limits over demo', () {
    expect(scanDegradationFrom(demo: true), ScanDegradation.demoFallback);
    expect(
      scanDegradationFrom(demo: true, viewingSnapshot: true),
      ScanDegradation.demoFallback,
    );
    expect(
      scanDegradationFrom(demo: false, iosConnectedOnly: true),
      ScanDegradation.iosConnectedOnly,
    );
    expect(
      scanDegradationFrom(demo: false, androidThrottled: true),
      ScanDegradation.androidThrottled,
    );
    expect(
      scanDegradationFrom(demo: false, linuxConnectedOnly: true),
      ScanDegradation.linuxNmLimited,
    );
    expect(
      scanDegradationFrom(demo: false, windowsConnectedOnly: true),
      ScanDegradation.windowsConnectedOnly,
    );
    expect(
      scanDegradationFrom(demo: true, windowsConnectedOnly: true),
      ScanDegradation.windowsConnectedOnly,
    );
    expect(scanDegradationFrom(demo: false), ScanDegradation.none);
  });

  test('demo session does not fake Location granted from fixtures', () {
    final session = DemoScanSession(liveScan: false);
    addTearDown(session.dispose);
    expect(session.demo, isTrue);
    expect(session.location, LocationAuthorization.notDetermined);
    expect(session.rows, isNotEmpty);
  });

  testWidgets('first-run sheet explains macOS CoreLocation and continues', (
    tester,
  ) async {
    var continued = 0;
    await tester.pumpWidget(
      _harness(
        LocationOnboardingSheet(
          location: LocationAuthorization.notDetermined,
          platform: TargetPlatform.macOS,
          onClose: () {},
          onContinue: () => continued++,
        ),
      ),
    );

    expect(
      find.byKey(const ValueKey('location-onboarding-sheet')),
      findsOneWidget,
    );
    expect(find.text(en.permissionsPlatformMacosTitle), findsOneWidget);
    expect(find.text(en.permissionsPlatformMacosBody), findsOneWidget);
    expect(find.text(en.permissionsOnboardingBody), findsOneWidget);
    await tester.tap(
      find.byKey(const ValueKey('location-onboarding-continue')),
    );
    expect(continued, 1);
  });

  testWidgets('denied sheet has settings + retry on Android', (tester) async {
    await tester.binding.setSurfaceSize(const Size(800, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    var settings = 0;
    var retry = 0;
    await tester.pumpWidget(
      _harness(
        LocationOnboardingSheet(
          location: LocationAuthorization.denied,
          platform: TargetPlatform.android,
          canOpenSettings: true,
          onOpenLocationSettings: () => settings++,
          onClose: () {},
          onContinue: () {},
          onRetry: () => retry++,
        ),
      ),
    );

    expect(find.text(en.permissionsDeniedTitle), findsOneWidget);
    expect(find.text(en.permissionsPlatformAndroidBody), findsOneWidget);
    await tester.tap(
      find.byKey(const ValueKey('location-onboarding-settings')),
    );
    await tester.tap(find.byKey(const ValueKey('location-onboarding-retry')));
    expect(settings, 1);
    expect(retry, 1);
  });

  testWidgets('denied sheet has settings + retry on Windows', (tester) async {
    await tester.binding.setSurfaceSize(const Size(800, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    var settings = 0;
    var retry = 0;
    await tester.pumpWidget(
      _harness(
        LocationOnboardingSheet(
          location: LocationAuthorization.denied,
          platform: TargetPlatform.windows,
          canOpenSettings: true,
          onOpenLocationSettings: () => settings++,
          onClose: () {},
          onContinue: () {},
          onRetry: () => retry++,
        ),
      ),
    );

    expect(find.text(en.permissionsDeniedTitle), findsOneWidget);
    expect(find.text(en.permissionsPlatformWindowsBody), findsOneWidget);
    expect(
      find.byKey(const ValueKey('location-onboarding-settings')),
      findsOneWidget,
    );
    await tester.tap(
      find.byKey(const ValueKey('location-onboarding-settings')),
    );
    await tester.tap(find.byKey(const ValueKey('location-onboarding-retry')));
    expect(settings, 1);
    expect(retry, 1);
  });

  testWidgets('LocationOnboarding presents then persists Later', (
    tester,
  ) async {
    final store = LocationOnboardingDismissedStore(
      storage: InMemoryStringStorage(),
    );
    await tester.pumpWidget(
      _harness(
        LocationOnboarding(
          location: LocationAuthorization.notDetermined,
          dismissedStore: store,
          platform: TargetPlatform.linux,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.byKey(const ValueKey('location-onboarding-sheet')),
      findsOneWidget,
    );
    expect(find.text(en.permissionsPlatformLinuxTitle), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('location-onboarding-later')));
    await tester.pumpAndSettle();
    expect(store.dismissed, isTrue);
    expect(
      find.byKey(const ValueKey('location-onboarding-sheet')),
      findsNothing,
    );
  });

  testWidgets('denied banner stays up in demo and can open settings', (
    tester,
  ) async {
    var settings = 0;
    var retry = 0;
    await tester.pumpWidget(
      _harness(
        LocationBanner(
          location: LocationAuthorization.denied,
          demoMode: true,
          platform: TargetPlatform.iOS,
          onOpenLocationSettings: () => settings++,
          onRetry: () => retry++,
        ),
      ),
    );

    expect(
      find.byKey(const ValueKey('location-banner-denied')),
      findsOneWidget,
    );
    expect(
      find.byKey(const ValueKey('scan-degradation-banner-demoFallback')),
      findsOneWidget,
    );
    expect(find.text(en.permissionsPlatformIosBody), findsOneWidget);
    expect(find.text(en.scanDegradedDemoTitle), findsOneWidget);
    await tester.tap(find.text(en.permissionsOpenSettings));
    await tester.tap(find.text(en.onboardingLocationRetry));
    expect(settings, 1);
    expect(retry, 1);
  });

  testWidgets('android throttle banner is persistent', (tester) async {
    await tester.pumpWidget(
      _harness(
        const LocationBanner(
          location: LocationAuthorization.granted,
          degradation: ScanDegradation.androidThrottled,
        ),
      ),
    );

    expect(
      find.byKey(const ValueKey('scan-degradation-banner-androidThrottled')),
      findsOneWidget,
    );
    expect(find.text(en.scanDegradedAndroidThrottledTitle), findsOneWidget);
    expect(find.text(en.scanDegradedAndroidThrottledBody), findsOneWidget);
  });

  testWidgets('windows associated-link banner is persistent', (tester) async {
    await tester.pumpWidget(
      _harness(
        const LocationBanner(
          location: LocationAuthorization.granted,
          degradation: ScanDegradation.windowsConnectedOnly,
        ),
      ),
    );

    expect(
      find.byKey(
        const ValueKey('scan-degradation-banner-windowsConnectedOnly'),
      ),
      findsOneWidget,
    );
    expect(find.text(en.scanDegradedWindowsConnectedOnlyTitle), findsOneWidget);
    expect(find.text(en.scanDegradedWindowsConnectedOnlyBody), findsOneWidget);
    expect(
      find.byKey(const ValueKey('scan-degradation-banner-demoFallback')),
      findsNothing,
    );
  });

  testWidgets('granted + live has no honesty strips', (tester) async {
    await tester.pumpWidget(
      _harness(
        const LocationBanner(
          location: LocationAuthorization.granted,
          degradation: ScanDegradation.none,
        ),
      ),
    );
    expect(
      find.byKey(const ValueKey('location-honesty-banners')),
      findsNothing,
    );
  });
}
