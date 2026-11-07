import 'package:flutter/material.dart';
import 'package:lv24_sunset_theme/lv24_sunset_theme.dart';
import 'package:scan_domain/scan_domain.dart';
import 'package:scan_l10n/scan_l10n.dart';

import 'ie_l10n.dart';
import 'ie_source.dart';

/// Readable IE tree for the Advanced details tab (Electron AdvancedIeTree).
class IeTreePanel extends StatelessWidget {
  const IeTreePanel({super.key, required this.bss});

  final ObservedBss bss;

  @override
  Widget build(BuildContext context) {
    final decoded = decodeIesForObservedBss(bss);
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    final scanL10n = ScanL10n.fromLanguageCode(
      Localizations.localeOf(context).languageCode,
    );
    final absent =
        bss.ie.level == 'absent' && decoded.level == IeParseLevel.absent;

    if (absent) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(0, 4, 0, 8),
        child: Text(
          l10n.scanFieldUnavailable,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
            fontStyle: FontStyle.italic,
          ),
        ),
      );
    }

    if (decoded.level == IeParseLevel.shallowTags &&
        decoded.elements.isNotEmpty) {
      final tree = buildIeTree(decoded);
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: _IeTreeRows(
          nodes: tree,
          depth: 0,
          theme: theme,
          l10n: scanL10n,
        ),
      );
    }

    final raw = bss.lastRaw.informationElementData;
    if (raw != null && raw.isNotEmpty) {
      return _RawBytesPlaceholder(
        bytes: raw,
        levelLabel: localizeIeTreeValue(scanL10n, decoded.level.wire),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Text(
        '${localizeIeTreeValue(scanL10n, decoded.level.wire)} · ${decoded.byteLength} B',
        style: theme.textTheme.bodyMedium?.copyWith(
          fontFamily: 'monospace',
          color: theme.colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _IeTreeRows extends StatelessWidget {
  const _IeTreeRows({
    required this.nodes,
    required this.depth,
    required this.theme,
    required this.l10n,
  });

  final List<IeTreeNode> nodes;
  final int depth;
  final ThemeData theme;
  final ScanL10n l10n;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final node in nodes) ...[
          _IeTreeRow(node: node, depth: depth, theme: theme, l10n: l10n),
          if (node.children.isNotEmpty)
            _IeTreeRows(
              nodes: node.children,
              depth: depth + 1,
              theme: theme,
              l10n: l10n,
            ),
        ],
      ],
    );
  }
}

class _IeTreeRow extends StatelessWidget {
  const _IeTreeRow({
    required this.node,
    required this.depth,
    required this.theme,
    required this.l10n,
  });

  final IeTreeNode node;
  final int depth;
  final ThemeData theme;
  final ScanL10n l10n;

  @override
  Widget build(BuildContext context) {
    final elementRoot = isElementRootTreeKey(node.key);
    final scheme = theme.colorScheme;
    final label = localizeIeTreeLabel(l10n, node);
    final value = node.value == null ? null : localizeIeTreeValue(l10n, node.value);

    final labelStyle = (elementRoot
            ? theme.textTheme.bodyMedium
            : theme.textTheme.bodySmall)
        ?.copyWith(
      fontFamily: 'monospace',
      fontWeight: elementRoot ? FontWeight.w600 : FontWeight.normal,
      color: elementRoot ? scheme.onSurface : scheme.onSurfaceVariant,
      height: 1.35,
    );
    final valueStyle = theme.textTheme.bodySmall?.copyWith(
      fontFamily: 'monospace',
      color: scheme.onSurfaceVariant,
      height: 1.35,
    );

    return Padding(
      padding: EdgeInsets.only(
        left: 8 + depth * 12.0,
        top: elementRoot ? 8 : 2,
        bottom: 2,
      ),
      child: Wrap(
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 8,
        runSpacing: 4,
        children: [
          if (elementRoot)
            Container(
              width: 3,
              height: 12,
              decoration: BoxDecoration(
                color: AppColors.coral.withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          SelectableText(label, style: labelStyle),
          if (value != null && value.isNotEmpty)
            SelectableText(value, style: valueStyle),
        ],
      ),
    );
  }
}

class _RawBytesPlaceholder extends StatelessWidget {
  const _RawBytesPlaceholder({required this.bytes, required this.levelLabel});

  final List<int> bytes;
  final String levelLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$levelLabel · ${bytes.length} B',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 6),
        SelectableText(
          formatHexSpaced(bytes),
          style: theme.textTheme.bodySmall?.copyWith(
            fontFamily: 'monospace',
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
