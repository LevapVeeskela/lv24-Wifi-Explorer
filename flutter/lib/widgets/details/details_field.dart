import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class DetailsField extends StatelessWidget {
  const DetailsField({
    super.key,
    required this.label,
    required this.value,
    this.mono = false,
    this.unavailable = false,
    this.unavailableHint,
  });

  final String label;
  final String value;
  final bool mono;
  final bool unavailable;
  final String? unavailableHint;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final display = unavailable ? (unavailableHint ?? '—') : value;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 132,
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: SelectableText(
              display,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontFamily: mono ? 'monospace' : null,
                color: unavailable ? theme.colorScheme.onSurfaceVariant : null,
                fontStyle: unavailable ? FontStyle.italic : null,
              ),
            ),
          ),
          if (!unavailable && display.isNotEmpty && display != '—')
            IconButton(
              visualDensity: VisualDensity.compact,
              iconSize: 16,
              tooltip: 'Copy',
              onPressed: () {
                Clipboard.setData(ClipboardData(text: display));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(display.length > 40 ? '${display.substring(0, 40)}…' : display),
                    duration: const Duration(seconds: 1),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              icon: const Icon(Icons.copy_outlined),
            ),
        ],
      ),
    );
  }
}
