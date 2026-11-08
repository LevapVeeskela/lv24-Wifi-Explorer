import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_shortcuts/scan_workbench_shortcut_bindings.dart';

void main() {
  test('digits are bound only with the primary modifier', () {
    final bindings = buildScanWorkbenchShortcutBindings();
    final digit = LogicalKeySet(LogicalKeyboardKey.digit1);

    expect(
      bindings.containsKey(digit),
      isFalse,
      reason: 'unmodified digits must reach TextField (search/notes)',
    );

    if (scanShortcutUseDesktopTabDigits) {
      expect(
        bindings.containsKey(
          LogicalKeySet(scanShortcutPrimaryModifier, LogicalKeyboardKey.digit1),
        ),
        isTrue,
      );
    }
  });
}
