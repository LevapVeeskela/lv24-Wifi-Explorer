import 'package:scan_l10n/scan_l10n.dart';

/// Demo workbench accessors; shared scan strings come from [AppLocalizations].
extension ScanWorkbenchL10n on AppLocalizations {
  String get appTitle => scanAboutTitle;

  String get scanStart => _ru ? 'Старт' : 'Start';

  String get scanStop => _ru ? 'Стоп' : 'Stop';

  String get demoChip => scanTitleDemo;

  String get demoBanner => scanDemoBanner;

  String get colSsid => scanColSsid;

  String get colVendor => scanColVendor;

  String get colBssid => scanColBssid;

  String get colRssi => scanColRssi;

  String get colChannel => scanColChannel;

  String get colBand => scanColBand;

  String get colWidth => scanColChannelWidth;

  String get colSecurity => scanColSecurity;

  String get colPhy => scanColPhyMode;

  String get detailsTitle => scanTabDetails;

  String get detailsEmpty => scanDetailsEmpty;

  String get detailsSsid => scanDetailsSsid;

  String get detailsBssid => scanDetailsBssid;

  String get detailsSignal => scanDetailsSignalPct;

  String get detailsQuality => scanDetailsSignalQuality;

  String get detailsNoise => scanDetailsNoiseDbm;

  String get detailsSnr => scanDetailsSnrDb;

  String get detailsChannel => scanDetailsChannel;

  String get detailsBand => scanDetailsBand;

  String get detailsWidth => scanDetailsChannelWidth;

  String get detailsSecurity => scanDetailsSecurity;

  String get detailsPhy => scanDetailsPhyMode;

  String get detailsVendor => scanDetailsVendor;

  String get detailsCountry => scanDetailsCountry;

  String get detailsLastSeen => scanDetailsLastSeen;

  String statusNetworks(int count) => scanStatusFound(count);

  String statusSelected(int count) => scanStatusSelected(count);

  String statusScanCore(String state) => scanStatusScanCore(state);

  String statusLocation(String state) => scanStatusLocation(state);

  String get scanCoreDemo => scanScanCoreDemo;

  String get scanCoreIdle => scanScanCoreOk;

  String get scanCoreLive => scanTitleScanning;

  String get locationGranted => scanLocationGranted;

  String get locationDenied => scanLocationDenied;

  String get locationRestricted => scanLocationRestricted;

  String get locationUnknown => scanLocationNotDetermined;

  String get redacted => _ru ? 'скрыто' : 'redacted';

  String get hiddenSsid => scanSsidHidden;

  String get scanColumnsProfileDefault => _ru ? 'По умолчанию' : 'Default';

  String get scanColumnsProfiles => _ru ? 'Профиль' : 'Profile';

  String get scanColumnsSaveProfile =>
      _ru ? 'Сохранить профиль' : 'Save profile';

  String get scanColumnsDeleteProfile =>
      _ru ? 'Удалить профиль' : 'Delete profile';

  String get scanColumnsProfileNameHint => _ru ? 'Имя профиля' : 'Profile name';

  String get emDash => '—';

  String get qualityExcellent => scanQualityExcellent;

  String get qualityGood => scanQualityGood;

  String get qualityFair => scanQualityFair;

  String get qualityPoor => scanQualityPoor;

  String get qualityUnusable => scanQualityUnusable;

  String scanMessage(String messageKey, [Map<String, Object>? values]) =>
      lookupScanMessage(this, messageKey, values);

  bool get _ru => localeName.startsWith('ru');
}
