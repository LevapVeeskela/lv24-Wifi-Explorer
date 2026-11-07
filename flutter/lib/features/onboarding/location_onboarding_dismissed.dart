import '../annotations/string_storage.dart';

/// Electron `STORAGE_LOCATION_ONBOARDING_DISMISSED`.
const locationOnboardingDismissedStorageKey =
    'lv24.wifi-explorer.location-onboarding-dismissed';

/// Persisted first-run / denied sheet dismissal (`localStorage` parity).
class LocationOnboardingDismissedStore {
  LocationOnboardingDismissedStore({StringStorage? storage, bool? dismissed})
    : _storage = storage,
      _dismissed = dismissed ?? _read(storage);

  StringStorage? _storage;
  bool _dismissed;

  bool get dismissed => _dismissed;

  static bool _read(StringStorage? storage) {
    try {
      return storage?.read(locationOnboardingDismissedStorageKey) == '1';
    } catch (_) {
      return false;
    }
  }

  void attachStorage(StringStorage storage) {
    _storage = storage;
    _dismissed = _read(storage);
  }

  void dismiss() {
    _dismissed = true;
    try {
      _storage?.write(locationOnboardingDismissedStorageKey, '1');
    } catch (_) {
      // quota / unavailable — keep in-memory only
    }
  }
}

/// First-run sheet for not-determined or denied. Restricted is banner-only.
bool shouldOfferLocationOnboarding({
  required LocationOnboardingOfferInput input,
}) {
  if (input.viewingSnapshot || input.dismissed) return false;
  return input.locationNeedsSheet;
}

class LocationOnboardingOfferInput {
  const LocationOnboardingOfferInput({
    required this.locationNeedsSheet,
    required this.dismissed,
    this.viewingSnapshot = false,
  });

  final bool locationNeedsSheet;
  final bool dismissed;
  final bool viewingSnapshot;
}
