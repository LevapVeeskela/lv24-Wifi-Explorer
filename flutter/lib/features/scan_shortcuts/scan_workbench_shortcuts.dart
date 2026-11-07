import 'package:flutter/widgets.dart';

import 'scan_shortcut_intents.dart';
import 'scan_workbench_shortcut_bindings.dart';

/// Wraps the scan workbench with [Shortcuts] / [Actions] for start/stop and details tabs.
class ScanWorkbenchShortcuts extends StatelessWidget {
  const ScanWorkbenchShortcuts({
    super.key,
    required this.onToggleScan,
    required this.onDetailsTabIndex,
    required this.child,
  });

  final VoidCallback onToggleScan;
  final ValueChanged<int> onDetailsTabIndex;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Shortcuts(
      shortcuts: buildScanWorkbenchShortcutBindings(),
      child: Actions(
        actions: <Type, Action<Intent>>{
          ToggleScanShortcutIntent: CallbackAction<ToggleScanShortcutIntent>(
            onInvoke: (_) {
              onToggleScan();
              return null;
            },
          ),
          SetScanDetailsTabShortcutIntent:
              CallbackAction<SetScanDetailsTabShortcutIntent>(
            onInvoke: (intent) {
              if (intent.index < 0 || intent.index > 3) return null;
              onDetailsTabIndex(intent.index);
              return null;
            },
          ),
        },
        child: Focus(
          autofocus: true,
          child: child,
        ),
      ),
    );
  }
}
