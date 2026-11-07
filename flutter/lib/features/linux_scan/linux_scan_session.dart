import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:scan_core_client/scan_core_client.dart';
import 'package:scan_domain/scan_domain.dart';

import 'linux_scan_adapter.dart';

/// Workbench session backed by the Linux NetworkManager adapter (demo fallback).
class LinuxScanSession extends ChangeNotifier {
  LinuxScanSession({
    String? repoRoot,
    LinuxScanAdapter? adapter,
    Duration pollInterval = const Duration(seconds: 5),
  }) : _adapter = adapter ?? LinuxScanAdapter(repoRoot: repoRoot),
       _pollInterval = pollInterval;

  final LinuxScanAdapter _adapter;
  final Duration _pollInterval;

  Timer? _timer;
  bool _running = false;

  List<ObservedBss> _rows = const [];
  String? _selectedKey;
  String? _connectedBssid;
  bool _demo = true;
  LinuxScanMode _mode = LinuxScanMode.demo;
  LocationAuthorization _location = LocationAuthorization.notDetermined;
  DateTime? _lastSnapshotAt;
  ScanErrorDto? _lastError;

  List<ObservedBss> get rows => _rows;
  String? get connectedBssid => _connectedBssid;
  ObservedBss? get selected {
    if (_selectedKey == null) return null;
    for (final row in _rows) {
      if (_keyOf(row) == _selectedKey) return row;
    }
    return null;
  }

  bool get isRunning => _running;
  bool get demo => _demo;
  LinuxScanMode get mode => _mode;
  LocationAuthorization get location => _location;
  DateTime? get lastSnapshotAt => _lastSnapshotAt;
  ScanErrorDto? get lastError => _lastError;
  bool get isLinuxAdapter => _adapter.isSupported;

  Future<void> start() async {
    if (_running) return;
    _running = true;
    await refresh();
    _timer?.cancel();
    _timer = Timer.periodic(_pollInterval, (_) {
      unawaited(refresh());
    });
    notifyListeners();
  }

  Future<void> stop() async {
    _running = false;
    _timer?.cancel();
    _timer = null;
    notifyListeners();
  }

  Future<void> requestLocation() {
    return _adapter.requestLocationAuthorization().then((wire) {
      _location = locationAuthorizationFromWire(wire);
      notifyListeners();
    });
  }

  Future<void> refresh() async {
    final result = await _adapter.fetchSnapshot();
    _applySnapshot(result);
  }

  void select(ObservedBss? row) {
    _selectedKey = row == null ? null : _keyOf(row);
    notifyListeners();
  }

  void _applySnapshot(LinuxScanFetchResult result) {
    final snapshot = result.snapshot;
    _mode = result.mode;
    _demo = result.mode == LinuxScanMode.demo;
    _lastError = result.native?.error ?? snapshot.error;
    _lastSnapshotAt = DateTime.tryParse(snapshot.capturedAt);
    _location = ScanDomainMapper.locationFromSnapshot(snapshot);
    _connectedBssid = _resolveConnectedBssid(snapshot);
    _rows = ScanDomainMapper.observedNetworksFromSnapshot(
      snapshot,
      previous: _rows,
    );
    _ensureSelection();
    notifyListeners();
  }

  String? _resolveConnectedBssid(ScanSnapshotDto snapshot) {
    final fromAssociated = snapshot.associated?.bssid?.trim();
    if (fromAssociated != null && fromAssociated.isNotEmpty) {
      return fromAssociated;
    }
    for (final row in _rows) {
      final bssid = row.lastRaw.bssid?.trim();
      if (bssid != null && bssid.isNotEmpty) return bssid;
    }
    return null;
  }

  void _ensureSelection() {
    if (_rows.isEmpty) {
      _selectedKey = null;
      return;
    }
    if (_selectedKey == null ||
        _rows.every((row) => _keyOf(row) != _selectedKey)) {
      _selectedKey = _keyOf(_rows.first);
    }
  }

  String _keyOf(ObservedBss row) {
    final raw = row.lastRaw;
    return bssMatchKeyFromRaw(
      bssid: raw.bssid,
      ssidData: raw.ssidData,
      ssid: raw.ssid,
      channelNumber: raw.channelNumber,
      channelBand: coreWlanChannelBandKey(raw.channelBand),
      ibss: raw.ibss,
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
