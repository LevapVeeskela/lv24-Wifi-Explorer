import 'package:flutter/widgets.dart';

/// Toggle scan start/stop (Electron menu: Mod+Shift+S / Mod+Shift+T).
class ToggleScanShortcutIntent extends Intent {
  const ToggleScanShortcutIntent();
}

/// Switch details pane tab by index 0..3 (details, signal, occupancy, advanced).
class SetScanDetailsTabShortcutIntent extends Intent {
  const SetScanDetailsTabShortcutIntent(this.index);

  final int index;
}
