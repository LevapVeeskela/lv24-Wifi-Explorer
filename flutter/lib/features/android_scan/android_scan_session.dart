import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:scan_core_client/scan_core_client.dart';
import 'package:scan_domain/scan_domain.dart';

import 'android_scan_adapter.dart';

/// Workbench session backed by the Android `WifiManager` adapter.
///
/// Merge / stale / missCount uses `scan_domain` [mergeObservedBssRows]
/// (BSSID+channel dedupe happens natively before the snapshot is mapped).
class AndroidScanSession extends ChangeNotifier {
  AndroidScanSession({
    String? repoRoot,
    AndroidScanAdapter? adapter,
    Duration pollInterval = androidScanDefaultPollInterval,
  })  : _adapter = adapter ?? AndroidScanAdapter(repoRoot: repoRoot),
        _pollInterval = pollInterval;

  static const androidScanDefaultPollInterval = Duration(seconds: 30);

  final AndroidScanAdapter _adapter;
  Duration _pollInterval;

  Timer? _timer;
  bool _running = false;
  bool _refreshing = false;

  List<ObservedBss> _rows = const [];
  String? _selectedKey;
  String? _connectedBssid;
  bool _demo = true;
  AndroidScanMode _mode = AndroidScanMode.demo;
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
  AndroidScanMode get mode => _mode;
  LocationAuthorization get location => _location;
  DateTime? get lastSnapshotAt => _lastSnapshotAt;
  ScanErrorDto? get lastError => _lastError;
  bool get isAndroidAdapter => _adapter.isSupported;
  Duration get pollInterval => _pollInterval;

  Future<void> start() async {
    if (_running) return;
    // Request location before flipping _running: requestLocation() refreshes
    // when running, and start() must consume exactly one snapshot here.
    await requestLocation();
    _running = true;
    await refresh();
    _armTimer();
    notifyListeners();
  }

  Future<void> stop() async {
    _running = false;
    _timer?.cancel();
    _timer = null;
    notifyListeners();
  }

  Future<void> requestLocation() async {
    try {
      final wire = await _adapter.requestLocationAuthorization();
      _location = locationAuthorizationFromWire(wire);
      notifyListeners();
      if (_running) {
        await refresh();
      }
    } catch (_) {}
  }

  Future<void> refresh() async {
    if (_refreshing) return;
    _refreshing = true;
    try {
      final result = await _adapter.fetchSnapshot();
      _applySnapshot(result);
    } finally {
      _refreshing = false;
    }
  }

  void select(ObservedBss? row) {
    _selectedKey = row == null ? null : _keyOf(row);
    notifyListeners();
  }

  void _applySnapshot(AndroidScanFetchResult result) {
    final snapshot = result.snapshot;
    final wasDemo = _demo;
    _mode = result.mode;
    _demo = result.mode == AndroidScanMode.demo;
    _lastError = result.native?.error ?? snapshot.error;
    _lastSnapshotAt = DateTime.tryParse(snapshot.capturedAt);
    _location = ScanDomainMapper.locationFromSnapshot(snapshot);
    if (result.suggestedInterval != null) {
      _pollInterval = result.suggestedInterval!;
    }
    final incoming = ScanDomainMapper.observedNetworksFromSnapshot(snapshot);
    if (_demo) {
      _rows = incoming;
    } else {
      final previous = wasDemo ? const <ObservedBss>[] : _rows;
      _rows = mergeObservedBssRows(previous, incoming, snapshot.capturedAt)
          .where((row) => row.presence.presence != Presence.disappeared)
          .toList(growable: false);
    }
    _connectedBssid = _resolveConnectedBssid(snapshot);
    _ensureSelection();
    notifyListeners();
  }

  void _armTimer() {
    _timer?.cancel();
    if (!_running) return;
    _timer = Timer(_pollInterval, () async {
      await refresh();
      if (_running) _armTimer();
    });
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
