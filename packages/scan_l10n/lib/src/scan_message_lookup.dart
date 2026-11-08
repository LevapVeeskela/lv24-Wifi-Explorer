import '../core/l10n/generated/app_localizations.dart';
import '../core/l10n/generated/app_localizations_en.dart';
import '../core/l10n/generated/app_localizations_ru.dart';
import '../core/l10n/generated/app_localizations_zh.dart';
import 'scan_locale.dart';

/// All TS-style message keys (`scan.status.found`, …) present in ARB catalogs.
const scanMessageKeys = <String>[
  'onboarding.location.continue',
  'onboarding.location.later',
  'onboarding.location.retry',
  'permissions.denied.body',
  'permissions.denied.title',
  'permissions.location.body',
  'permissions.location.settingsHint',
  'permissions.location.title',
  'permissions.onboarding.body',
  'permissions.onboarding.title',
  'permissions.openSettings',
  'permissions.platform.android.body',
  'permissions.platform.android.settingsHint',
  'permissions.platform.android.title',
  'permissions.platform.ios.body',
  'permissions.platform.ios.settingsHint',
  'permissions.platform.ios.title',
  'permissions.platform.linux.body',
  'permissions.platform.linux.settingsHint',
  'permissions.platform.linux.title',
  'permissions.platform.macos.body',
  'permissions.platform.macos.settingsHint',
  'permissions.platform.macos.title',
  'permissions.platform.other.body',
  'permissions.platform.other.settingsHint',
  'permissions.platform.other.title',
  'permissions.platform.windows.body',
  'permissions.platform.windows.settingsHint',
  'permissions.platform.windows.title',
  'permissions.restricted.body',
  'permissions.restricted.title',
  'scan.about.attribution',
  'scan.about.location',
  'scan.about.scanCore',
  'scan.about.title',
  'scan.adv.ies',
  'scan.adv.ies.tree',
  'scan.adv.issues',
  'scan.adv.radio',
  'scan.adv.security',
  'scan.ie.parseLevel',
  'scan.ie.byteLength',
  'scan.ie.elementCount',
  'scan.ie.rawHex',
  'scan.ie.yes',
  'scan.ie.no',
  'scan.ie.hiddenValue',
  'scan.ie.flagSet',
  'scan.ie.wpaIe',
  'scan.ie.levelAbsent',
  'scan.ie.levelRawOnly',
  'scan.ie.levelShallowTags',
  'scan.ie.levelUnsupportedDeep',
  'scan.ie.ssid',
  'scan.ie.hidden',
  'scan.ie.rates',
  'scan.ie.basicRates',
  'scan.ie.channel',
  'scan.ie.countryCode',
  'scan.ie.environment',
  'scan.ie.regulatoryTriplet',
  'scan.ie.stationCount',
  'scan.ie.channelUtilization',
  'scan.ie.admissionCapacity',
  'scan.ie.dtimCount',
  'scan.ie.dtimPeriod',
  'scan.ie.bitmapControl',
  'scan.ie.partialBitmapLength',
  'scan.ie.localPowerConstraint',
  'scan.ie.spatialStreams',
  'scan.ie.fortyMhz',
  'scan.ie.shortGi20',
  'scan.ie.shortGi40',
  'scan.ie.version',
  'scan.ie.groupCipher',
  'scan.ie.pairwise',
  'scan.ie.akm',
  'scan.ie.mfpc',
  'scan.ie.mfpr',
  'scan.ie.primaryChannel',
  'scan.ie.secondaryOffset',
  'scan.ie.staWidthAny40',
  'scan.ie.maxMcs',
  'scan.ie.shortGi80',
  'scan.ie.shortGi160',
  'scan.ie.channelWidthSet',
  'scan.ie.widthCode',
  'scan.ie.channelWidth',
  'scan.ie.ccfs0',
  'scan.ie.ccfs1',
  'scan.ie.length',
  'scan.ie.oui',
  'scan.ie.vendorType',
  'scan.ie.saeH2e',
  'scan.ie.maxMcs80',
  'scan.ie.bssColor',
  'scan.ie.bssColorDisabled',
  'scan.ie.sixGhzPrimary',
  'scan.chart.empty',
  'scan.chart.occupancy',
  'scan.chart.occupancy.hint',
  'scan.chart.selected',
  'scan.chart.signal',
  'scan.chart.table',
  'scan.chart.timescale',
  'scan.chart.unit.dbm',
  'scan.chart.unit.pct',
  'scan.columns.manage',
  'scan.columns.reset',
  'scan.col.band',
  'scan.col.bssid',
  'scan.col.channel',
  'scan.col.channelWidth',
  'scan.col.issues',
  'scan.col.phyMode',
  'scan.col.rssi',
  'scan.col.security',
  'scan.col.ssid',
  'scan.col.vendor',
  'scan.copied',
  'scan.degraded.androidThrottled.body',
  'scan.degraded.androidThrottled.title',
  'scan.degraded.demo.body',
  'scan.degraded.demo.title',
  'scan.degraded.iosConnectedOnly.body',
  'scan.degraded.iosConnectedOnly.title',
  'scan.degraded.linuxNm.body',
  'scan.degraded.linuxNm.title',
  'scan.degraded.windowsConnectedOnly.body',
  'scan.degraded.windowsConnectedOnly.title',
  'scan.demo.banner',
  'scan.compare.diffLegend',
  'scan.compare.field',
  'scan.compare.hint',
  'scan.details.band',
  'scan.details.bssid',
  'scan.details.channel',
  'scan.details.channelWidth',
  'scan.details.connected',
  'scan.details.country',
  'scan.details.empty',
  'scan.details.encryption',
  'scan.details.firstSeen',
  'scan.details.frequencyMHz',
  'scan.details.lastSeen',
  'scan.details.maxRateMbps',
  'scan.details.networkType',
  'scan.details.noiseDbm',
  'scan.details.phyMode',
  'scan.details.security',
  'scan.details.signalPct',
  'scan.details.signalQuality',
  'scan.details.snrDb',
  'scan.details.ssid',
  'scan.details.vendor',
  'scan.export.all',
  'scan.export.csv',
  'scan.export.selected',
  'scan.export.visible',
  'scan.field.unavailable',
  'scan.file.menu',
  'scan.file.open',
  'scan.file.save',
  'scan.print.visible',
  'scan.filter.band',
  'scan.filter.band.24',
  'scan.filter.band.5',
  'scan.filter.band.6',
  'scan.filter.band.all',
  'scan.filter.band6.empty',
  'scan.filter.minRssi',
  'scan.filter.open',
  'scan.filter.secure',
  'scan.filterSidebar.chipCount',
  'scan.filterSidebar.clear',
  'scan.filterSidebar.collapse',
  'scan.filterSidebar.empty',
  'scan.filterSidebar.expand',
  'scan.filterSidebar.section.band',
  'scan.filterSidebar.section.security',
  'scan.filterSidebar.section.vendor',
  'scan.filterSidebar.title',
  'scan.filterSidebar.vendor.unknown',
  'scan.issue.crowdedChannel',
  'scan.issue.dfs',
  'scan.issue.hiddenSsid',
  'scan.issue.highUtil',
  'scan.issue.legacyOnly',
  'scan.issue.lowSignal',
  'scan.issue.lowSnr',
  'scan.issue.overlap24',
  'scan.issue.weakSecurity',
  'scan.issue.width40on24',
  'scan.quality.excellent',
  'scan.quality.fair',
  'scan.quality.good',
  'scan.quality.poor',
  'scan.quality.unusable',
  'scan.location.denied',
  'scan.location.granted',
  'scan.location.notDetermined',
  'scan.location.restricted',
  'scan.scanCore.demo',
  'scan.scanCore.error',
  'scan.scanCore.ok',
  'scan.search.clear',
  'scan.search.placeholder',
  'scan.settings.advanced.followSystem',
  'scan.settings.advanced.graphLabels',
  'scan.settings.advanced.graphLabels.annotation',
  'scan.settings.advanced.graphLabels.apName',
  'scan.settings.advanced.graphLabels.ssid',
  'scan.settings.advanced.hideEmptySpectrum',
  'scan.settings.annotations.add',
  'scan.settings.annotations.empty',
  'scan.settings.annotations.export',
  'scan.settings.annotations.import',
  'scan.settings.annotations.pattern',
  'scan.settings.annotations.remove',
  'scan.settings.annotations.text',
  'scan.settings.autoStartScan',
  'scan.settings.close',
  'scan.settings.columns.cellRules',
  'scan.settings.columns.cellRules.enabled',
  'scan.settings.columns.cellRules.rssi',
  'scan.settings.columns.cellRules.security',
  'scan.settings.columns.openVisibility',
  'scan.settings.dataSource',
  'scan.settings.includeHiddenSsid',
  'scan.settings.language',
  'scan.settings.liveScan',
  'scan.settings.open',
  'scan.settings.scanInterval',
  'scan.settings.scanIntervalSec',
  'scan.settings.signalUnit',
  'scan.settings.signalUnit.dbm',
  'scan.settings.signalUnit.percent',
  'scan.settings.tab.advanced',
  'scan.settings.tab.annotations',
  'scan.settings.tab.columns',
  'scan.settings.tab.general',
  'scan.settings.tab.vendor',
  'scan.settings.title',
  'scan.settings.vendor.bundled',
  'scan.settings.vendor.entries',
  'scan.settings.vendor.refreshHint',
  'scan.settings.vendor.updated',
  'scan.settings.windowTitle',
  'scan.snapshot.openError',
  'scan.ssid.hidden',
  'scan.status.about',
  'scan.status.found',
  'scan.status.lastScan',
  'scan.status.location',
  'scan.status.scanCore',
  'scan.status.selected',
  'scan.status.shortcutsHint',
  'scan.status.timescaleHint',
  'scan.status.version',
  'scan.tab.advanced',
  'scan.tab.compare',
  'scan.tab.details',
  'scan.tab.occupancy',
  'scan.tab.signal',
  'scan.title.demo',
  'scan.title.paused',
  'scan.title.scanning',
  'scan.type.ibss',
  'scan.type.infrastructure',
];

