import 'package:flutter/widgets.dart';

import 'column_rules_config.dart';
import 'column_rules_controller.dart';

class ColumnRulesScope extends InheritedNotifier<ColumnRulesController> {
  const ColumnRulesScope({
    super.key,
    required ColumnRulesController controller,
    required super.child,
  }) : super(notifier: controller);

  static ColumnRulesController of(BuildContext context) {
    final scope =
        context.dependOnInheritedWidgetOfExactType<ColumnRulesScope>();
    assert(scope != null, 'ColumnRulesScope not found');
    return scope!.notifier!;
  }

  static ColumnRulesController? maybeOf(BuildContext context) {
    return context
        .dependOnInheritedWidgetOfExactType<ColumnRulesScope>()
        ?.notifier;
  }

  static ColumnRulesConfig configOf(BuildContext context) {
    return of(context).config;
  }

  /// Re-parent [controller] above an overlay route (dialog sibling of workbench).
  static Widget overlay({
    required ColumnRulesController? controller,
    required Widget child,
  }) {
    if (controller == null) return child;
    return ColumnRulesScope(controller: controller, child: child);
  }
}

class PersistedColumnRules extends StatefulWidget {
  const PersistedColumnRules({
    super.key,
    required this.child,
    this.controller,
  });

  final Widget child;
  final ColumnRulesController? controller;

  @override
  State<PersistedColumnRules> createState() => _PersistedColumnRulesState();
}

class _PersistedColumnRulesState extends State<PersistedColumnRules> {
  late final ColumnRulesController _controller;
  late final bool _ownsController;

  @override
  void initState() {
    super.initState();
    _ownsController = widget.controller == null;
    _controller = widget.controller ?? ColumnRulesController();
  }

  @override
  void dispose() {
    if (_ownsController) _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ColumnRulesScope(
      controller: _controller,
      child: widget.child,
    );
  }
}
