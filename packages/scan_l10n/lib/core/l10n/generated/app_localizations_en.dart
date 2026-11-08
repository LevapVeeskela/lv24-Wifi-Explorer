// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get permissionsDeniedBody =>
      'SSID and BSSID stay redacted until you allow Location Services for this app. RF metrics may still update.';

  @override
  String get permissionsDeniedTitle => 'Network names are hidden';

  @override
  String get permissionsLocationBody =>
      'On macOS, Wi‑Fi network names (SSID) and hardware addresses (BSSID) are treated as location-related data. LV24 WiFi Explorer requests Location Services only to unlock those fields — not to track GPS position or show maps.';

  @override
  String get permissionsLocationSettingsHint =>
      'Turn on Location Services globally, then enable LV24 WiFi Explorer in System Settings → Privacy & Security → Location Services.';

  @override
  String get permissionsLocationTitle => 'Location Services';

  @override
  String get permissionsOnboardingBody =>
      'Active scanning can show signal and channels without Location. To list network names and MAC addresses, allow Location when prompted.';

  @override
  String get permissionsOnboardingTitle => 'Wi‑Fi identity on macOS';

  @override
  String get permissionsOpenSettings => 'Open Location Settings';

  @override
  String get permissionsRestrictedBody =>
      'A device policy blocks Location Services. You can still view RF-only scan data or use demo mode where available.';

  @override
  String get permissionsRestrictedTitle => 'Location restricted';

  @override
  String get onboardingLocationContinue => 'Continue';

  @override
  String get onboardingLocationLater => 'Not now';

  @override
  String get onboardingLocationRetry => 'Retry';

  @override
  String get permissionsPlatformAndroidBody =>
      'Android treats Wi‑Fi scan results as location-related. WifiManager needs Location (and Nearby Wi‑Fi devices on Android 13+). The OS throttles startScan; this is not macOS ScanCore richness.';

  @override
  String get permissionsPlatformAndroidSettingsHint =>
      'Enable Location, grant this app, and keep Wi‑Fi on. Empty or stale rows usually mean the OS is throttling scans.';

  @override
  String get permissionsPlatformAndroidTitle =>
      'Android location unlocks WifiManager results';

  @override
  String get permissionsPlatformIosBody =>
      'Apple does not give third-party apps a CoreWLAN-style full scan. This client can show the connected network when Location When In Use allows Wi‑Fi identity — not a roaming site survey.';

  @override
  String get permissionsPlatformIosSettingsHint =>
      'Settings → Privacy & Security → Location Services → While Using. SSID and BSSID stay redacted without that grant.';

  @override
  String get permissionsPlatformIosTitle =>
      'iOS cannot scan every nearby network';

  @override
  String get permissionsPlatformLinuxBody =>
      'Live Linux rows come from NetworkManager GetAccessPoints over the public D-Bus API — not iw, not monitor mode. Some desktops also hide SSID until a location or geoclue prompt is allowed.';

  @override
  String get permissionsPlatformLinuxSettingsHint =>
      'Allow location or geoclue if the portal asks. Otherwise you may only see the connected network, or demo fixtures.';

  @override
  String get permissionsPlatformLinuxTitle =>
      'Linux NetworkManager public D-Bus';

  @override
  String get permissionsPlatformMacosBody =>
      'On macOS, SSID and BSSID are CoreLocation-gated. LV24 asks for Location When In Use only to unlock those fields through a live ScanCore helper — not GPS or maps.';

  @override
  String get permissionsPlatformMacosSettingsHint =>
      'Turn on Location Services, enable LV24 WiFi Explorer (and ScanCore if you run it standalone), then use a signed live ScanCore. Ad-hoc or unsigned helpers fall back to demo fixtures.';

  @override
  String get permissionsPlatformMacosTitle => 'Wi‑Fi identity on macOS';

  @override
  String get permissionsPlatformOtherBody =>
      'This build cannot promise a macOS-class active scan. SSID and BSSID may need OS location permission; otherwise you see RF-only fields, an associated link, or demo fixtures.';

  @override
  String get permissionsPlatformOtherSettingsHint =>
      'Open system location settings if the OS asks. Windows v1 is associated-link plus demo fixtures, not a nearby-BSS survey.';

  @override
  String get permissionsPlatformOtherTitle => 'Location and scan limits';

  @override
  String get permissionsPlatformWindowsBody =>
      'Windows v1 uses Native Wifi WlanQueryInterface for the connected network. There is no public nearby-BSS survey. Location may unlock Wi‑Fi identity; it does not turn this into a site survey.';

  @override
  String get permissionsPlatformWindowsSettingsHint =>
      'If Windows asks for location to show the current SSID or BSSID, allow it. Without an association you see demo fixtures.';

  @override
  String get permissionsPlatformWindowsTitle => 'Windows associated link only';

  @override
  String get scanDegradedAndroidThrottledBody =>
      'WifiManager limited this scan (OS throttle or SCAN_FAILED). Results may be stale; the next attempt backs off (30s or more).';

  @override
  String get scanDegradedAndroidThrottledTitle => 'Android scan throttled';

  @override
  String get scanDegradedDemoBody =>
      'Live scan is not running. macOS needs Location When In Use plus a signed live ScanCore. iOS cannot full-scan; Android WifiManager is throttled; Linux uses public NetworkManager D-Bus; Windows is associated-link only.';

  @override
  String get scanDegradedDemoTitle => 'Demo data';

  @override
  String get scanDegradedIosConnectedOnlyBody =>
      'There is no public iOS API for a full nearby BSS scan. Showing the associated network when identity is available.';

  @override
  String get scanDegradedIosConnectedOnlyTitle => 'iOS connected network only';

  @override
  String get scanDegradedLinuxNmBody =>
      'Only public NetworkManager D-Bus data is available — often the connected network. This is not a full RF survey.';

  @override
  String get scanDegradedLinuxNmTitle => 'Linux NetworkManager limited';

  @override
  String get scanDegradedWindowsConnectedOnlyBody =>
      'Native Wifi reports the connected network (SSID, BSSID, quality). Nearby BSS rows, channel, and IEs are not available in this v1 path.';

  @override
  String get scanDegradedWindowsConnectedOnlyTitle =>
      'Windows associated link only';

  @override
  String get scanDemoBanner =>
      'Demo data — live scan is not running. macOS needs Location When In Use and a live ScanCore; iOS is connected-only; Android WifiManager is throttled; Linux uses public NetworkManager D-Bus; Windows is associated-link only.';

  @override
  String get scanAboutAttribution =>
      'UI: Material UI (MIT) · Data Grid Pro (commercial license) · MUI X Charts (MIT).';

  @override
  String get scanAboutLocation =>
      'Location Services may be required to show SSID and BSSID on modern macOS. This app does not use GPS or map tracking.';

  @override
  String get scanAboutScanCore =>
      'ScanCore · macOS CoreWLAN active scan helper.';

  @override
  String get scanAboutTitle => 'LV24 WiFi Explorer';

  @override
  String get scanAdvIes => 'Information elements';

  @override
  String get scanAdvIssues => 'Issues';

  @override
  String get scanAdvRadio => 'Radio';

  @override
  String get scanAdvSecurity => 'Security';

  @override
  String get scanAdvIesTree => 'Information elements — tree';

  @override
  String get scanIeParseLevel => 'Parse level';

  @override
  String get scanIeByteLength => 'Byte length';

  @override
  String get scanIeElementCount => 'Element count';

  @override
  String get scanIeRawHex => 'Raw hex';

  @override
  String get scanIeYes => 'yes';

  @override
  String get scanIeNo => 'no';

  @override
  String get scanIeHiddenValue => '(hidden)';

  @override
  String get scanIeFlagSet => 'set';

  @override
  String get scanIeWpaIe => 'WPA IE';

  @override
  String get scanIeLevelAbsent => 'absent';

  @override
  String get scanIeLevelRawOnly => 'raw-only';

  @override
  String get scanIeLevelShallowTags => 'shallow-tags';

  @override
  String get scanIeLevelUnsupportedDeep => 'unsupported-deep';

  @override
  String get scanIeSsid => 'SSID';

  @override
  String get scanIeHidden => 'Hidden';

  @override
  String get scanIeRates => 'Rates';

  @override
  String get scanIeBasicRates => 'Basic rates';

  @override
  String get scanIeChannel => 'Channel';

  @override
  String get scanIeCountryCode => 'Country code';

  @override
  String get scanIeEnvironment => 'Environment';

  @override
  String scanIeRegulatoryTriplet(Object index) {
    return 'Regulatory triplet $index';
  }

  @override
  String get scanIeStationCount => 'Station count';

  @override
  String get scanIeChannelUtilization => 'Channel utilization';

  @override
  String get scanIeAdmissionCapacity => 'Available admission capacity';

  @override
  String get scanIeDtimCount => 'DTIM count';

  @override
  String get scanIeDtimPeriod => 'DTIM period';

  @override
  String get scanIeBitmapControl => 'Bitmap control';

  @override
  String get scanIePartialBitmapLength => 'Partial bitmap length';

  @override
  String get scanIeLocalPowerConstraint => 'Local power constraint';

  @override
  String get scanIeSpatialStreams => 'Spatial streams';

  @override
  String get scanIeFortyMhz => '40 MHz';

  @override
  String get scanIeShortGi20 => 'Short GI 20 MHz';

  @override
  String get scanIeShortGi40 => 'Short GI 40 MHz';

  @override
  String get scanIeVersion => 'Version';

  @override
  String get scanIeGroupCipher => 'Group cipher';

  @override
  String scanIePairwise(Object index) {
    return 'Pairwise $index';
  }

  @override
  String scanIeAkm(Object index) {
    return 'AKM $index';
  }

  @override
  String get scanIeMfpc => 'MFPC (PMF capable)';

  @override
  String get scanIeMfpr => 'MFPR (PMF required)';

  @override
  String get scanIePrimaryChannel => 'Primary channel';

  @override
  String get scanIeSecondaryOffset => 'Secondary offset';

  @override
  String get scanIeStaWidthAny40 => 'STA channel width any 40';

  @override
  String get scanIeMaxMcs => 'Max MCS';

  @override
  String get scanIeShortGi80 => 'Short GI 80 MHz';

  @override
  String get scanIeShortGi160 => 'Short GI 160 MHz';

  @override
  String get scanIeChannelWidthSet => 'Supported channel width set';

  @override
  String get scanIeWidthCode => 'Channel width code';

  @override
  String get scanIeChannelWidth => 'Channel width';

  @override
  String get scanIeCcfs0 => 'Center freq segment 0';

  @override
  String get scanIeCcfs1 => 'Center freq segment 1';

  @override
  String get scanIeLength => 'Length';

  @override
  String get scanIeOui => 'OUI';

  @override
  String get scanIeVendorType => 'Vendor type';

  @override
  String get scanIeSaeH2e => 'SAE hash-to-element';

  @override
  String get scanIeMaxMcs80 => 'Max MCS (≤80 MHz)';

  @override
  String get scanIeBssColor => 'BSS color';

  @override
  String get scanIeBssColorDisabled => 'BSS color disabled';

  @override
  String get scanIeSixGhzPrimary => '6 GHz primary channel';

  @override
  String get scanColumnsManage => 'Columns';

  @override
  String get scanColumnsReset => 'Reset columns';

  @override
  String get scanCopied => 'Copied to clipboard';

  @override
  String get scanCompareDiffLegend =>
      'Highlighted cells differ between selected networks.';

  @override
  String get scanCompareField => 'Field';

  @override
  String get scanCompareHint =>
      'Select 2–3 networks in the table (checkboxes or ⌘-click), then review fields side by side.';

  @override
  String get scanChartEmpty => 'No samples yet';

  @override
  String get scanChartOccupancy => 'Channel occupancy';

  @override
  String get scanChartOccupancyHint => 'From active scan, not RF spectrum';

  @override
  String get scanChartSelected => 'Selected network';

  @override
  String get scanChartSignal => 'Signal history';

  @override
  String get scanChartTable => 'Chart data table';

  @override
  String get scanChartTimescale => 'Timescale';

  @override
  String get scanChartUnitDbm => 'dBm';

  @override
  String get scanChartUnitPct => 'Percent';

  @override
  String get scanColBand => 'Band';

  @override
  String get scanColBssid => 'BSSID';

  @override
  String get scanColChannel => 'Channel';

  @override
  String get scanColChannelWidth => 'Channel width';

  @override
  String get scanColIssues => 'Issues';

  @override
  String get scanColPhyMode => 'Mode';

  @override
  String get scanColRssi => 'RSSI';

  @override
  String get scanColSecurity => 'Security';

  @override
  String get scanColSsid => 'Network name';

  @override
  String get scanColVendor => 'Vendor';

  @override
  String get scanDetailsBand => 'Band';

  @override
  String get scanDetailsBssid => 'BSSID';

  @override
  String get scanDetailsChannel => 'Channel';

  @override
  String get scanDetailsChannelWidth => 'Channel width';

  @override
  String get scanDetailsConnected => 'Connected';

  @override
  String get scanDetailsCountry => 'Country';

  @override
  String get scanDetailsEmpty => 'Select a network';

  @override
  String get scanDetailsEncryption => 'Encryption';

  @override
  String get scanDetailsFirstSeen => 'First seen';

  @override
  String get scanDetailsFrequencyMHz => 'Frequency';

  @override
  String get scanDetailsLastSeen => 'Last seen';

  @override
  String get scanDetailsMaxRateMbps => 'Max rate';

  @override
  String get scanDetailsNetworkType => 'Type';

  @override
  String get scanDetailsNoiseDbm => 'Noise';

  @override
  String get scanDetailsPhyMode => 'Mode';

  @override
  String get scanDetailsSecurity => 'Security';

  @override
  String get scanDetailsSignalPct => 'Signal';

  @override
  String get scanDetailsSignalQuality => 'Signal quality';

  @override
  String get scanDetailsSnrDb => 'SNR';

  @override
  String get scanDetailsSsid => 'SSID';

  @override
  String get scanDetailsVendor => 'Vendor';

  @override
  String get scanExportAll => 'All rows';

  @override
  String get scanExportCsv => 'Export CSV';

  @override
  String get scanExportSelected => 'Selected rows';

  @override
  String get scanExportVisible => 'Visible rows';

  @override
  String get scanFieldUnavailable => 'Not available from active scan';

  @override
  String get scanFileMenu => 'File';

  @override
  String get scanFileOpen => 'Open snapshot…';

  @override
  String get scanFileSave => 'Save snapshot…';

  @override
  String get scanPrintVisible => 'Print visible table…';

  @override
  String get scanFilterBand => 'Band filter';

  @override
  String get scanFilterBand24 => '2.4 GHz';

  @override
  String get scanFilterBand5 => '5 GHz';

  @override
  String get scanFilterBand6 => '6 GHz';

  @override
  String get scanFilterBandAll => 'All';

  @override
  String get scanFilterBand6Empty => 'No 6 GHz networks in this scan';

  @override
  String get scanFilterMinRssi => 'Min RSSI';

  @override
  String get scanFilterOpen => 'Open';

  @override
  String get scanFilterSecure => 'Secure';

  @override
  String scanFilterSidebarChipCount(String label, int count) {
    return '$label ($count)';
  }

  @override
  String get scanFilterSidebarClear =>
      'Clear band, security, and vendor filters';

  @override
  String get scanFilterSidebarCollapse => 'Collapse filter panel';

  @override
  String get scanFilterSidebarEmpty => 'No networks to filter yet.';

  @override
  String get scanFilterSidebarExpand => 'Expand filter panel';

  @override
  String get scanFilterSidebarSectionBand => 'Band';

  @override
  String get scanFilterSidebarSectionSecurity => 'Security';

  @override
  String get scanFilterSidebarSectionVendor => 'Vendor';

  @override
  String get scanFilterSidebarTitle => 'Filters';

  @override
  String get scanFilterSidebarVendorUnknown => 'Unknown vendor';

  @override
  String get scanIssueCrowdedChannel => 'Crowded channel';

  @override
  String get scanIssueDfs => 'DFS channel';

  @override
  String get scanIssueHiddenSsid => 'Hidden network name';

  @override
  String get scanIssueHighUtil => 'High channel utilization';

  @override
  String get scanIssueLegacyOnly => 'Legacy Wi‑Fi only (a/b/g)';

  @override
  String get scanIssueLowSignal => 'Low signal';

  @override
  String get scanIssueLowSnr => 'Low SNR';

  @override
  String get scanIssueOverlap24 => 'Non-standard 2.4 GHz channel';

  @override
  String get scanIssueWeakSecurity => 'Weak security';

  @override
  String get scanIssueWidth40on24 => '40 MHz or wider on 2.4 GHz';

  @override
  String get scanQualityExcellent => 'Excellent';

  @override
  String get scanQualityFair => 'Fair';

  @override
  String get scanQualityGood => 'Good';

  @override
  String get scanQualityPoor => 'Poor';

  @override
  String get scanQualityUnusable => 'Unusable';

  @override
  String get scanLocationDenied => 'denied';

  @override
  String get scanLocationGranted => 'granted';

  @override
  String get scanLocationNotDetermined => 'not asked';

  @override
  String get scanLocationRestricted => 'restricted';

  @override
  String get scanScanCoreDemo => 'demo';

  @override
  String get scanScanCoreError => 'error';

  @override
  String get scanScanCoreOk => 'ok';

  @override
  String get scanSearchClear => 'Clear search';

  @override
  String get scanSearchPlaceholder => 'Filter networks';

  @override
  String get scanSettingsOpen => 'Scan settings';

  @override
  String get scanSettingsScanInterval => 'Scan interval';

  @override
  String scanSettingsScanIntervalSec(Object sec) {
    return '${sec}s';
  }

  @override
  String get scanSettingsSignalUnit => 'Signal display';

  @override
  String get scanSettingsSignalUnitDbm => 'dBm';

  @override
  String get scanSettingsSignalUnitPercent => 'Percent';

  @override
  String get scanSettingsAutoStart => 'Start scanning on launch';

  @override
  String get scanSettingsColumnsCellRules => 'Cell highlighting';

  @override
  String get scanSettingsColumnsCellRulesEnabled =>
      'Enable rule-based highlighting';

  @override
  String get scanSettingsColumnsCellRulesRssi =>
      'Signal quality (RSSI, SNR, noise)';

  @override
  String get scanSettingsColumnsCellRulesSecurity =>
      'Open and weak networks (WEP)';

  @override
  String get scanSettingsColumnsOpenVisibility => 'Manage column visibility…';

  @override
  String get scanSettingsTitle => 'Scan settings';

  @override
  String get scanSettingsWindowTitle => 'LV24 WiFi Explorer settings';

  @override
  String get scanSettingsTabGeneral => 'General';

  @override
  String get scanSettingsTabColumns => 'Columns';

  @override
  String get scanSettingsTabAnnotations => 'Annotations';

  @override
  String get scanSettingsTabVendor => 'Vendor database';

  @override
  String get scanSettingsTabAdvanced => 'Advanced';

  @override
  String get scanSettingsIncludeHiddenSsid =>
      'Include hidden SSIDs when scanning';

  @override
  String get scanSettingsDataSource => 'Data source';

  @override
  String get scanSettingsLiveScan => 'Live scan';

  @override
  String get scanSettingsLanguage => 'Interface language';

  @override
  String get scanSettingsClose => 'Close';

  @override
  String get scanSettingsAnnotationsAdd => 'Add rule';

  @override
  String get scanSettingsAnnotationsPattern => 'BSSID pattern';

  @override
  String get scanSettingsAnnotationsText => 'Text';

  @override
  String get scanSettingsAnnotationsEmpty =>
      'No rules yet. Add a MAC pattern or import CSV.';

  @override
  String get scanSettingsAnnotationsImport => 'Import CSV';

  @override
  String get scanSettingsAnnotationsExport => 'Export CSV';

  @override
  String get scanSettingsAnnotationsRemove => 'Remove';

  @override
  String get scanSettingsVendorBundled =>
      'Bundled — local copy of IEEE MA-L (24-bit OUI).';

  @override
  String scanSettingsVendorEntries(Object count) {
    return 'Entries: $count';
  }

  @override
  String scanSettingsVendorUpdated(Object date) {
    return 'Updated: $date';
  }

  @override
  String get scanSettingsVendorRefreshHint =>
      'Refresh: yarn oui:refresh (public IEEE registry, no third-party APIs).';

  @override
  String get scanSettingsAdvancedHideEmptySpectrum =>
      'Hide empty bands on spectrum';

  @override
  String get scanSettingsAdvancedGraphLabels => 'Graph labels';

  @override
  String get scanSettingsAdvancedGraphLabelsSsid => 'Network name (SSID)';

  @override
  String get scanSettingsAdvancedGraphLabelsApName => 'Access point name';

  @override
  String get scanSettingsAdvancedGraphLabelsAnnotation => 'Annotation';

  @override
  String get scanSettingsAdvancedFollowSystem => 'Match system appearance';

  @override
  String scanSnapshotOpenError(Object detail) {
    return 'Could not open snapshot: $detail';
  }

  @override
  String get scanSsidHidden => '‹hidden›';

  @override
  String get scanStatusAbout => 'About';

  @override
  String scanStatusFound(Object count) {
    return 'Networks: $count';
  }

  @override
  String scanStatusLastScan(Object time) {
    return 'Last scan: $time';
  }

  @override
  String scanStatusLocation(Object state) {
    return 'Location: $state';
  }

  @override
  String scanStatusScanCore(Object state) {
    return 'ScanCore: $state';
  }

  @override
  String scanStatusSelected(Object count) {
    return 'Selected: $count';
  }

  @override
  String get scanStatusShortcutsHint =>
      '⌘F search · ⌘P pause scan · ⌘1–4 details · ⌘C BSSID when grid focused';

  @override
  String get scanStatusTimescaleHint =>
      'Signal · use ↑ or ↓ to change timescale when a chart is focused';

  @override
  String scanStatusVersion(Object version) {
    return 'v$version';
  }

  @override
  String get scanTypeIbss => 'Ad-hoc';

  @override
  String get scanTypeInfrastructure => 'Infrastructure';

  @override
  String get scanTabAdvanced => 'Advanced';

  @override
  String get scanTabCompare => 'Compare';

  @override
  String get scanTabDetails => 'Network details';

  @override
  String get scanTabOccupancy => 'Channel occupancy';

  @override
  String get scanTabSignal => 'Signal strength';

  @override
  String get scanTitleDemo => 'Demo';

  @override
  String get scanTitlePaused => 'Paused';

  @override
  String get scanTitleScanning => 'Scanning';

  @override
  String get workbenchStart => 'Start';

  @override
  String get workbenchStop => 'Stop';

  @override
  String get workbenchRedacted => 'redacted';

  @override
  String get workbenchColumnsProfileDefault => 'Default';

  @override
  String get workbenchColumnsProfiles => 'Profile';

  @override
  String get workbenchColumnsSaveProfile => 'Save profile';

  @override
  String get workbenchColumnsDeleteProfile => 'Delete profile';

  @override
  String get workbenchColumnsProfileNameHint => 'Profile name';

  @override
  String workbenchStatusDisplayed(int count) {
    return 'Displayed: $count';
  }

  @override
  String get workbenchOrganizeBy => 'Organize by';

  @override
  String get workbenchOrganizeNone => 'None';

  @override
  String get workbenchOrganizeVendor => 'Vendor';

  @override
  String get workbenchSaveFilterPreset => 'Save preset';

  @override
  String get workbenchFilterPresetsTitle => 'Saved filters';

  @override
  String get workbenchFilterPresetsEmpty => 'No saved filters';

  @override
  String get workbenchFilterPresetsSave => 'Save current filters';

  @override
  String get workbenchFilterPresetsNewName => 'Preset name';

  @override
  String workbenchFilterPresetsDelete(String name) {
    return 'Delete \"$name\"';
  }
}