int _intPlaceholder(Object? value) {
  if (value is int) return value;
  return int.tryParse('$value') ?? 0;
}

AppLocalizations appLocalizationsForLanguageCode(String languageCode) {
  switch (languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'zh':
      return AppLocalizationsZh();
    case 'ru':
    default:
      return AppLocalizationsRu();
  }
}

AppLocalizations appLocalizationsForScanLocale(ScanLocale locale) =>
    appLocalizationsForLanguageCode(locale.languageCode);

String lookupScanMessage(
  AppLocalizations l10n,
  String messageKey, [
  Map<String, Object>? values,
]) {
  switch (messageKey) {
    case 'onboarding.location.continue':
      return l10n.onboardingLocationContinue;
    case 'onboarding.location.later':
      return l10n.onboardingLocationLater;
    case 'onboarding.location.retry':
      return l10n.onboardingLocationRetry;
    case 'permissions.denied.body':
      return l10n.permissionsDeniedBody;
    case 'permissions.denied.title':
      return l10n.permissionsDeniedTitle;
    case 'permissions.location.body':
      return l10n.permissionsLocationBody;
    case 'permissions.location.settingsHint':
      return l10n.permissionsLocationSettingsHint;
    case 'permissions.location.title':
      return l10n.permissionsLocationTitle;
    case 'permissions.onboarding.body':
      return l10n.permissionsOnboardingBody;
    case 'permissions.onboarding.title':
      return l10n.permissionsOnboardingTitle;
    case 'permissions.openSettings':
      return l10n.permissionsOpenSettings;
    case 'permissions.platform.android.body':
      return l10n.permissionsPlatformAndroidBody;
    case 'permissions.platform.android.settingsHint':
      return l10n.permissionsPlatformAndroidSettingsHint;
    case 'permissions.platform.android.title':
      return l10n.permissionsPlatformAndroidTitle;
    case 'permissions.platform.ios.body':
      return l10n.permissionsPlatformIosBody;
    case 'permissions.platform.ios.settingsHint':
      return l10n.permissionsPlatformIosSettingsHint;
    case 'permissions.platform.ios.title':
      return l10n.permissionsPlatformIosTitle;
    case 'permissions.platform.linux.body':
      return l10n.permissionsPlatformLinuxBody;
    case 'permissions.platform.linux.settingsHint':
      return l10n.permissionsPlatformLinuxSettingsHint;
    case 'permissions.platform.linux.title':
      return l10n.permissionsPlatformLinuxTitle;
    case 'permissions.platform.macos.body':
      return l10n.permissionsPlatformMacosBody;
    case 'permissions.platform.macos.settingsHint':
      return l10n.permissionsPlatformMacosSettingsHint;
    case 'permissions.platform.macos.title':
      return l10n.permissionsPlatformMacosTitle;
    case 'permissions.platform.other.body':
      return l10n.permissionsPlatformOtherBody;
    case 'permissions.platform.other.settingsHint':
      return l10n.permissionsPlatformOtherSettingsHint;
    case 'permissions.platform.other.title':
      return l10n.permissionsPlatformOtherTitle;
    case 'permissions.platform.windows.body':
      return l10n.permissionsPlatformWindowsBody;
    case 'permissions.platform.windows.settingsHint':
      return l10n.permissionsPlatformWindowsSettingsHint;
    case 'permissions.platform.windows.title':
      return l10n.permissionsPlatformWindowsTitle;
    case 'permissions.restricted.body':
      return l10n.permissionsRestrictedBody;
    case 'permissions.restricted.title':
      return l10n.permissionsRestrictedTitle;
    case 'scan.about.attribution':
      return l10n.scanAboutAttribution;
    case 'scan.about.location':
      return l10n.scanAboutLocation;
    case 'scan.about.scanCore':
      return l10n.scanAboutScanCore;
    case 'scan.about.title':
      return l10n.scanAboutTitle;
    case 'scan.adv.ies':
      return l10n.scanAdvIes;
    case 'scan.adv.ies.tree':
      return l10n.scanAdvIesTree;
    case 'scan.adv.issues':
      return l10n.scanAdvIssues;
    case 'scan.adv.radio':
      return l10n.scanAdvRadio;
    case 'scan.adv.security':
      return l10n.scanAdvSecurity;
    case 'scan.ie.parseLevel':
      return l10n.scanIeParseLevel;
    case 'scan.ie.byteLength':
      return l10n.scanIeByteLength;
    case 'scan.ie.elementCount':
      return l10n.scanIeElementCount;
    case 'scan.ie.rawHex':
      return l10n.scanIeRawHex;
    case 'scan.ie.yes':
      return l10n.scanIeYes;
    case 'scan.ie.no':
      return l10n.scanIeNo;
    case 'scan.ie.hiddenValue':
      return l10n.scanIeHiddenValue;
    case 'scan.ie.flagSet':
      return l10n.scanIeFlagSet;
    case 'scan.ie.wpaIe':
      return l10n.scanIeWpaIe;
    case 'scan.ie.levelAbsent':
      return l10n.scanIeLevelAbsent;
    case 'scan.ie.levelRawOnly':
      return l10n.scanIeLevelRawOnly;
    case 'scan.ie.levelShallowTags':
      return l10n.scanIeLevelShallowTags;
    case 'scan.ie.levelUnsupportedDeep':
      return l10n.scanIeLevelUnsupportedDeep;
    case 'scan.ie.ssid':
      return l10n.scanIeSsid;
    case 'scan.ie.hidden':
      return l10n.scanIeHidden;
    case 'scan.ie.rates':
      return l10n.scanIeRates;
    case 'scan.ie.basicRates':
      return l10n.scanIeBasicRates;
    case 'scan.ie.channel':
      return l10n.scanIeChannel;
    case 'scan.ie.countryCode':
      return l10n.scanIeCountryCode;
    case 'scan.ie.environment':
      return l10n.scanIeEnvironment;
    case 'scan.ie.regulatoryTriplet':
      return l10n.scanIeRegulatoryTriplet(values?['index'] ?? '');
    case 'scan.ie.stationCount':
      return l10n.scanIeStationCount;
    case 'scan.ie.channelUtilization':
      return l10n.scanIeChannelUtilization;
    case 'scan.ie.admissionCapacity':
      return l10n.scanIeAdmissionCapacity;
    case 'scan.ie.dtimCount':
      return l10n.scanIeDtimCount;
    case 'scan.ie.dtimPeriod':
      return l10n.scanIeDtimPeriod;
    case 'scan.ie.bitmapControl':
      return l10n.scanIeBitmapControl;
    case 'scan.ie.partialBitmapLength':
      return l10n.scanIePartialBitmapLength;
    case 'scan.ie.localPowerConstraint':
      return l10n.scanIeLocalPowerConstraint;
    case 'scan.ie.spatialStreams':
      return l10n.scanIeSpatialStreams;
    case 'scan.ie.fortyMhz':
      return l10n.scanIeFortyMhz;
    case 'scan.ie.shortGi20':
      return l10n.scanIeShortGi20;
    case 'scan.ie.shortGi40':
      return l10n.scanIeShortGi40;
    case 'scan.ie.version':
      return l10n.scanIeVersion;
    case 'scan.ie.groupCipher':
      return l10n.scanIeGroupCipher;
    case 'scan.ie.pairwise':
      return l10n.scanIePairwise(values?['index'] ?? '');
    case 'scan.ie.akm':
      return l10n.scanIeAkm(values?['index'] ?? '');
    case 'scan.ie.mfpc':
      return l10n.scanIeMfpc;
    case 'scan.ie.mfpr':
      return l10n.scanIeMfpr;
    case 'scan.ie.primaryChannel':
      return l10n.scanIePrimaryChannel;
    case 'scan.ie.secondaryOffset':
      return l10n.scanIeSecondaryOffset;
    case 'scan.ie.staWidthAny40':
      return l10n.scanIeStaWidthAny40;
    case 'scan.ie.maxMcs':
      return l10n.scanIeMaxMcs;
    case 'scan.ie.shortGi80':
      return l10n.scanIeShortGi80;
    case 'scan.ie.shortGi160':
      return l10n.scanIeShortGi160;
    case 'scan.ie.channelWidthSet':
      return l10n.scanIeChannelWidthSet;
    case 'scan.ie.widthCode':
      return l10n.scanIeWidthCode;
    case 'scan.ie.channelWidth':
      return l10n.scanIeChannelWidth;
    case 'scan.ie.ccfs0':
      return l10n.scanIeCcfs0;
    case 'scan.ie.ccfs1':
      return l10n.scanIeCcfs1;
    case 'scan.ie.length':
      return l10n.scanIeLength;
    case 'scan.ie.oui':
      return l10n.scanIeOui;
    case 'scan.ie.vendorType':
      return l10n.scanIeVendorType;
    case 'scan.ie.saeH2e':
      return l10n.scanIeSaeH2e;
    case 'scan.ie.maxMcs80':
      return l10n.scanIeMaxMcs80;
    case 'scan.ie.bssColor':
      return l10n.scanIeBssColor;
    case 'scan.ie.bssColorDisabled':
      return l10n.scanIeBssColorDisabled;
    case 'scan.ie.sixGhzPrimary':
      return l10n.scanIeSixGhzPrimary;
    case 'scan.chart.empty':
      return l10n.scanChartEmpty;
    case 'scan.chart.occupancy':
      return l10n.scanChartOccupancy;
    case 'scan.chart.occupancy.hint':
      return l10n.scanChartOccupancyHint;
    case 'scan.chart.selected':
      return l10n.scanChartSelected;
    case 'scan.chart.signal':
      return l10n.scanChartSignal;
    case 'scan.chart.table':
      return l10n.scanChartTable;
    case 'scan.chart.timescale':
      return l10n.scanChartTimescale;
    case 'scan.chart.unit.dbm':
      return l10n.scanChartUnitDbm;
    case 'scan.chart.unit.pct':
      return l10n.scanChartUnitPct;
    case 'scan.columns.manage':
      return l10n.scanColumnsManage;
    case 'scan.columns.reset':
      return l10n.scanColumnsReset;
    case 'scan.col.band':
      return l10n.scanColBand;
    case 'scan.col.bssid':
      return l10n.scanColBssid;
    case 'scan.col.channel':
      return l10n.scanColChannel;
    case 'scan.col.channelWidth':
      return l10n.scanColChannelWidth;
    case 'scan.col.issues':
      return l10n.scanColIssues;
    case 'scan.col.phyMode':
      return l10n.scanColPhyMode;
    case 'scan.col.rssi':
      return l10n.scanColRssi;
    case 'scan.col.security':
      return l10n.scanColSecurity;
    case 'scan.col.ssid':
      return l10n.scanColSsid;
    case 'scan.col.vendor':
      return l10n.scanColVendor;
    case 'scan.copied':
      return l10n.scanCopied;
    case 'scan.degraded.androidThrottled.body':
      return l10n.scanDegradedAndroidThrottledBody;
    case 'scan.degraded.androidThrottled.title':
      return l10n.scanDegradedAndroidThrottledTitle;
    case 'scan.degraded.demo.body':
      return l10n.scanDegradedDemoBody;
    case 'scan.degraded.demo.title':
      return l10n.scanDegradedDemoTitle;
    case 'scan.degraded.iosConnectedOnly.body':
      return l10n.scanDegradedIosConnectedOnlyBody;
    case 'scan.degraded.iosConnectedOnly.title':
      return l10n.scanDegradedIosConnectedOnlyTitle;
    case 'scan.degraded.linuxNm.body':
      return l10n.scanDegradedLinuxNmBody;
    case 'scan.degraded.linuxNm.title':
      return l10n.scanDegradedLinuxNmTitle;
    case 'scan.degraded.windowsConnectedOnly.body':
      return l10n.scanDegradedWindowsConnectedOnlyBody;
    case 'scan.degraded.windowsConnectedOnly.title':
      return l10n.scanDegradedWindowsConnectedOnlyTitle;
    case 'scan.demo.banner':
      return l10n.scanDemoBanner;
    case 'scan.compare.diffLegend':
      return l10n.scanCompareDiffLegend;
    case 'scan.compare.field':
      return l10n.scanCompareField;
    case 'scan.compare.hint':
      return l10n.scanCompareHint;
    case 'scan.details.band':
      return l10n.scanDetailsBand;
    case 'scan.details.bssid':
      return l10n.scanDetailsBssid;
    case 'scan.details.channel':
      return l10n.scanDetailsChannel;
    case 'scan.details.channelWidth':
      return l10n.scanDetailsChannelWidth;
    case 'scan.details.connected':
      return l10n.scanDetailsConnected;
    case 'scan.details.country':
      return l10n.scanDetailsCountry;
    case 'scan.details.empty':
      return l10n.scanDetailsEmpty;
    case 'scan.details.encryption':
      return l10n.scanDetailsEncryption;
    case 'scan.details.firstSeen':
      return l10n.scanDetailsFirstSeen;
    case 'scan.details.frequencyMHz':
      return l10n.scanDetailsFrequencyMHz;
    case 'scan.details.lastSeen':
      return l10n.scanDetailsLastSeen;
    case 'scan.details.maxRateMbps':
      return l10n.scanDetailsMaxRateMbps;
    case 'scan.details.networkType':
      return l10n.scanDetailsNetworkType;
    case 'scan.details.noiseDbm':
      return l10n.scanDetailsNoiseDbm;
    case 'scan.details.phyMode':
      return l10n.scanDetailsPhyMode;
    case 'scan.details.security':
      return l10n.scanDetailsSecurity;
    case 'scan.details.signalPct':
      return l10n.scanDetailsSignalPct;
    case 'scan.details.signalQuality':
      return l10n.scanDetailsSignalQuality;
    case 'scan.details.snrDb':
      return l10n.scanDetailsSnrDb;
    case 'scan.details.ssid':
      return l10n.scanDetailsSsid;
    case 'scan.details.vendor':
      return l10n.scanDetailsVendor;
    case 'scan.export.all':
      return l10n.scanExportAll;
    case 'scan.export.csv':
      return l10n.scanExportCsv;
    case 'scan.export.selected':
      return l10n.scanExportSelected;
    case 'scan.export.visible':
      return l10n.scanExportVisible;
    case 'scan.field.unavailable':
      return l10n.scanFieldUnavailable;
    case 'scan.file.menu':
      return l10n.scanFileMenu;
    case 'scan.file.open':
      return l10n.scanFileOpen;
    case 'scan.file.save':
      return l10n.scanFileSave;
    case 'scan.print.visible':
      return l10n.scanPrintVisible;
    case 'scan.filter.band':
      return l10n.scanFilterBand;
    case 'scan.filter.band.24':
      return l10n.scanFilterBand24;
    case 'scan.filter.band.5':
      return l10n.scanFilterBand5;
    case 'scan.filter.band.6':
      return l10n.scanFilterBand6;
    case 'scan.filter.band.all':
      return l10n.scanFilterBandAll;
    case 'scan.filter.band6.empty':
      return l10n.scanFilterBand6Empty;
    case 'scan.filter.minRssi':
      return l10n.scanFilterMinRssi;
    case 'scan.filter.open':
      return l10n.scanFilterOpen;
    case 'scan.filter.secure':
      return l10n.scanFilterSecure;
    case 'scan.filterSidebar.chipCount':
      return l10n.scanFilterSidebarChipCount(
        '${values?['label'] ?? ''}',
        _intPlaceholder(values?['count']),
      );
    case 'scan.filterSidebar.clear':
      return l10n.scanFilterSidebarClear;
    case 'scan.filterSidebar.collapse':
      return l10n.scanFilterSidebarCollapse;
    case 'scan.filterSidebar.empty':
      return l10n.scanFilterSidebarEmpty;
    case 'scan.filterSidebar.expand':
      return l10n.scanFilterSidebarExpand;
    case 'scan.filterSidebar.section.band':
      return l10n.scanFilterSidebarSectionBand;
    case 'scan.filterSidebar.section.security':
      return l10n.scanFilterSidebarSectionSecurity;
    case 'scan.filterSidebar.section.vendor':
      return l10n.scanFilterSidebarSectionVendor;
    case 'scan.filterSidebar.title':
      return l10n.scanFilterSidebarTitle;
    case 'scan.filterSidebar.vendor.unknown':
      return l10n.scanFilterSidebarVendorUnknown;
    case 'scan.issue.crowdedChannel':
      return l10n.scanIssueCrowdedChannel;
    case 'scan.issue.dfs':
      return l10n.scanIssueDfs;
    case 'scan.issue.hiddenSsid':
      return l10n.scanIssueHiddenSsid;
    case 'scan.issue.highUtil':
      return l10n.scanIssueHighUtil;
    case 'scan.issue.legacyOnly':
      return l10n.scanIssueLegacyOnly;
    case 'scan.issue.lowSignal':
      return l10n.scanIssueLowSignal;
    case 'scan.issue.lowSnr':
      return l10n.scanIssueLowSnr;
    case 'scan.issue.overlap24':
      return l10n.scanIssueOverlap24;
    case 'scan.issue.weakSecurity':
      return l10n.scanIssueWeakSecurity;
    case 'scan.issue.width40on24':
      return l10n.scanIssueWidth40on24;
    case 'scan.quality.excellent':
      return l10n.scanQualityExcellent;
    case 'scan.quality.fair':
      return l10n.scanQualityFair;
    case 'scan.quality.good':
      return l10n.scanQualityGood;
    case 'scan.quality.poor':
      return l10n.scanQualityPoor;
    case 'scan.quality.unusable':
      return l10n.scanQualityUnusable;
    case 'scan.location.denied':
      return l10n.scanLocationDenied;
    case 'scan.location.granted':
      return l10n.scanLocationGranted;
    case 'scan.location.notDetermined':
      return l10n.scanLocationNotDetermined;
    case 'scan.location.restricted':
      return l10n.scanLocationRestricted;
    case 'scan.scanCore.demo':
      return l10n.scanScanCoreDemo;
    case 'scan.scanCore.error':
      return l10n.scanScanCoreError;
    case 'scan.scanCore.ok':
      return l10n.scanScanCoreOk;
    case 'scan.search.clear':
      return l10n.scanSearchClear;
    case 'scan.search.placeholder':
      return l10n.scanSearchPlaceholder;
    case 'scan.settings.columns.cellRules':
      return l10n.scanSettingsColumnsCellRules;
    case 'scan.settings.advanced.followSystem':
      return l10n.scanSettingsAdvancedFollowSystem;
    case 'scan.settings.advanced.graphLabels':
      return l10n.scanSettingsAdvancedGraphLabels;
    case 'scan.settings.advanced.graphLabels.annotation':
      return l10n.scanSettingsAdvancedGraphLabelsAnnotation;
    case 'scan.settings.advanced.graphLabels.apName':
      return l10n.scanSettingsAdvancedGraphLabelsApName;
    case 'scan.settings.advanced.graphLabels.ssid':
      return l10n.scanSettingsAdvancedGraphLabelsSsid;
    case 'scan.settings.advanced.hideEmptySpectrum':
      return l10n.scanSettingsAdvancedHideEmptySpectrum;
    case 'scan.settings.annotations.add':
      return l10n.scanSettingsAnnotationsAdd;
    case 'scan.settings.annotations.empty':
      return l10n.scanSettingsAnnotationsEmpty;
    case 'scan.settings.annotations.export':
      return l10n.scanSettingsAnnotationsExport;
    case 'scan.settings.annotations.import':
      return l10n.scanSettingsAnnotationsImport;
    case 'scan.settings.annotations.pattern':
      return l10n.scanSettingsAnnotationsPattern;
    case 'scan.settings.annotations.remove':
      return l10n.scanSettingsAnnotationsRemove;
    case 'scan.settings.annotations.text':
      return l10n.scanSettingsAnnotationsText;
    case 'scan.settings.autoStartScan':
      return l10n.scanSettingsAutoStart;
    case 'scan.settings.close':
      return l10n.scanSettingsClose;
    case 'scan.settings.columns.cellRules.enabled':
      return l10n.scanSettingsColumnsCellRulesEnabled;
    case 'scan.settings.columns.cellRules.rssi':
      return l10n.scanSettingsColumnsCellRulesRssi;
    case 'scan.settings.columns.cellRules.security':
      return l10n.scanSettingsColumnsCellRulesSecurity;
    case 'scan.settings.columns.openVisibility':
      return l10n.scanSettingsColumnsOpenVisibility;
    case 'scan.settings.dataSource':
      return l10n.scanSettingsDataSource;
    case 'scan.settings.includeHiddenSsid':
      return l10n.scanSettingsIncludeHiddenSsid;
    case 'scan.settings.language':
      return l10n.scanSettingsLanguage;
    case 'scan.settings.liveScan':
      return l10n.scanSettingsLiveScan;
    case 'scan.settings.open':
      return l10n.scanSettingsOpen;
    case 'scan.settings.scanInterval':
      return l10n.scanSettingsScanInterval;
    case 'scan.settings.scanIntervalSec':
      return l10n.scanSettingsScanIntervalSec(values?['sec'] ?? '');
    case 'scan.settings.signalUnit':
      return l10n.scanSettingsSignalUnit;
    case 'scan.settings.signalUnit.dbm':
      return l10n.scanSettingsSignalUnitDbm;
    case 'scan.settings.signalUnit.percent':
      return l10n.scanSettingsSignalUnitPercent;
    case 'scan.settings.tab.advanced':
      return l10n.scanSettingsTabAdvanced;
    case 'scan.settings.tab.annotations':
      return l10n.scanSettingsTabAnnotations;
    case 'scan.settings.tab.columns':
      return l10n.scanSettingsTabColumns;
    case 'scan.settings.tab.general':
      return l10n.scanSettingsTabGeneral;
    case 'scan.settings.tab.vendor':
      return l10n.scanSettingsTabVendor;
    case 'scan.settings.title':
      return l10n.scanSettingsTitle;
    case 'scan.settings.vendor.bundled':
      return l10n.scanSettingsVendorBundled;
    case 'scan.settings.vendor.entries':
      return l10n.scanSettingsVendorEntries(values?['count'] ?? '');
    case 'scan.settings.vendor.refreshHint':
      return l10n.scanSettingsVendorRefreshHint;
    case 'scan.settings.vendor.updated':
      return l10n.scanSettingsVendorUpdated(values?['date'] ?? '');
    case 'scan.settings.windowTitle':
      return l10n.scanSettingsWindowTitle;
    case 'scan.snapshot.openError':
      return l10n.scanSnapshotOpenError(values?['detail'] ?? '');
    case 'scan.ssid.hidden':
      return l10n.scanSsidHidden;
    case 'scan.status.about':
      return l10n.scanStatusAbout;
    case 'scan.status.found':
      return l10n.scanStatusFound(values?['count'] ?? '');
    case 'scan.status.lastScan':
      return l10n.scanStatusLastScan(values?['time'] ?? '');
    case 'scan.status.location':
      return l10n.scanStatusLocation(values?['state'] ?? '');
    case 'scan.status.scanCore':
      return l10n.scanStatusScanCore(values?['state'] ?? '');
    case 'scan.status.selected':
      return l10n.scanStatusSelected(values?['count'] ?? '');
    case 'scan.status.shortcutsHint':
      return l10n.scanStatusShortcutsHint;
    case 'scan.status.timescaleHint':
      return l10n.scanStatusTimescaleHint;
    case 'scan.status.version':
      return l10n.scanStatusVersion(values?['version'] ?? '');
    case 'scan.tab.advanced':
      return l10n.scanTabAdvanced;
    case 'scan.tab.compare':
      return l10n.scanTabCompare;
    case 'scan.tab.details':
      return l10n.scanTabDetails;
    case 'scan.tab.occupancy':
      return l10n.scanTabOccupancy;
    case 'scan.tab.signal':
      return l10n.scanTabSignal;
    case 'scan.title.demo':
      return l10n.scanTitleDemo;
    case 'scan.title.paused':
      return l10n.scanTitlePaused;
    case 'scan.title.scanning':
      return l10n.scanTitleScanning;
    case 'scan.type.ibss':
      return l10n.scanTypeIbss;
    case 'scan.type.infrastructure':
      return l10n.scanTypeInfrastructure;
    default:
      throw ArgumentError.value(messageKey, 'messageKey', 'Unknown scan message key');
  }
}

String? tryLookupScanMessage(
  AppLocalizations l10n,
  String messageKey, [
  Map<String, Object>? values,
]) {
  try {
    return lookupScanMessage(l10n, messageKey, values);
  } on ArgumentError {
    return null;
  }
}
