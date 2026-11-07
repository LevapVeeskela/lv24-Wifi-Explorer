import 'dart:async';

import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../shared/i18n/app_localizations.dart';
import 'format_last_scan_label.dart';
import 'scan_core_state.dart';
import 'status_bar_caption.dart';
import 'status_bar_demo_badge.dart';

class ScanStatusBar extends StatefulWidget {
  const ScanStatusBar({
    super.key,
    required this.networkCount,
    required this.selectedCount,
    required this.demo,
    required this.location,
    required this.lastSnapshotAt,
    this.scanCoreError = false,
    this.running = false,
    this.latestRowLastSeenAt,
  });

  final int networkCount;
  final int selectedCount;
  final bool demo;
  final bool scanCoreError;
  /// Kept for call-site compatibility; scan line uses [ScanCoreState], not running.
  final bool running;
  final LocationAuthorization location;
  final DateTime? lastSnapshotAt;
  /// Fallback when [lastSnapshotAt] is null (Electron `baseRows` max `lastSeenAt`).
  final DateTime? latestRowLastSeenAt;

  @override
  State<ScanStatusBar> createState() => _ScanStatusBarState();
}

class _ScanStatusBarState extends State<ScanStatusBar> {
  Timer? _relativeTimeTick;

  @override
  void initState() {
    super.initState();
    _relativeTimeTick = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _relativeTimeTick?.cancel();
    super.dispose();
  }

  DateTime? _effectiveLastSeen() {
    if (widget.lastSnapshotAt != null) return widget.lastSnapshotAt;
    return widget.latestRowLastSeenAt;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final scheme = Theme.of(context).colorScheme;
    final scanCore = scanCoreStateFromFlags(
      demo: widget.demo,
      error: widget.scanCoreError,
    );
    final scanCoreStateLabel = switch (scanCore) {
      ScanCoreState.demo => l10n.scanScanCoreDemo,
      ScanCoreState.error => l10n.scanScanCoreError,
      ScanCoreState.ok => l10n.scanScanCoreOk,
    };
    final locationLabel = switch (widget.location) {
      LocationAuthorization.granted => l10n.scanLocationGranted,
      LocationAuthorization.denied => l10n.scanLocationDenied,
      LocationAuthorization.restricted => l10n.scanLocationRestricted,
      LocationAuthorization.notDetermined => l10n.scanLocationNotDetermined,
    };
    final lastRelative = formatLastScanLabel(_effectiveLastSeen());

    return Material(
      color: scheme.surface,
      child: Container(
        constraints: const BoxConstraints(minHeight: 28, maxHeight: 32),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: scheme.outline)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Semantics(
                liveRegion: true,
                child: Row(
                  children: [
                    StatusBarCaption(l10n.scanStatusFound(widget.networkCount)),
                    const SizedBox(width: 16),
                    StatusBarCaption(l10n.scanStatusSelected(widget.selectedCount)),
                  ],
                ),
              ),
            ),
            Flexible(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (widget.demo) ...[
                    const StatusBarDemoBadge(),
                    const SizedBox(width: 8),
                  ],
                  Flexible(
                    child: StatusBarCaption(l10n.scanStatusScanCore(scanCoreStateLabel)),
                  ),
                  const SizedBox(width: 16),
                  Flexible(
                    child: StatusBarCaption(l10n.scanStatusLocation(locationLabel)),
                  ),
                  const SizedBox(width: 16),
                  Flexible(
                    child: StatusBarCaption(l10n.scanStatusLastScan(lastRelative)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
