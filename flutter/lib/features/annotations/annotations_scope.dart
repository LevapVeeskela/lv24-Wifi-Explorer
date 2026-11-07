import 'package:flutter/widgets.dart';

import 'annotations_controller.dart';

class AnnotationsScope extends InheritedNotifier<AnnotationsController> {
  const AnnotationsScope({
    super.key,
    required AnnotationsController controller,
    required super.child,
  }) : super(notifier: controller);

  static AnnotationsController? maybeOf(BuildContext context) {
    return context
        .dependOnInheritedWidgetOfExactType<AnnotationsScope>()
        ?.notifier;
  }

  static AnnotationsController of(BuildContext context) {
    final controller = maybeOf(context);
    assert(controller != null, 'AnnotationsScope not found in context');
    return controller!;
  }
}
