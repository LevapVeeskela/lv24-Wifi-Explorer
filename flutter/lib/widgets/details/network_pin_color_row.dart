import 'package:flutter/material.dart';

import '../../features/annotations/annotations.dart';
import '../../features/scan_details/series_color.dart';

/// Same sunset hues as [seriesColorForBssid] (Electron grid swatch palette).
const _palette = <Color>[
  Color(0xFFFB6E4A),
  Color(0xFFA78BFA),
  Color(0xFF34D399),
  Color(0xFFFBBF24),
  Color(0xFF38BDF8),
  Color(0xFFFB7185),
  Color(0xFFFCA98B),
  Color(0xFFC4B5FD),
  Color(0xFF6EE7B7),
  Color(0xFFFCD34D),
  Color(0xFF7DD3FC),
  Color(0xFFFDA4AF),
];

class NetworkPinColorRow extends StatelessWidget {
  const NetworkPinColorRow({
    super.key,
    required this.label,
    required this.bssid,
    required this.pinnedHex,
    required this.enabled,
    required this.onPick,
    required this.onClear,
    required this.autoLabel,
  });

  final String label;
  final String bssid;
  final String? pinnedHex;
  final bool enabled;
  final ValueChanged<String> onPick;
  final VoidCallback onClear;
  final String autoLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final autoColor = seriesColorForBssid(bssid);
    final activeHex = pinnedHex ?? colorToHex(autoColor);
    final isPinned = pinnedHex != null;

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
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                for (final color in _palette)
                  _Swatch(
                    color: color,
                    selected: activeHex.toUpperCase() == colorToHex(color).toUpperCase(),
                    enabled: enabled,
                    onTap: () => onPick(colorToHex(color)),
                  ),
                TextButton(
                  onPressed: !enabled || !isPinned ? null : onClear,
                  child: Text(autoLabel),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Swatch extends StatelessWidget {
  const _Swatch({
    required this.color,
    required this.selected,
    required this.enabled,
    required this.onTap,
  });

  final Color color;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? onTap : null,
        customBorder: const CircleBorder(),
        child: Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color,
            border: Border.all(
              color: selected ? scheme.primary : scheme.outline.withValues(alpha: 0.5),
              width: selected ? 2.5 : 1,
            ),
          ),
        ),
      ),
    );
  }
}
