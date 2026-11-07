import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:scan_core_client/scan_core_client.dart';
import 'package:scan_domain/scan_domain.dart';

import '../scan_settings/persist.dart';
import '../scan_settings/types.dart';
import 'demo_networks.dart';
import 'live_scan_flag.dart';
import 'scan_core_host.dart'
    if (dart.library.io) 'scan_core_host_io.dart';
import 'scan_workbench_session.dart';

/// Workbench session: demo fixtures by default; live macOS [ProcessScanCoreClient]
/// when `--dart-define=LIVE_SCAN=true` or settings `preferDemo` is false.
///
/// Missing helper, `demoFallback`, or helper exit falls back to [DemoScanClient]
/// (Electron `scheduler.ts` policy). Public CoreWLAN/CoreLocation via ScanCore
/// only — no airport, wdutil, or IO80211.
class DemoScanSession extends ChangeNotifier implements ScanWorkbenchSession {
  DemoScanSession({
    String? repoRoot,
    ScanCoreClient? client,
    FixtureLoader? loader,
    bool? liveScan,
    ScanWorkbenchSettings? settings,
  })  : _repoRoot = repoRoot ?? guessRepoRoot(),
        _loader = loader ?? FixtureLoader(),
        _liveScanOverride = liveScan,
        _clientLocked = client != null {
    _settings = settings;
    if (client != null) {
      _client = client;
      _usingLive = client is ProcessScanCoreClient;
      if (client is DemoScanClient) _demoClient = client;
      if (client is ProcessScanCoreClient) _liveClient = client;
    } else if (_bootLive) {
      _liveClient = _createLiveClient();
      _client = _liveClient!;
      _usingLive = true;
    } else {
      _demoClient = _createDemoClient();
      _client = _demoClient!;
      _usingLive = false;
    }
    _sub = _client.events.listen(_onEvent);
    _seed();
  }

  final String? _repoRoot;
  final FixtureLoader _loader;
  final bool? _liveScanOverride;
  final bool _clientLocked;

  ScanWorkbenchSettings? _settings;
  late ScanCoreClient _client;
  DemoScanClient? _demoClient;
  ProcessScanCoreClient? _liveClient;
  StreamSubscription<ScanCoreEvent>? _sub;

  List<ObservedBss> _rows = const [];
  String? _selectedKey;
  String? _connectedBssid;
  bool _demo = true;
  bool _usingLive = false;
  LocationAuthorization _location = LocationAuthorization.restricted;
  DateTime? _lastSnapshotAt;
  ScanErrorDto? _lastError;
  bool _stopping = false;
  bool _fallbackInFlight = false;
  bool _disposed = false;

  @override
  List<ObservedBss> get rows => _rows;

  /// Normalized BSSID of the Mac's associated link (Electron `connectedBssid`).
  @override
  String? get connectedBssid => _connectedBssid;
  @override
  ObservedBss? get selected {
    if (_selectedKey == null) return null;
    for (final row in _rows) {
      if (_keyOf(row) == _selectedKey) return row;
    }
    return null;
  }

  @override
  bool get isRunning => _client.isRunning;
  @override
  bool get demo => _demo;

  /// True while the live ScanCore helper is the active client.
  bool get usingLiveHelper => _usingLive;
  @override
  LocationAuthorization get location => _location;
  @override
  DateTime? get lastSnapshotAt => _lastSnapshotAt;

  @override
  bool get scanCoreError => !demo && _lastError != null;

  @override
  DateTime? get latestRowLastSeenAt => maxLastSeenAtForRows(_rows);

  bool get _bootLive =>
      resolveLiveScanOptIn(liveScan: _liveScanOverride) && canSpawnScanCore;

  @override
  Future<void> start() async {
    if (_disposed) return;
    if (_client.isRunning) return;
    if (!_clientLocked) {
      await _alignClientWithPolicy();
    }
    final options = ScanCoreStartOptions(intervalMs: _resolveIntervalMs());
    try {
      await _client.start(options: options);
    } catch (_) {
      if (_usingLive && !_clientLocked) {
        await _fallbackToDemo();
        return;
      }
      rethrow;
    }
    if (_usingLive && !_client.isRunning && !_clientLocked) {
      await _fallbackToDemo();
      return;
    }
    if (_usingLive) _lastError = null;
    _notify();
  }

