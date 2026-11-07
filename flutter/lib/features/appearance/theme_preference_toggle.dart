import 'package:flutter/material.dart';

import '../../shared/i18n/app_localizations.dart';
import '../scan_settings/apply_appearance_follow_system.dart';
import '../scan_settings/scan_settings_scope.dart';
import 'appearance_controller.dart';
import 'appearance_scope.dart';
import 'theme_preference.dart';

/// Light / dark / system theme picker for toolbars and menus.
class ThemePreferenceToggle extends StatelessWidget {
  const ThemePreferenceToggle({
    super.key,
    this.iconOnly = true,
    this.controller,
  });

  final bool iconOnly;
  final AppearanceController? controller;

  void _select(
    BuildContext context,
    AppearanceController appearance,
    ThemePreference next,
  ) {
    final scan = ScanSettingsScope.maybeOf(context);
    if (scan == null) {
      appearance.setPreference(next);
      return;
    }
    if (next == ThemePreference.system) {
      scan.patch(appearanceFollowSystem: true);
      return;
    }
    scan.patch(appearanceFollowSystem: false);
    appearance.setPreference(next);
  }

  @override
  Widget build(BuildContext context) {
    final appearance = controller ?? AppearanceScope.of(context);
    final scan = ScanSettingsScope.maybeOf(context);
    final l10n = AppLocalizations.of(context);
    final ru = l10n.localeName.startsWith('ru');

    return ListenableBuilder(
      listenable: Listenable.merge([
        appearance,
        if (scan != null) scan,
      ]),
      builder: (context, _) {
        final current = resolveThemePreference(
          appearanceFollowSystem:
              scan?.settings.appearanceFollowSystem ?? false,
          stored: appearance.preference,
        );
        if (iconOnly) {
          return PopupMenuButton<ThemePreference>(
            tooltip: ru ? 'Тема оформления' : 'Theme',
            icon: Icon(current.icon),
            initialValue: current,
            onSelected: (next) => _select(context, appearance, next),
            itemBuilder: (context) => [
              for (final option in ThemePreference.values)
                CheckedPopupMenuItem<ThemePreference>(
                  value: option,
                  checked: option == current,
                  child: Text(option.label(ru: ru)),
                ),
            ],
          );
        }

        return SegmentedButton<ThemePreference>(
          showSelectedIcon: false,
          segments: [
            for (final option in ThemePreference.values)
              ButtonSegment(
                value: option,
                icon: Icon(option.icon, size: 18),
                label: Text(option.label(ru: ru)),
              ),
          ],
          selected: {current},
          onSelectionChanged: (next) {
            if (next.isEmpty) return;
            _select(context, appearance, next.first);
          },
        );
      },
    );
  }
}
