import 'package:flutter/material.dart';

/// Dense caption line matching Electron status bar `Typography` `caption`.
class StatusBarCaption extends StatelessWidget {
  const StatusBarCaption(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final style = theme.textTheme.labelSmall?.copyWith(
      color: scheme.onSurfaceVariant,
      height: 1.2,
    );
    return Text(text, style: style, maxLines: 1, overflow: TextOverflow.ellipsis);
  }
}
