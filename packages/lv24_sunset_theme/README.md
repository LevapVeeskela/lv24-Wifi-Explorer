# lv24_sunset_theme

LV24 «Sunset» design system for Flutter: [AppColors], [AppTheme], [LvTokens], [LvMotion], plus bundled **Manrope** and **Plus Jakarta Sans** (asset fonts, no `google_fonts`).

Colors match the city web theme (`frontend/src/shared/lib/theme`).

## Use in WiFi Explorer Flutter

Add a path dependency from the app (e.g. `flutter/pubspec.yaml`):

```yaml
dependencies:
  lv24_sunset_theme:
    path: ../packages/lv24_sunset_theme
```

Then:

```dart
import 'package:lv24_sunset_theme/lv24_sunset_theme.dart';

MaterialApp(
  theme: AppTheme.light,
  darkTheme: AppTheme.dark,
  themeMode: ThemeMode.system,
  // ...
);
```

Access spacing / motion via `context.lvTokens` and `context.lvMotion`, or `LvTokens.of(context)` / `LvMotion.of(context)`.

Fonts ship with this package; the host app does not need duplicate `fonts:` entries.

## Fonts

SIL Open Font License — see `fonts/Manrope-OFL.txt` and `fonts/PlusJakartaSans-OFL.txt`.
