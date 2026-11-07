import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import 'scan_shortcut_intents.dart';

/// Primary modifier for workbench shortcuts (⌘ on macOS/iOS, Ctrl elsewhere).
LogicalKeyboardKey get scanShortcutPrimaryModifier {
  switch (defaultTargetPlatform) {
    case TargetPlatform.macOS:
    case TargetPlatform.iOS:
      return LogicalKeyboardKey.meta;
    default:
      return LogicalKeyboardKey.control;
  }
}

bool get scanShortcutUseDesktopTabDigits {
  if (kIsWeb) return false;
  switch (defaultTargetPlatform) {
    case TargetPlatform.android:
    case TargetPlatform.iOS:
      return false;
    default:
      return true;
  }
}

const _digitKeys = <LogicalKeyboardKey>[
  LogicalKeyboardKey.digit1,
  LogicalKeyboardKey.digit2,
  LogicalKeyboardKey.digit3,
  LogicalKeyboardKey.digit4,
];

const _numpadKeys = <LogicalKeyboardKey>[
  LogicalKeyboardKey.numpad1,
  LogicalKeyboardKey.numpad2,
  LogicalKeyboardKey.numpad3,
  LogicalKeyboardKey.numpad4,
];

/// Keyboard bindings for the scan workbench (parity with Electron scan-shortcuts).
Map<ShortcutActivator, Intent> buildScanWorkbenchShortcutBindings() {
  final mod = scanShortcutPrimaryModifier;
  const toggleScan = ToggleScanShortcutIntent();
  final bindings = <ShortcutActivator, Intent>{
    // Electron menu: Start/Stop Scan (Mod+P is Print Visible Table).
    LogicalKeySet(mod, LogicalKeyboardKey.shift, LogicalKeyboardKey.keyS):
        toggleScan,
    LogicalKeySet(mod, LogicalKeyboardKey.shift, LogicalKeyboardKey.keyT):
        toggleScan,
  };

  for (var i = 0; i < 4; i++) {
    final intent = SetScanDetailsTabShortcutIntent(i);
    bindings[LogicalKeySet(_digitKeys[i])] = intent;
    bindings[LogicalKeySet(_numpadKeys[i])] = intent;
    if (scanShortcutUseDesktopTabDigits) {
      bindings[LogicalKeySet(mod, _digitKeys[i])] = intent;
      bindings[LogicalKeySet(mod, _numpadKeys[i])] = intent;
    }
  }

  return bindings;
}
