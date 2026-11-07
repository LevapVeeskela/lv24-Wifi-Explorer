import 'package:flutter/material.dart';

import 'appearance_controller.dart';

class AppearanceScope extends InheritedNotifier<AppearanceController> {
  const AppearanceScope({
    super.key,
    required AppearanceController controller,
    required super.child,
  }) : super(notifier: controller);

  static AppearanceController of(BuildContext context) {
    final scope =
        context.dependOnInheritedWidgetOfExactType<AppearanceScope>();
    assert(scope != null, 'AppearanceScope not found');
    return scope!.notifier!;
  }

  static AppearanceController? maybeOf(BuildContext context) {
    return context
        .dependOnInheritedWidgetOfExactType<AppearanceScope>()
        ?.notifier;
  }
}