  @override
  Future<void> requestLocation() async {
    if (_usingLive && _client.isRunning) {
      await _client.queryPermissions();
    }
  }

  @override
  Future<void> stop() async {
    _stopping = true;
    try {
      await _client.stop();
    } finally {
      _stopping = false;
      _notify();
    }
  }

  @override
  void select(ObservedBss? row) {
    _selectedKey = row == null ? null : _keyOf(row);
    _notify();
  }

  /// Runtime settings (`preferDemo`, interval). Re-read on [start] if omitted.
  Future<void> applySettings(ScanWorkbenchSettings settings) async {
    _settings = settings;
    if (!_client.isRunning) {
      _notify();
      return;
    }
    await _applySettingsWhileRunning();
  }

  void _seed() {
    try {
      final snapshot = _loader.loadDemoSnapshot(repoRoot: _repoRoot);
      _applySnapshot(
        snapshot,
        eventDemo: true,
        origin: ScanSnapshotOrigin.fixtures,
      );
    } catch (_) {
      _applyFallback();
    }
    if (_rows.isEmpty) _applyFallback();
  }

  void _onEvent(ScanCoreEvent event) {
    if (_disposed) return;
    switch (event) {
      case ScanCoreSnapshotEvent(:final snapshot, :final demo, :final origin):
        if (snapshot.error?.demoFallback == true) {
          unawaited(_fallbackToDemo());
          return;
        }
        _applySnapshot(snapshot, eventDemo: demo, origin: origin);
      case ScanCorePermissionsStatus(:final location, :final demoMode):
        _location = location;
        _demo = demoMode || !_usingLive;
        _notify();
      case ScanCoreErrorEvent(:final error):
        if (_shouldFallback(error)) {
          unawaited(_fallbackToDemo());
        } else {
          _lastError = error;
          _notify();
        }
      case ScanCoreProcessExit():
        if (_usingLive && !_stopping && !_clientLocked) {
          unawaited(_fallbackToDemo());
        }
      default:
        break;
    }
  }

  void _applySnapshot(
    ScanSnapshotDto snapshot, {
    required bool eventDemo,
    required ScanSnapshotOrigin origin,
  }) {
    final fromFixtures = eventDemo ||
        origin == ScanSnapshotOrigin.fixtures ||
        snapshot.demo ||
        snapshot.transportSource == 'fixtures' ||
        snapshot.source == 'fixtures';
    // Drop demo seed rows when the first live snapshot arrives.
    final mergePrevious =
        fromFixtures ? _rows : (_demo ? const <ObservedBss>[] : _rows);
    _demo = fromFixtures;
    _lastError = fromFixtures ? null : snapshot.error;
    _lastSnapshotAt = DateTime.tryParse(snapshot.capturedAt);
    _connectedBssid = _resolveConnectedBssid(snapshot, fromFixtures: fromFixtures);
    // Fixtures still say location:granted so demo rows keep SSID/BSSID. That is
    // not an OS grant — unsigned / demo ScanCore still needs Location later.
    _location = fromFixtures && !_usingLive
        ? LocationAuthorization.notDetermined
        : ScanDomainMapper.locationFromSnapshot(snapshot);
    final mapped = ScanDomainMapper.observedNetworksFromSnapshot(
      snapshot,
      previous: mergePrevious,
    );
    if (mapped.isEmpty && fromFixtures) {
      _rows = bundledDemoObservedBss(capturedAt: snapshot.capturedAt);
    } else {
      _rows = mapped;
    }
    _ensureSelection();
    _notify();
  }

  void _applyFallback() {
    _rows = bundledDemoObservedBss();
    _connectedBssid = _associatedBssidFromFixture();
    _demo = true;
    _lastError = null;
    _location = LocationAuthorization.notDetermined;
    _lastSnapshotAt = DateTime.parse('2026-09-17T20:00:00.000Z');
    _ensureSelection();
    _notify();
  }

  String? _resolveConnectedBssid(
    ScanSnapshotDto snapshot, {
    required bool fromFixtures,
  }) {
    final fromSnapshot = snapshot.associated?.bssid?.trim();
    if (fromSnapshot != null && fromSnapshot.isNotEmpty) return fromSnapshot;
    if (fromFixtures) return _associatedBssidFromFixture();
    return null;
  }

