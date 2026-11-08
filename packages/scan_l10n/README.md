# scan_l10n

Scan UI strings for LV24 WiFi Explorer Flutter clients, aligned with **lv24 city mobile** localization layout:

| Donor (city app)           | This package                             |
| -------------------------- | ---------------------------------------- |
| `mobile/app/l10n.yaml`     | `l10n.yaml`                              |
| `lib/core/l10n/app_*.arb`  | `lib/core/l10n/app_en.arb`, `app_ru.arb` |
| `lib/core/l10n/generated/` | `lib/core/l10n/generated/` (committed)   |

- **Locales:** `ru` (product default), `en`. No `zh` in this package.
- **Fallback:** unknown language codes resolve to `ru` via [ScanLocale] and [ScanL10n.fromLanguageCode].
- **Key parity:** ARB entries document the Electron/TS `MessageKey` (`scan.status.found`, …). [ScanL10n.message] keeps that dot-key API for non-widget code.

## Regenerate

From this directory (requires Flutter SDK):

```bash
flutter gen-l10n
# or, if `flutter` is blocked by Xcode license:
dart /path/to/flutter/packages/flutter_tools/bin/flutter_tools.dart gen-l10n
```

After editing ARBs, regenerate `lib/core/l10n/generated/*` and update `lib/src/scan_message_lookup.dart` (switch on dot keys → `AppLocalizations` getters).

## Flutter app usage

When `flutter/` exists, either:

1. **Depend on this package** and wire `AppLocalizations.delegate` from `package:scan_l10n/scan_l10n.dart`, or
2. **Copy the same `l10n.yaml` + `lib/core/l10n/` layout** into the app (city mobile pattern) if the app owns all strings.

Prefer (1) for scan-only strings shared across runners.
