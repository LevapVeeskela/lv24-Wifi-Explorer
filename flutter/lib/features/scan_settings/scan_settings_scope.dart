import 'package:flutter/widgets.dart';

import 'scan_settings_controller.dart';

class ScanSettingsScope extends InheritedNotifier<ScanSettingsController> {
  ScanSettingsScope({
    super.key,
    required ScanSettingsController controller,
    required super.child,
  }) : super(notifier: controller);

  static ScanSettingsController? maybeOf(BuildContext context) {
    return context
        .dependOnInheritedWidgetOfExactType<ScanSettingsScope>()
        ?.notifier;
  }

  static ScanSettingsController of(BuildContext context) {
    final controller = maybeOf(context);
    assert(
      controller != null,
      'ScanSettingsScope not found in context',
    );
    return controller!;
  }
}
