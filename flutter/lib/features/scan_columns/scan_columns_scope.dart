import 'package:flutter/widgets.dart';

import 'scan_column_visibility.dart';
import 'scan_columns_controller.dart';

class ScanColumnsScope extends InheritedNotifier<ScanColumnsController> {
  const ScanColumnsScope({
    super.key,
    required ScanColumnsController controller,
    required super.child,
  }) : super(notifier: controller);

  static ScanColumnsController of(BuildContext context) {
    final scope =
        context.dependOnInheritedWidgetOfExactType<ScanColumnsScope>();
    assert(scope != null, 'ScanColumnsScope not found');
    return scope!.notifier!;
  }

  static ScanColumnsController? maybeOf(BuildContext context) {
    return context
        .dependOnInheritedWidgetOfExactType<ScanColumnsScope>()
        ?.notifier;
  }

  static ScanColumnVisibility visibilityOf(BuildContext context) {
    return of(context).visibility;
  }
}

class PersistedScanColumns extends StatefulWidget {
  const PersistedScanColumns({
    super.key,
    required this.child,
    this.controller,
  });

  final Widget child;
  final ScanColumnsController? controller;

  @override
  State<PersistedScanColumns> createState() => _PersistedScanColumnsState();
}

class _PersistedScanColumnsState extends State<PersistedScanColumns> {
  late final ScanColumnsController _controller;
  late final bool _ownsController;

  @override
  void initState() {
    super.initState();
    _ownsController = widget.controller == null;
    _controller = widget.controller ?? ScanColumnsController();
    _controller.load();
  }

  @override
  void dispose() {
    if (_ownsController) _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScanColumnsScope(
      controller: _controller,
      child: widget.child,
    );
  }
}