  String? _associatedBssidFromFixture() {
    final associated = _loader.loadFixtureObject(repoRoot: _repoRoot)['associated'];
    if (associated is! Map<String, dynamic>) return null;
    return _gatedString(associated['bssid']);
  }

  String? _gatedString(Object? raw) {
    if (raw is String) {
      final trimmed = raw.trim();
      return trimmed.isEmpty ? null : trimmed;
    }
    if (raw is Map<String, dynamic>) {
      return _gatedString(raw['value']);
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

  bool get _wantLive =>
      resolveLiveScanOptIn(
        liveScan: _liveScanOverride,
        preferDemo: _settings?.preferDemo ?? _loadPreferDemo(),
      ) &&
      canSpawnScanCore;

  bool _loadPreferDemo() {
    try {
      return loadScanWorkbenchSettings().preferDemo;
    } catch (_) {
      return true;
    }
  }

  int _resolveIntervalMs() {
    if (_settings != null) return _settings!.scanIntervalMs;
    try {
      return loadScanWorkbenchSettings().scanIntervalMs;
    } catch (_) {
      return scanCoreMinIntervalMs;
    }
  }

  Future<void> _alignClientWithPolicy() async {
    final wantLive = _wantLive;
    if (wantLive == _usingLive) return;
    if (wantLive) {
      _bind(_liveClient ??= _createLiveClient());
      _usingLive = true;
    } else {
      _bind(_demoClient ??= _createDemoClient());
      _usingLive = false;
      _demo = true;
      _lastError = null;
    }
  }

  Future<void> _applySettingsWhileRunning() async {
    if (_disposed) return;
    if (_clientLocked) {
      await _client.setIntervalMs(_resolveIntervalMs());
      return;
    }
    if (_wantLive == _usingLive) {
      await _client.setIntervalMs(_resolveIntervalMs());
      return;
    }
    await stop();
    if (_disposed) return;
    await start();
  }

  bool _shouldFallback(ScanErrorDto error) {
    if (!_usingLive || _clientLocked || _stopping || _fallbackInFlight) {
      return false;
    }
    if (error.demoFallback == true) return true;
    return error.code == ScanErrorCode.helperUnavailable;
  }

  Future<void> _fallbackToDemo() async {
    if (_disposed || _clientLocked || _fallbackInFlight || !_usingLive) return;
    _fallbackInFlight = true;
    _stopping = true;
    try {
      try {
        await _client.stop();
      } catch (_) {
        // helper already gone
      }
      _bind(_demoClient ??= _createDemoClient());
      _usingLive = false;
      _demo = true;
      _lastError = null;
      if (!_client.isRunning) {
        await _client.start(
          options: ScanCoreStartOptions(intervalMs: _resolveIntervalMs()),
        );
      }
      _notify();
    } finally {
      _stopping = false;
      _fallbackInFlight = false;
    }
  }

  void _bind(ScanCoreClient next) {
    if (identical(_client, next)) return;
    _sub?.cancel();
    _client = next;
    _sub = _client.events.listen(_onEvent);
  }

  DemoScanClient _createDemoClient() => DemoScanClient(repoRoot: _repoRoot);

  ProcessScanCoreClient _createLiveClient() {
    return ProcessScanCoreClient(
      repoRoot: _repoRoot,
      resourcesPath: macosScanCoreResourcesPath(),
    );
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  void _disposeClient(ScanCoreClient client) {
    if (client is DemoScanClient) {
      client.dispose();
    } else if (client is ProcessScanCoreClient) {
      client.dispose();
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _sub?.cancel();
    final active = _client;
    final demo = _demoClient;
    final live = _liveClient;
    unawaited(() async {
      try {
        await active.stop();
      } catch (_) {}
      _disposeClient(active);
      if (demo != null && !identical(demo, active)) {
        demo.dispose();
      }
      if (live != null && !identical(live, active)) {
        try {
          await live.stop();
        } catch (_) {}
        live.dispose();
      }
    }());
    super.dispose();
  }
}

/// Alias used when the workbench wants a source-neutral session type.
typedef ScanSession = DemoScanSession;
