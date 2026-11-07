import 'dart:async';

import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../annotations/platform_string_storage.dart';
import '../annotations/string_storage.dart';
import '../location_settings/location_settings.dart';
import 'location_onboarding_dismissed.dart';
import 'location_onboarding_sheet.dart';
import 'location_platform_copy.dart';

/// Electron `LocationOnboarding` — first-run / denied sheet (not demo-gated).
class LocationOnboarding extends StatefulWidget {
  const LocationOnboarding({
    super.key,
    required this.location,
    this.viewingSnapshot = false,
    this.dismissedStore,
    this.storage,
    this.onContinue,
    this.onRetry,
    this.onOpenLocationSettings,
    this.platform,
  });

  final LocationAuthorization location;
  final bool viewingSnapshot;
  final LocationOnboardingDismissedStore? dismissedStore;
  final StringStorage? storage;
  final VoidCallback? onContinue;
  final VoidCallback? onRetry;
  final VoidCallback? onOpenLocationSettings;
  final TargetPlatform? platform;

  @override
  State<LocationOnboarding> createState() => _LocationOnboardingState();
}

class _LocationOnboardingState extends State<LocationOnboarding> {
  late LocationOnboardingDismissedStore _store;
  bool _ready = false;
  bool _dialogOpen = false;
  LocationAuthorization? _closedFor;

  @override
  void initState() {
    super.initState();
    final injected = widget.dismissedStore;
    if (injected != null) {
      _store = injected;
      _ready = true;
    } else {
      _store = LocationOnboardingDismissedStore(
        storage: widget.storage ?? createPlatformStringStorage(),
      );
      _ready = widget.storage != null;
      if (!_ready) {
        unawaited(_hydrate());
      }
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _syncDialog());
  }

  @override
  void didUpdateWidget(LocationOnboarding oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncDialog();
  }

  Future<void> _hydrate() async {
    try {
      final storage = await ensurePlatformStringStorageReady();
      if (!mounted) return;
      _store.attachStorage(storage);
    } catch (_) {
      // keep in-memory
    }
    if (!mounted) return;
    setState(() => _ready = true);
    _syncDialog();
  }

  bool get _shouldOffer =>
      _ready &&
      _closedFor != widget.location &&
      shouldOfferLocationOnboarding(
        input: LocationOnboardingOfferInput(
          locationNeedsSheet: locationNeedsOnboardingSheet(widget.location),
          dismissed: _store.dismissed,
          viewingSnapshot: widget.viewingSnapshot,
        ),
      );

  void _persistDismiss() {
    _store.dismiss();
    _closedFor = widget.location;
    if (mounted) setState(() {});
  }

  void _markClosed() {
    _closedFor = widget.location;
  }

  VoidCallback get _openSettings {
    return widget.onOpenLocationSettings ??
        () => unawaited(openLocationSettings());
  }

  Future<void> _syncDialog() async {
    if (!mounted) return;
    if (!_shouldOffer) {
      if (_dialogOpen && Navigator.of(context, rootNavigator: true).canPop()) {
        Navigator.of(context, rootNavigator: true).pop();
      }
      return;
    }
    if (_dialogOpen) return;
    _dialogOpen = true;
    await showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (dialogContext) {
        return LocationOnboardingSheet(
          location: widget.location,
          platform: widget.platform,
          canOpenSettings:
              widget.onOpenLocationSettings != null || canOpenLocationSettings,
          onOpenLocationSettings: _openSettings,
          onClose: () {
            _persistDismiss();
            Navigator.of(dialogContext).pop();
          },
          onContinue: () {
            _persistDismiss();
            Navigator.of(dialogContext).pop();
            widget.onContinue?.call();
          },
          onRetry: () {
            _markClosed();
            Navigator.of(dialogContext).pop();
            (widget.onRetry ?? widget.onContinue)?.call();
          },
        );
      },
    );
    if (mounted) {
      if (!_store.dismissed && _closedFor != widget.location) {
        _persistDismiss();
      }
      setState(() => _dialogOpen = false);
    } else {
      _dialogOpen = false;
    }
  }

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}
