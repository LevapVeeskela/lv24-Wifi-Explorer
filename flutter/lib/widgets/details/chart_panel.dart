import 'package:flutter/material.dart';

class ChartPanel extends StatelessWidget {
  const ChartPanel({
    super.key,
    required this.title,
    required this.child,
    this.toolbar,
    this.footer,
    this.semanticsLabel,
  });

  final String title;
  final Widget child;
  final Widget? toolbar;
  final Widget? footer;
  final String? semanticsLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      label: semanticsLabel ?? title,
      container: true,
      child: Card(
        margin: EdgeInsets.zero,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: theme.colorScheme.outlineVariant),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(title, style: theme.textTheme.titleSmall),
                  ),
                  if (toolbar != null) toolbar!,
                ],
              ),
              const SizedBox(height: 6),
              child,
              if (footer != null) ...[
                const SizedBox(height: 4),
                footer!,
              ],
            ],
          ),
        ),
      ),
    );
  }
}
