import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_ru.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ru'),
    Locale('en')
  ];

  /// TS MessageKey: permissions.denied.body
  ///
  /// In en, this message translates to:
  /// **'SSID and BSSID stay redacted until you allow Location Services for this app. RF metrics may still update.'**
  String get permissionsDeniedBody;

  /// TS MessageKey: permissions.denied.title
  ///
  /// In en, this message translates to:
  /// **'Network names are hidden'**
  String get permissionsDeniedTitle;

  /// TS MessageKey: permissions.location.body
  ///
  /// In en, this message translates to:
  /// **'On macOS, Wi‑Fi network names (SSID) and hardware addresses (BSSID) are treated as location-related data. LV24 WiFi Explorer requests Location Services only to unlock those fields — not to track GPS position or show maps.'**
  String get permissionsLocationBody;

  /// TS MessageKey: permissions.location.settingsHint
  ///
  /// In en, this message translates to:
  /// **'Turn on Location Services globally, then enable LV24 WiFi Explorer in System Settings → Privacy & Security → Location Services.'**
  String get permissionsLocationSettingsHint;

  /// TS MessageKey: permissions.location.title
  ///
  /// In en, this message translates to:
  /// **'Location Services'**
  String get permissionsLocationTitle;

  /// TS MessageKey: permissions.onboarding.body
  ///
  /// In en, this message translates to:
  /// **'Active scanning can show signal and channels without Location. To list network names and MAC addresses, allow Location when prompted.'**
  String get permissionsOnboardingBody;

  /// TS MessageKey: permissions.onboarding.title
  ///
  /// In en, this message translates to:
  /// **'Wi‑Fi identity on macOS'**
  String get permissionsOnboardingTitle;

  /// TS MessageKey: permissions.openSettings
  ///
  /// In en, this message translates to:
  /// **'Open Location Settings'**
  String get permissionsOpenSettings;

  /// TS MessageKey: permissions.restricted.body
  ///
  /// In en, this message translates to:
  /// **'A device policy blocks Location Services. You can still view RF-only scan data or use demo mode where available.'**
  String get permissionsRestrictedBody;

  /// TS MessageKey: permissions.restricted.title
  ///
  /// In en, this message translates to:
  /// **'Location restricted'**
  String get permissionsRestrictedTitle;

  /// TS MessageKey: onboarding.location.continue
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get onboardingLocationContinue;

  /// TS MessageKey: onboarding.location.later
  ///
  /// In en, this message translates to:
  /// **'Not now'**
  String get onboardingLocationLater;

  /// TS MessageKey: onboarding.location.retry
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get onboardingLocationRetry;

  /// TS MessageKey: permissions.platform.android.body
  ///
  /// In en, this message translates to:
  /// **'Android treats Wi‑Fi scan results as location-related. WifiManager needs Location (and Nearby Wi‑Fi devices on Android 13+). The OS throttles startScan; this is not macOS ScanCore richness.'**
  String get permissionsPlatformAndroidBody;

  /// TS MessageKey: permissions.platform.android.settingsHint
  ///
  /// In en, this message translates to:
  /// **'Enable Location, grant this app, and keep Wi‑Fi on. Empty or stale rows usually mean the OS is throttling scans.'**
  String get permissionsPlatformAndroidSettingsHint;

  /// TS MessageKey: permissions.platform.android.title
  ///
  /// In en, this message translates to:
  /// **'Android location unlocks WifiManager results'**
  String get permissionsPlatformAndroidTitle;

  /// TS MessageKey: permissions.platform.ios.body
  ///
  /// In en, this message translates to:
  /// **'Apple does not give third-party apps a CoreWLAN-style full scan. This client can show the connected network when Location When In Use allows Wi‑Fi identity — not a roaming site survey.'**
  String get permissionsPlatformIosBody;

  /// TS MessageKey: permissions.platform.ios.settingsHint
  ///
  /// In en, this message translates to:
  /// **'Settings → Privacy & Security → Location Services → While Using. SSID and BSSID stay redacted without that grant.'**
  String get permissionsPlatformIosSettingsHint;

  /// TS MessageKey: permissions.platform.ios.title
  ///
  /// In en, this message translates to:
  /// **'iOS cannot scan every nearby network'**
  String get permissionsPlatformIosTitle;

  /// TS MessageKey: permissions.platform.linux.body
  ///
  /// In en, this message translates to:
  /// **'Live Linux rows come from NetworkManager GetAccessPoints over the public D-Bus API — not iw, not monitor mode. Some desktops also hide SSID until a location or geoclue prompt is allowed.'**
  String get permissionsPlatformLinuxBody;

  /// TS MessageKey: permissions.platform.linux.settingsHint
  ///
  /// In en, this message translates to:
  /// **'Allow location or geoclue if the portal asks. Otherwise you may only see the connected network, or demo fixtures.'**
  String get permissionsPlatformLinuxSettingsHint;

  /// TS MessageKey: permissions.platform.linux.title
  ///
  /// In en, this message translates to:
  /// **'Linux NetworkManager public D-Bus'**
  String get permissionsPlatformLinuxTitle;

  /// TS MessageKey: permissions.platform.macos.body
  ///
  /// In en, this message translates to:
  /// **'On macOS, SSID and BSSID are CoreLocation-gated. LV24 asks for Location When In Use only to unlock those fields through a live ScanCore helper — not GPS or maps.'**
  String get permissionsPlatformMacosBody;

  /// TS MessageKey: permissions.platform.macos.settingsHint
  ///
  /// In en, this message translates to:
  /// **'Turn on Location Services, enable LV24 WiFi Explorer (and ScanCore if you run it standalone), then use a signed live ScanCore. Ad-hoc or unsigned helpers fall back to demo fixtures.'**
  String get permissionsPlatformMacosSettingsHint;

  /// TS MessageKey: permissions.platform.macos.title
  ///
  /// In en, this message translates to:
  /// **'Wi‑Fi identity on macOS'**
  String get permissionsPlatformMacosTitle;

  /// TS MessageKey: permissions.platform.other.body
  ///
  /// In en, this message translates to:
  /// **'This build cannot promise a macOS-class active scan. SSID and BSSID may need OS location permission; otherwise you see RF-only fields, an associated link, or demo fixtures.'**
  String get permissionsPlatformOtherBody;

  /// TS MessageKey: permissions.platform.other.settingsHint
  ///
  /// In en, this message translates to:
  /// **'Open system location settings if the OS asks. Windows v1 is associated-link plus demo fixtures, not a nearby-BSS survey.'**
  String get permissionsPlatformOtherSettingsHint;

  /// TS MessageKey: permissions.platform.other.title
  ///
  /// In en, this message translates to:
  /// **'Location and scan limits'**
  String get permissionsPlatformOtherTitle;

  /// TS MessageKey: permissions.platform.windows.body
  ///
  /// In en, this message translates to:
  /// **'Windows v1 uses Native Wifi WlanQueryInterface for the connected network. There is no public nearby-BSS survey. Location may unlock Wi‑Fi identity; it does not turn this into a site survey.'**
  String get permissionsPlatformWindowsBody;

  /// TS MessageKey: permissions.platform.windows.settingsHint
  ///
  /// In en, this message translates to:
  /// **'If Windows asks for location to show the current SSID or BSSID, allow it. Without an association you see demo fixtures.'**
  String get permissionsPlatformWindowsSettingsHint;

  /// TS MessageKey: permissions.platform.windows.title
  ///
  /// In en, this message translates to:
  /// **'Windows associated link only'**
  String get permissionsPlatformWindowsTitle;

  /// TS MessageKey: scan.degraded.androidThrottled.body
  ///
  /// In en, this message translates to:
  /// **'WifiManager limited this scan (OS throttle or SCAN_FAILED). Results may be stale; the next attempt backs off (30s or more).'**
  String get scanDegradedAndroidThrottledBody;

  /// TS MessageKey: scan.degraded.androidThrottled.title
  ///
  /// In en, this message translates to:
  /// **'Android scan throttled'**
  String get scanDegradedAndroidThrottledTitle;

  /// TS MessageKey: scan.degraded.demo.body
  ///
  /// In en, this message translates to:
  /// **'Live scan is not running. macOS needs Location When In Use plus a signed live ScanCore. iOS cannot full-scan; Android WifiManager is throttled; Linux uses public NetworkManager D-Bus; Windows is associated-link only.'**
  String get scanDegradedDemoBody;

  /// TS MessageKey: scan.degraded.demo.title
  ///
  /// In en, this message translates to:
  /// **'Demo data'**
  String get scanDegradedDemoTitle;

  /// TS MessageKey: scan.degraded.iosConnectedOnly.body
  ///
  /// In en, this message translates to:
  /// **'There is no public iOS API for a full nearby BSS scan. Showing the associated network when identity is available.'**
  String get scanDegradedIosConnectedOnlyBody;

  /// TS MessageKey: scan.degraded.iosConnectedOnly.title
  ///
  /// In en, this message translates to:
  /// **'iOS connected network only'**
  String get scanDegradedIosConnectedOnlyTitle;

  /// TS MessageKey: scan.degraded.linuxNm.body
  ///
  /// In en, this message translates to:
  /// **'Only public NetworkManager D-Bus data is available — often the connected network. This is not a full RF survey.'**
  String get scanDegradedLinuxNmBody;

  /// TS MessageKey: scan.degraded.linuxNm.title
  ///
  /// In en, this message translates to:
  /// **'Linux NetworkManager limited'**
  String get scanDegradedLinuxNmTitle;

  /// TS MessageKey: scan.degraded.windowsConnectedOnly.body
  ///
  /// In en, this message translates to:
  /// **'Native Wifi reports the connected network (SSID, BSSID, quality). Nearby BSS rows, channel, and IEs are not available in this v1 path.'**
  String get scanDegradedWindowsConnectedOnlyBody;

  /// TS MessageKey: scan.degraded.windowsConnectedOnly.title
  ///
  /// In en, this message translates to:
  /// **'Windows associated link only'**
  String get scanDegradedWindowsConnectedOnlyTitle;

  /// TS MessageKey: scan.demo.banner
  ///
  /// In en, this message translates to:
  /// **'Demo data — live scan is not running. macOS needs Location When In Use and a live ScanCore; iOS is connected-only; Android WifiManager is throttled; Linux uses public NetworkManager D-Bus; Windows is associated-link only.'**
  String get scanDemoBanner;

  /// TS MessageKey: scan.about.attribution
  ///
  /// In en, this message translates to:
  /// **'UI: Material UI (MIT) · Data Grid Pro (commercial license) · MUI X Charts (MIT).'**
  String get scanAboutAttribution;

  /// TS MessageKey: scan.about.location
  ///
  /// In en, this message translates to:
  /// **'Location Services may be required to show SSID and BSSID on modern macOS. This app does not use GPS or map tracking.'**
  String get scanAboutLocation;

  /// TS MessageKey: scan.about.scanCore
  ///
  /// In en, this message translates to:
  /// **'ScanCore · macOS CoreWLAN active scan helper.'**
  String get scanAboutScanCore;

  /// TS MessageKey: scan.about.title
  ///
  /// In en, this message translates to:
  /// **'LV24 WiFi Explorer'**
  String get scanAboutTitle;

  /// TS MessageKey: scan.adv.ies
  ///
  /// In en, this message translates to:
  /// **'Information elements'**
  String get scanAdvIes;

  /// TS MessageKey: scan.adv.issues
  ///
  /// In en, this message translates to:
  /// **'Issues'**
  String get scanAdvIssues;

  /// TS MessageKey: scan.adv.radio
  ///
  /// In en, this message translates to:
  /// **'Radio'**
  String get scanAdvRadio;

  /// TS MessageKey: scan.adv.security
  ///
  /// In en, this message translates to:
  /// **'Security'**
  String get scanAdvSecurity;

  /// TS MessageKey: scan.adv.ies.tree
  ///
  /// In en, this message translates to:
  /// **'Information elements — tree'**
  String get scanAdvIesTree;

  /// TS MessageKey: scan.ie.parseLevel
  ///
  /// In en, this message translates to:
  /// **'Parse level'**
  String get scanIeParseLevel;

  /// TS MessageKey: scan.ie.byteLength
  ///
  /// In en, this message translates to:
  /// **'Byte length'**
  String get scanIeByteLength;

  /// TS MessageKey: scan.ie.elementCount
  ///
  /// In en, this message translates to:
  /// **'Element count'**
  String get scanIeElementCount;

  /// TS MessageKey: scan.ie.rawHex
  ///
  /// In en, this message translates to:
  /// **'Raw hex'**
  String get scanIeRawHex;

  /// TS MessageKey: scan.ie.yes
  ///
  /// In en, this message translates to:
  /// **'yes'**
  String get scanIeYes;

  /// TS MessageKey: scan.ie.no
  ///
  /// In en, this message translates to:
  /// **'no'**
  String get scanIeNo;

  /// TS MessageKey: scan.ie.hiddenValue
  ///
  /// In en, this message translates to:
  /// **'(hidden)'**
  String get scanIeHiddenValue;

  /// TS MessageKey: scan.ie.flagSet
  ///
  /// In en, this message translates to:
  /// **'set'**
  String get scanIeFlagSet;

  /// TS MessageKey: scan.ie.wpaIe
  ///
  /// In en, this message translates to:
  /// **'WPA IE'**
  String get scanIeWpaIe;

  /// TS MessageKey: scan.ie.levelAbsent
  ///
  /// In en, this message translates to:
  /// **'absent'**
  String get scanIeLevelAbsent;

  /// TS MessageKey: scan.ie.levelRawOnly
  ///
  /// In en, this message translates to:
  /// **'raw-only'**
  String get scanIeLevelRawOnly;

  /// TS MessageKey: scan.ie.levelShallowTags
  ///
  /// In en, this message translates to:
  /// **'shallow-tags'**
  String get scanIeLevelShallowTags;

  /// TS MessageKey: scan.ie.levelUnsupportedDeep
  ///
  /// In en, this message translates to:
  /// **'unsupported-deep'**
  String get scanIeLevelUnsupportedDeep;

  /// TS MessageKey: scan.ie.ssid
  ///
  /// In en, this message translates to:
  /// **'SSID'**
  String get scanIeSsid;

  /// TS MessageKey: scan.ie.hidden
  ///
  /// In en, this message translates to:
  /// **'Hidden'**
  String get scanIeHidden;

  /// TS MessageKey: scan.ie.rates
  ///
  /// In en, this message translates to:
  /// **'Rates'**
  String get scanIeRates;

  /// TS MessageKey: scan.ie.basicRates
  ///
  /// In en, this message translates to:
  /// **'Basic rates'**
  String get scanIeBasicRates;

  /// TS MessageKey: scan.ie.channel
  ///
  /// In en, this message translates to:
  /// **'Channel'**
  String get scanIeChannel;

  /// TS MessageKey: scan.ie.countryCode
  ///
  /// In en, this message translates to:
  /// **'Country code'**
  String get scanIeCountryCode;

  /// TS MessageKey: scan.ie.environment
  ///
  /// In en, this message translates to:
  /// **'Environment'**
  String get scanIeEnvironment;

  /// TS MessageKey: scan.ie.regulatoryTriplet
  ///
  /// In en, this message translates to:
  /// **'Regulatory triplet {index}'**
  String scanIeRegulatoryTriplet(Object index);

  /// TS MessageKey: scan.ie.stationCount
  ///
  /// In en, this message translates to:
  /// **'Station count'**
  String get scanIeStationCount;

  /// TS MessageKey: scan.ie.channelUtilization
  ///
  /// In en, this message translates to:
  /// **'Channel utilization'**
  String get scanIeChannelUtilization;

  /// TS MessageKey: scan.ie.admissionCapacity
  ///
  /// In en, this message translates to:
  /// **'Available admission capacity'**
  String get scanIeAdmissionCapacity;

  /// TS MessageKey: scan.ie.dtimCount
  ///
  /// In en, this message translates to:
  /// **'DTIM count'**
  String get scanIeDtimCount;

  /// TS MessageKey: scan.ie.dtimPeriod
  ///
  /// In en, this message translates to:
  /// **'DTIM period'**
  String get scanIeDtimPeriod;

  /// TS MessageKey: scan.ie.bitmapControl
  ///
  /// In en, this message translates to:
  /// **'Bitmap control'**
  String get scanIeBitmapControl;

  /// TS MessageKey: scan.ie.partialBitmapLength
  ///
  /// In en, this message translates to:
  /// **'Partial bitmap length'**
  String get scanIePartialBitmapLength;

  /// TS MessageKey: scan.ie.localPowerConstraint
  ///
  /// In en, this message translates to:
  /// **'Local power constraint'**
  String get scanIeLocalPowerConstraint;

  /// TS MessageKey: scan.ie.spatialStreams
  ///
  /// In en, this message translates to:
  /// **'Spatial streams'**
  String get scanIeSpatialStreams;

  /// TS MessageKey: scan.ie.fortyMhz
  ///
  /// In en, this message translates to:
  /// **'40 MHz'**
  String get scanIeFortyMhz;

  /// TS MessageKey: scan.ie.shortGi20
  ///
  /// In en, this message translates to:
  /// **'Short GI 20 MHz'**
  String get scanIeShortGi20;

  /// TS MessageKey: scan.ie.shortGi40
  ///
  /// In en, this message translates to:
  /// **'Short GI 40 MHz'**
  String get scanIeShortGi40;

  /// TS MessageKey: scan.ie.version
  ///
  /// In en, this message translates to:
  /// **'Version'**
  String get scanIeVersion;

  /// TS MessageKey: scan.ie.groupCipher
  ///
  /// In en, this message translates to:
  /// **'Group cipher'**
  String get scanIeGroupCipher;

  /// TS MessageKey: scan.ie.pairwise
  ///
  /// In en, this message translates to:
  /// **'Pairwise {index}'**
  String scanIePairwise(Object index);

  /// TS MessageKey: scan.ie.akm
  ///
  /// In en, this message translates to:
  /// **'AKM {index}'**
  String scanIeAkm(Object index);

  /// TS MessageKey: scan.ie.mfpc
  ///
  /// In en, this message translates to:
  /// **'MFPC (PMF capable)'**
  String get scanIeMfpc;

  /// TS MessageKey: scan.ie.mfpr
  ///
  /// In en, this message translates to:
  /// **'MFPR (PMF required)'**
  String get scanIeMfpr;

  /// TS MessageKey: scan.ie.primaryChannel
  ///
  /// In en, this message translates to:
  /// **'Primary channel'**
  String get scanIePrimaryChannel;

  /// TS MessageKey: scan.ie.secondaryOffset
  ///
  /// In en, this message translates to:
  /// **'Secondary offset'**
  String get scanIeSecondaryOffset;

  /// TS MessageKey: scan.ie.staWidthAny40
  ///
  /// In en, this message translates to:
  /// **'STA channel width any 40'**
  String get scanIeStaWidthAny40;

  /// TS MessageKey: scan.ie.maxMcs
  ///
  /// In en, this message translates to:
  /// **'Max MCS'**
  String get scanIeMaxMcs;

  /// TS MessageKey: scan.ie.shortGi80
  ///
  /// In en, this message translates to:
  /// **'Short GI 80 MHz'**
  String get scanIeShortGi80;

  /// TS MessageKey: scan.ie.shortGi160
  ///
  /// In en, this message translates to:
  /// **'Short GI 160 MHz'**
  String get scanIeShortGi160;

  /// TS MessageKey: scan.ie.channelWidthSet
  ///
  /// In en, this message translates to:
  /// **'Supported channel width set'**
  String get scanIeChannelWidthSet;

  /// TS MessageKey: scan.ie.widthCode
  ///
  /// In en, this message translates to:
  /// **'Channel width code'**
  String get scanIeWidthCode;

  /// TS MessageKey: scan.ie.channelWidth
  ///
  /// In en, this message translates to:
  /// **'Channel width'**
  String get scanIeChannelWidth;

  /// TS MessageKey: scan.ie.ccfs0
  ///
  /// In en, this message translates to:
  /// **'Center freq segment 0'**
  String get scanIeCcfs0;

  /// TS MessageKey: scan.ie.ccfs1
  ///
  /// In en, this message translates to:
  /// **'Center freq segment 1'**
  String get scanIeCcfs1;

  /// TS MessageKey: scan.ie.length
  ///
  /// In en, this message translates to:
  /// **'Length'**
  String get scanIeLength;

  /// TS MessageKey: scan.ie.oui
  ///
  /// In en, this message translates to:
  /// **'OUI'**
  String get scanIeOui;

  /// TS MessageKey: scan.ie.vendorType
  ///
  /// In en, this message translates to:
  /// **'Vendor type'**
  String get scanIeVendorType;

  /// TS MessageKey: scan.ie.saeH2e
  ///
  /// In en, this message translates to:
  /// **'SAE hash-to-element'**
  String get scanIeSaeH2e;

  /// TS MessageKey: scan.ie.maxMcs80
  ///
  /// In en, this message translates to:
  /// **'Max MCS (≤80 MHz)'**
  String get scanIeMaxMcs80;

  /// TS MessageKey: scan.ie.bssColor
  ///
  /// In en, this message translates to:
  /// **'BSS color'**
  String get scanIeBssColor;

  /// TS MessageKey: scan.ie.bssColorDisabled
  ///
  /// In en, this message translates to:
  /// **'BSS color disabled'**
  String get scanIeBssColorDisabled;

  /// TS MessageKey: scan.ie.sixGhzPrimary
  ///
  /// In en, this message translates to:
  /// **'6 GHz primary channel'**
  String get scanIeSixGhzPrimary;

  /// TS MessageKey: scan.columns.manage
  ///
  /// In en, this message translates to:
  /// **'Columns'**
  String get scanColumnsManage;

  /// TS MessageKey: scan.columns.reset
  ///
  /// In en, this message translates to:
  /// **'Reset columns'**
  String get scanColumnsReset;

  /// TS MessageKey: scan.copied
  ///
  /// In en, this message translates to:
  /// **'Copied to clipboard'**
  String get scanCopied;

  /// TS MessageKey: scan.compare.diffLegend
  ///
  /// In en, this message translates to:
  /// **'Highlighted cells differ between selected networks.'**
  String get scanCompareDiffLegend;

  /// TS MessageKey: scan.compare.field
  ///
  /// In en, this message translates to:
  /// **'Field'**
  String get scanCompareField;

  /// TS MessageKey: scan.compare.hint
  ///
  /// In en, this message translates to:
  /// **'Select 2–3 networks in the table (checkboxes or ⌘-click), then review fields side by side.'**
  String get scanCompareHint;

  /// TS MessageKey: scan.chart.empty
  ///
  /// In en, this message translates to:
  /// **'No samples yet'**
  String get scanChartEmpty;

  /// TS MessageKey: scan.chart.occupancy
  ///
  /// In en, this message translates to:
  /// **'Channel occupancy'**
  String get scanChartOccupancy;

  /// TS MessageKey: scan.chart.occupancy.hint
  ///
  /// In en, this message translates to:
  /// **'From active scan, not RF spectrum'**
  String get scanChartOccupancyHint;

  /// TS MessageKey: scan.chart.selected
  ///
  /// In en, this message translates to:
  /// **'Selected network'**
  String get scanChartSelected;

  /// TS MessageKey: scan.chart.signal
  ///
  /// In en, this message translates to:
  /// **'Signal history'**
  String get scanChartSignal;

  /// TS MessageKey: scan.chart.table
  ///
  /// In en, this message translates to:
  /// **'Chart data table'**
  String get scanChartTable;

  /// TS MessageKey: scan.chart.timescale
  ///
  /// In en, this message translates to:
  /// **'Timescale'**
  String get scanChartTimescale;

  /// TS MessageKey: scan.chart.unit.dbm
  ///
  /// In en, this message translates to:
  /// **'dBm'**
  String get scanChartUnitDbm;

  /// TS MessageKey: scan.chart.unit.pct
  ///
  /// In en, this message translates to:
  /// **'Percent'**
  String get scanChartUnitPct;

  /// TS MessageKey: scan.col.band
  ///
  /// In en, this message translates to:
  /// **'Band'**
  String get scanColBand;

  /// TS MessageKey: scan.col.bssid
  ///
  /// In en, this message translates to:
  /// **'BSSID'**
  String get scanColBssid;

  /// TS MessageKey: scan.col.channel
  ///
  /// In en, this message translates to:
  /// **'Channel'**
  String get scanColChannel;

  /// TS MessageKey: scan.col.channelWidth
  ///
  /// In en, this message translates to:
  /// **'Channel width'**
  String get scanColChannelWidth;

  /// TS MessageKey: scan.col.issues
  ///
  /// In en, this message translates to:
  /// **'Issues'**
  String get scanColIssues;

  /// TS MessageKey: scan.col.phyMode
  ///
  /// In en, this message translates to:
  /// **'Mode'**
  String get scanColPhyMode;

  /// TS MessageKey: scan.col.rssi
  ///
  /// In en, this message translates to:
  /// **'RSSI'**
  String get scanColRssi;

  /// TS MessageKey: scan.col.security
  ///
  /// In en, this message translates to:
  /// **'Security'**
  String get scanColSecurity;

  /// TS MessageKey: scan.col.ssid
  ///
  /// In en, this message translates to:
  /// **'Network name'**
  String get scanColSsid;

  /// TS MessageKey: scan.col.vendor
  ///
  /// In en, this message translates to:
  /// **'Vendor'**
  String get scanColVendor;

  /// TS MessageKey: scan.details.band
  ///
  /// In en, this message translates to:
  /// **'Band'**
  String get scanDetailsBand;

  /// TS MessageKey: scan.details.bssid
  ///
  /// In en, this message translates to:
  /// **'BSSID'**
  String get scanDetailsBssid;

  /// TS MessageKey: scan.details.channel
  ///
  /// In en, this message translates to:
  /// **'Channel'**
  String get scanDetailsChannel;

  /// TS MessageKey: scan.details.channelWidth
  ///
  /// In en, this message translates to:
  /// **'Channel width'**
  String get scanDetailsChannelWidth;

  /// TS MessageKey: scan.details.connected
  ///
  /// In en, this message translates to:
  /// **'Connected'**
  String get scanDetailsConnected;

  /// TS MessageKey: scan.details.country
  ///
  /// In en, this message translates to:
  /// **'Country'**
  String get scanDetailsCountry;

  /// TS MessageKey: scan.details.empty
  ///
  /// In en, this message translates to:
  /// **'Select a network'**
  String get scanDetailsEmpty;

  /// TS MessageKey: scan.details.encryption
  ///
  /// In en, this message translates to:
  /// **'Encryption'**
  String get scanDetailsEncryption;

  /// TS MessageKey: scan.details.firstSeen
  ///
  /// In en, this message translates to:
  /// **'First seen'**
  String get scanDetailsFirstSeen;

  /// TS MessageKey: scan.details.frequencyMHz
  ///
  /// In en, this message translates to:
  /// **'Frequency'**
  String get scanDetailsFrequencyMHz;

  /// TS MessageKey: scan.details.lastSeen
  ///
  /// In en, this message translates to:
  /// **'Last seen'**
  String get scanDetailsLastSeen;

  /// TS MessageKey: scan.details.maxRateMbps
  ///
  /// In en, this message translates to:
  /// **'Max rate'**
  String get scanDetailsMaxRateMbps;

  /// TS MessageKey: scan.details.networkType
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get scanDetailsNetworkType;

  /// TS MessageKey: scan.details.noiseDbm
  ///
  /// In en, this message translates to:
  /// **'Noise'**
  String get scanDetailsNoiseDbm;

  /// TS MessageKey: scan.details.phyMode
  ///
  /// In en, this message translates to:
  /// **'Mode'**
  String get scanDetailsPhyMode;

  /// TS MessageKey: scan.details.security
  ///
  /// In en, this message translates to:
  /// **'Security'**
  String get scanDetailsSecurity;

  /// TS MessageKey: scan.details.signalPct
  ///
  /// In en, this message translates to:
  /// **'Signal'**
  String get scanDetailsSignalPct;

  /// TS MessageKey: scan.details.signalQuality
  ///
  /// In en, this message translates to:
  /// **'Signal quality'**
  String get scanDetailsSignalQuality;

  /// TS MessageKey: scan.details.snrDb
  ///
  /// In en, this message translates to:
  /// **'SNR'**
  String get scanDetailsSnrDb;

  /// TS MessageKey: scan.details.ssid
  ///
  /// In en, this message translates to:
  /// **'SSID'**
  String get scanDetailsSsid;

  /// TS MessageKey: scan.details.vendor
  ///
  /// In en, this message translates to:
  /// **'Vendor'**
  String get scanDetailsVendor;

  /// TS MessageKey: scan.export.all
  ///
  /// In en, this message translates to:
  /// **'All rows'**
  String get scanExportAll;

  /// TS MessageKey: scan.export.csv
  ///
  /// In en, this message translates to:
  /// **'Export CSV'**
  String get scanExportCsv;

  /// TS MessageKey: scan.export.selected
  ///
  /// In en, this message translates to:
  /// **'Selected rows'**
  String get scanExportSelected;

  /// TS MessageKey: scan.export.visible
  ///
  /// In en, this message translates to:
  /// **'Visible rows'**
  String get scanExportVisible;

  /// TS MessageKey: scan.field.unavailable
  ///
  /// In en, this message translates to:
  /// **'Not available from active scan'**
  String get scanFieldUnavailable;

  /// TS MessageKey: scan.file.menu
  ///
  /// In en, this message translates to:
  /// **'File'**
  String get scanFileMenu;

  /// TS MessageKey: scan.file.open
  ///
  /// In en, this message translates to:
  /// **'Open snapshot…'**
  String get scanFileOpen;

  /// TS MessageKey: scan.file.save
  ///
  /// In en, this message translates to:
  /// **'Save snapshot…'**
  String get scanFileSave;

  /// TS MessageKey: scan.print.visible
  ///
  /// In en, this message translates to:
  /// **'Print visible table…'**
  String get scanPrintVisible;

  /// TS MessageKey: scan.filter.band
  ///
  /// In en, this message translates to:
  /// **'Band filter'**
  String get scanFilterBand;

  /// TS MessageKey: scan.filter.band.24
  ///
  /// In en, this message translates to:
  /// **'2.4 GHz'**
  String get scanFilterBand24;

  /// TS MessageKey: scan.filter.band.5
  ///
  /// In en, this message translates to:
  /// **'5 GHz'**
  String get scanFilterBand5;

  /// TS MessageKey: scan.filter.band.6
  ///
  /// In en, this message translates to:
  /// **'6 GHz'**
  String get scanFilterBand6;

  /// TS MessageKey: scan.filter.band.all
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get scanFilterBandAll;

  /// TS MessageKey: scan.filter.band6.empty
  ///
  /// In en, this message translates to:
  /// **'No 6 GHz networks in this scan'**
  String get scanFilterBand6Empty;

  /// TS MessageKey: scan.filter.minRssi
  ///
  /// In en, this message translates to:
  /// **'Min RSSI'**
  String get scanFilterMinRssi;

  /// TS MessageKey: scan.filter.open
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get scanFilterOpen;

  /// TS MessageKey: scan.filter.secure
  ///
  /// In en, this message translates to:
  /// **'Secure'**
  String get scanFilterSecure;

  /// TS MessageKey: scan.filterSidebar.chipCount
  ///
  /// In en, this message translates to:
  /// **'{label} ({count})'**
  String scanFilterSidebarChipCount(String label, int count);

  /// TS MessageKey: scan.filterSidebar.clear
  ///
  /// In en, this message translates to:
  /// **'Clear band, security, and vendor filters'**
  String get scanFilterSidebarClear;

  /// TS MessageKey: scan.filterSidebar.collapse
  ///
  /// In en, this message translates to:
  /// **'Collapse filter panel'**
  String get scanFilterSidebarCollapse;

  /// TS MessageKey: scan.filterSidebar.empty
  ///
  /// In en, this message translates to:
  /// **'No networks to filter yet.'**
  String get scanFilterSidebarEmpty;

  /// TS MessageKey: scan.filterSidebar.expand
  ///
  /// In en, this message translates to:
  /// **'Expand filter panel'**
  String get scanFilterSidebarExpand;

  /// TS MessageKey: scan.filterSidebar.section.band
  ///
  /// In en, this message translates to:
  /// **'Band'**
  String get scanFilterSidebarSectionBand;

  /// TS MessageKey: scan.filterSidebar.section.security
  ///
  /// In en, this message translates to:
  /// **'Security'**
  String get scanFilterSidebarSectionSecurity;

  /// TS MessageKey: scan.filterSidebar.section.vendor
  ///
  /// In en, this message translates to:
  /// **'Vendor'**
  String get scanFilterSidebarSectionVendor;

  /// TS MessageKey: scan.filterSidebar.title
  ///
  /// In en, this message translates to:
  /// **'Filters'**
  String get scanFilterSidebarTitle;

  /// TS MessageKey: scan.filterSidebar.vendor.unknown
  ///
  /// In en, this message translates to:
  /// **'Unknown vendor'**
  String get scanFilterSidebarVendorUnknown;

  /// TS MessageKey: scan.issue.crowdedChannel
  ///
  /// In en, this message translates to:
  /// **'Crowded channel'**
  String get scanIssueCrowdedChannel;

  /// TS MessageKey: scan.issue.dfs
  ///
  /// In en, this message translates to:
  /// **'DFS channel'**
  String get scanIssueDfs;

  /// TS MessageKey: scan.issue.hiddenSsid
  ///
  /// In en, this message translates to:
  /// **'Hidden network name'**
  String get scanIssueHiddenSsid;

  /// TS MessageKey: scan.issue.highUtil
  ///
  /// In en, this message translates to:
  /// **'High channel utilization'**
  String get scanIssueHighUtil;

  /// TS MessageKey: scan.issue.legacyOnly
  ///
  /// In en, this message translates to:
  /// **'Legacy Wi‑Fi only (a/b/g)'**
  String get scanIssueLegacyOnly;

  /// TS MessageKey: scan.issue.lowSignal
  ///
  /// In en, this message translates to:
  /// **'Low signal'**
  String get scanIssueLowSignal;

  /// TS MessageKey: scan.issue.lowSnr
  ///
  /// In en, this message translates to:
  /// **'Low SNR'**
  String get scanIssueLowSnr;

  /// TS MessageKey: scan.issue.overlap24
  ///
  /// In en, this message translates to:
  /// **'Non-standard 2.4 GHz channel'**
  String get scanIssueOverlap24;

  /// TS MessageKey: scan.issue.weakSecurity
  ///
  /// In en, this message translates to:
  /// **'Weak security'**
  String get scanIssueWeakSecurity;

  /// TS MessageKey: scan.issue.width40on24
  ///
  /// In en, this message translates to:
  /// **'40 MHz or wider on 2.4 GHz'**
  String get scanIssueWidth40on24;

  /// TS MessageKey: scan.quality.excellent
  ///
  /// In en, this message translates to:
  /// **'Excellent'**
  String get scanQualityExcellent;

  /// TS MessageKey: scan.quality.fair
  ///
  /// In en, this message translates to:
  /// **'Fair'**
  String get scanQualityFair;

  /// TS MessageKey: scan.quality.good
  ///
  /// In en, this message translates to:
  /// **'Good'**
  String get scanQualityGood;

  /// TS MessageKey: scan.quality.poor
  ///
  /// In en, this message translates to:
  /// **'Poor'**
  String get scanQualityPoor;

  /// TS MessageKey: scan.quality.unusable
  ///
  /// In en, this message translates to:
  /// **'Unusable'**
  String get scanQualityUnusable;

  /// TS MessageKey: scan.location.denied
  ///
  /// In en, this message translates to:
  /// **'denied'**
  String get scanLocationDenied;

  /// TS MessageKey: scan.location.granted
  ///
  /// In en, this message translates to:
  /// **'granted'**
  String get scanLocationGranted;

  /// TS MessageKey: scan.location.notDetermined
  ///
  /// In en, this message translates to:
  /// **'not asked'**
  String get scanLocationNotDetermined;

  /// TS MessageKey: scan.location.restricted
  ///
  /// In en, this message translates to:
  /// **'restricted'**
  String get scanLocationRestricted;

  /// TS MessageKey: scan.scanCore.demo
  ///
  /// In en, this message translates to:
  /// **'demo'**
  String get scanScanCoreDemo;

  /// TS MessageKey: scan.scanCore.error
  ///
  /// In en, this message translates to:
  /// **'error'**
  String get scanScanCoreError;

  /// TS MessageKey: scan.scanCore.ok
  ///
  /// In en, this message translates to:
  /// **'ok'**
  String get scanScanCoreOk;

  /// TS MessageKey: scan.search.clear
  ///
  /// In en, this message translates to:
  /// **'Clear search'**
  String get scanSearchClear;

  /// TS MessageKey: scan.search.placeholder
  ///
  /// In en, this message translates to:
  /// **'Filter networks'**
  String get scanSearchPlaceholder;

  /// TS MessageKey: scan.settings.open
  ///
  /// In en, this message translates to:
  /// **'Scan settings'**
  String get scanSettingsOpen;

  /// TS MessageKey: scan.settings.scanInterval
  ///
  /// In en, this message translates to:
  /// **'Scan interval'**
  String get scanSettingsScanInterval;

  /// TS MessageKey: scan.settings.scanIntervalSec
  ///
  /// In en, this message translates to:
  /// **'{sec}s'**
  String scanSettingsScanIntervalSec(Object sec);

  /// TS MessageKey: scan.settings.signalUnit
  ///
  /// In en, this message translates to:
  /// **'Signal display'**
  String get scanSettingsSignalUnit;

  /// TS MessageKey: scan.settings.signalUnit.dbm
  ///
  /// In en, this message translates to:
  /// **'dBm'**
  String get scanSettingsSignalUnitDbm;

  /// TS MessageKey: scan.settings.signalUnit.percent
  ///
  /// In en, this message translates to:
  /// **'Percent'**
  String get scanSettingsSignalUnitPercent;

  /// TS MessageKey: scan.settings.autoStartScan
  ///
  /// In en, this message translates to:
  /// **'Start scanning on launch'**
  String get scanSettingsAutoStart;

  /// TS MessageKey: scan.settings.columns.cellRules
  ///
  /// In en, this message translates to:
  /// **'Cell highlighting'**
  String get scanSettingsColumnsCellRules;

  /// TS MessageKey: scan.settings.columns.cellRules.enabled
  ///
  /// In en, this message translates to:
  /// **'Enable rule-based highlighting'**
  String get scanSettingsColumnsCellRulesEnabled;

  /// TS MessageKey: scan.settings.columns.cellRules.rssi
  ///
  /// In en, this message translates to:
  /// **'Signal quality (RSSI, SNR, noise)'**
  String get scanSettingsColumnsCellRulesRssi;

  /// TS MessageKey: scan.settings.columns.cellRules.security
  ///
  /// In en, this message translates to:
  /// **'Open and weak networks (WEP)'**
  String get scanSettingsColumnsCellRulesSecurity;

  /// TS MessageKey: scan.settings.columns.openVisibility
  ///
  /// In en, this message translates to:
  /// **'Manage column visibility…'**
  String get scanSettingsColumnsOpenVisibility;

  /// TS MessageKey: scan.settings.title
  ///
  /// In en, this message translates to:
  /// **'Scan settings'**
  String get scanSettingsTitle;

  /// TS MessageKey: scan.settings.windowTitle
  ///
  /// In en, this message translates to:
  /// **'LV24 WiFi Explorer settings'**
  String get scanSettingsWindowTitle;

  /// TS MessageKey: scan.settings.tab.general
  ///
  /// In en, this message translates to:
  /// **'General'**
  String get scanSettingsTabGeneral;

  /// TS MessageKey: scan.settings.tab.columns
  ///
  /// In en, this message translates to:
  /// **'Columns'**
  String get scanSettingsTabColumns;

  /// TS MessageKey: scan.settings.tab.annotations
  ///
  /// In en, this message translates to:
  /// **'Annotations'**
  String get scanSettingsTabAnnotations;

  /// TS MessageKey: scan.settings.tab.vendor
  ///
  /// In en, this message translates to:
  /// **'Vendor database'**
  String get scanSettingsTabVendor;

  /// TS MessageKey: scan.settings.tab.advanced
  ///
  /// In en, this message translates to:
  /// **'Advanced'**
  String get scanSettingsTabAdvanced;

  /// TS MessageKey: scan.settings.includeHiddenSsid
  ///
  /// In en, this message translates to:
  /// **'Include hidden SSIDs when scanning'**
  String get scanSettingsIncludeHiddenSsid;

  /// TS MessageKey: scan.settings.dataSource
  ///
  /// In en, this message translates to:
  /// **'Data source'**
  String get scanSettingsDataSource;

  /// TS MessageKey: scan.settings.liveScan
  ///
  /// In en, this message translates to:
  /// **'Live scan'**
  String get scanSettingsLiveScan;

  /// TS MessageKey: scan.settings.language
  ///
  /// In en, this message translates to:
  /// **'Interface language'**
  String get scanSettingsLanguage;

  /// TS MessageKey: scan.settings.close
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get scanSettingsClose;

  /// TS MessageKey: scan.settings.annotations.add
  ///
  /// In en, this message translates to:
  /// **'Add rule'**
  String get scanSettingsAnnotationsAdd;

  /// TS MessageKey: scan.settings.annotations.pattern
  ///
  /// In en, this message translates to:
  /// **'BSSID pattern'**
  String get scanSettingsAnnotationsPattern;

  /// TS MessageKey: scan.settings.annotations.text
  ///
  /// In en, this message translates to:
  /// **'Text'**
  String get scanSettingsAnnotationsText;

  /// TS MessageKey: scan.settings.annotations.empty
  ///
  /// In en, this message translates to:
  /// **'No rules yet. Add a MAC pattern or import CSV.'**
  String get scanSettingsAnnotationsEmpty;

  /// TS MessageKey: scan.settings.annotations.import
  ///
  /// In en, this message translates to:
  /// **'Import CSV'**
  String get scanSettingsAnnotationsImport;

  /// TS MessageKey: scan.settings.annotations.export
  ///
  /// In en, this message translates to:
  /// **'Export CSV'**
  String get scanSettingsAnnotationsExport;

  /// TS MessageKey: scan.settings.annotations.remove
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get scanSettingsAnnotationsRemove;

  /// TS MessageKey: scan.settings.vendor.bundled
  ///
  /// In en, this message translates to:
  /// **'Bundled — local copy of IEEE MA-L (24-bit OUI).'**
  String get scanSettingsVendorBundled;

  /// TS MessageKey: scan.settings.vendor.entries
  ///
  /// In en, this message translates to:
  /// **'Entries: {count}'**
  String scanSettingsVendorEntries(Object count);

  /// TS MessageKey: scan.settings.vendor.updated
  ///
  /// In en, this message translates to:
  /// **'Updated: {date}'**
  String scanSettingsVendorUpdated(Object date);

  /// TS MessageKey: scan.settings.vendor.refreshHint
  ///
  /// In en, this message translates to:
  /// **'Refresh: yarn oui:refresh (public IEEE registry, no third-party APIs).'**
  String get scanSettingsVendorRefreshHint;

  /// TS MessageKey: scan.settings.advanced.hideEmptySpectrum
  ///
  /// In en, this message translates to:
  /// **'Hide empty bands on spectrum'**
  String get scanSettingsAdvancedHideEmptySpectrum;

  /// TS MessageKey: scan.settings.advanced.graphLabels
  ///
  /// In en, this message translates to:
  /// **'Graph labels'**
  String get scanSettingsAdvancedGraphLabels;

  /// TS MessageKey: scan.settings.advanced.graphLabels.ssid
  ///
  /// In en, this message translates to:
  /// **'Network name (SSID)'**
  String get scanSettingsAdvancedGraphLabelsSsid;

  /// TS MessageKey: scan.settings.advanced.graphLabels.apName
  ///
  /// In en, this message translates to:
  /// **'Access point name'**
  String get scanSettingsAdvancedGraphLabelsApName;

  /// TS MessageKey: scan.settings.advanced.graphLabels.annotation
  ///
  /// In en, this message translates to:
  /// **'Annotation'**
  String get scanSettingsAdvancedGraphLabelsAnnotation;

  /// TS MessageKey: scan.settings.advanced.followSystem
  ///
  /// In en, this message translates to:
  /// **'Match system appearance'**
  String get scanSettingsAdvancedFollowSystem;

  /// TS MessageKey: scan.snapshot.openError
  ///
  /// In en, this message translates to:
  /// **'Could not open snapshot: {detail}'**
  String scanSnapshotOpenError(Object detail);

  /// TS MessageKey: scan.ssid.hidden
  ///
  /// In en, this message translates to:
  /// **'‹hidden›'**
  String get scanSsidHidden;

  /// TS MessageKey: scan.status.about
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get scanStatusAbout;

  /// TS MessageKey: scan.status.found
  ///
  /// In en, this message translates to:
  /// **'Networks: {count}'**
  String scanStatusFound(Object count);

  /// TS MessageKey: scan.status.lastScan
  ///
  /// In en, this message translates to:
  /// **'Last scan: {time}'**
  String scanStatusLastScan(Object time);

  /// TS MessageKey: scan.status.location
  ///
  /// In en, this message translates to:
  /// **'Location: {state}'**
  String scanStatusLocation(Object state);

  /// TS MessageKey: scan.status.scanCore
  ///
  /// In en, this message translates to:
  /// **'ScanCore: {state}'**
  String scanStatusScanCore(Object state);

  /// TS MessageKey: scan.status.selected
  ///
  /// In en, this message translates to:
  /// **'Selected: {count}'**
  String scanStatusSelected(Object count);

  /// TS MessageKey: scan.status.shortcutsHint
  ///
  /// In en, this message translates to:
  /// **'⌘F search · ⌘P pause scan · ⌘1–4 details · ⌘C BSSID when grid focused'**
  String get scanStatusShortcutsHint;

  /// TS MessageKey: scan.status.timescaleHint
  ///
  /// In en, this message translates to:
  /// **'Signal · use ↑ or ↓ to change timescale when a chart is focused'**
  String get scanStatusTimescaleHint;

  /// TS MessageKey: scan.status.version
  ///
  /// In en, this message translates to:
  /// **'v{version}'**
  String scanStatusVersion(Object version);

  /// TS MessageKey: scan.type.ibss
  ///
  /// In en, this message translates to:
  /// **'Ad-hoc'**
  String get scanTypeIbss;

  /// TS MessageKey: scan.type.infrastructure
  ///
  /// In en, this message translates to:
  /// **'Infrastructure'**
  String get scanTypeInfrastructure;

  /// TS MessageKey: scan.tab.advanced
  ///
  /// In en, this message translates to:
  /// **'Advanced'**
  String get scanTabAdvanced;

  /// TS MessageKey: scan.tab.compare
  ///
  /// In en, this message translates to:
  /// **'Compare'**
  String get scanTabCompare;

  /// TS MessageKey: scan.tab.details
  ///
  /// In en, this message translates to:
  /// **'Network details'**
  String get scanTabDetails;

  /// TS MessageKey: scan.tab.occupancy
  ///
  /// In en, this message translates to:
  /// **'Channel occupancy'**
  String get scanTabOccupancy;

  /// TS MessageKey: scan.tab.signal
  ///
  /// In en, this message translates to:
  /// **'Signal strength'**
  String get scanTabSignal;

  /// TS MessageKey: scan.title.demo
  ///
  /// In en, this message translates to:
  /// **'Demo'**
  String get scanTitleDemo;

  /// TS MessageKey: scan.title.paused
  ///
  /// In en, this message translates to:
  /// **'Paused'**
  String get scanTitlePaused;

  /// TS MessageKey: scan.title.scanning
  ///
  /// In en, this message translates to:
  /// **'Scanning'**
  String get scanTitleScanning;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'ru'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'ru':
      return AppLocalizationsRu();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
