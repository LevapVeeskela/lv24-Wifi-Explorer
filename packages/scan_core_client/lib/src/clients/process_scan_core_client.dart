import 'dart:async';
import 'dart:convert';
import 'dart:io';

import '../events.dart';
import '../jsonl/json_lines_buffer.dart';
import '../models/scan_error_dto.dart';
import '../protocol/constants.dart';
import '../protocol/line_decoder.dart';
import '../resolve/scan_core_binary.dart';
import '../scan_core_client.dart';

/// Spawns the macOS ScanCore helper and speaks JSON Lines on stdio.
class ProcessScanCoreClient implements ScanCoreClient {
  ProcessScanCoreClient({
    this.repoRoot,
    this.resourcesPath,
    List<String>? devRoots,
    ProcessStartMode startMode = ProcessStartMode.normal,
  })  : _devRoots = devRoots ?? defaultScanCoreDevRoots(repoRoot: repoRoot),
        _startMode = startMode;

  final String? repoRoot;
  final String? resourcesPath;
  final List<String> _devRoots;
  final ProcessStartMode _startMode;

  final StreamController<ScanCoreEvent> _events =
      StreamController<ScanCoreEvent>.broadcast();
  Process? _process;
  final JsonLinesBuffer _lineBuffer = JsonLinesBuffer();
  bool _running = false;

  @override
  Stream<ScanCoreEvent> get events => _events.stream;

  @override
  bool get isRunning => _running;

  @override
  Future<void> start({ScanCoreStartOptions options = const ScanCoreStartOptions()}) async {
    if (_running) return;

    final binary = resolveScanCoreBinary(
      resourcesPath: resourcesPath,
      devRoots: _devRoots,
    );
    if (binary == null) {
      _events.add(
        ScanCoreErrorEvent(
          error: ScanErrorDto(
            code: ScanErrorCode.helperUnavailable,
            message: 'ScanCore binary not found',
            recoverable: true,
            demoFallback: true,
          ),
        ),
      );
      return;
    }

    final intervalMs =
        options.intervalMs < scanCoreMinIntervalMs ? scanCoreMinIntervalMs : options.intervalMs;

    _process = await Process.start(
      binary,
      [
        '--stdio-only',
        '--idle',
        '--include-hidden',
        options.includeHidden ? 'true' : 'false',
        '--interval-ms',
        '$intervalMs',
      ],
      mode: _startMode,
    );

    _running = true;
    _process!.stdout
        .transform(utf8.decoder)
        .listen(_onStdoutChunk, onError: _onProcessError);
    _process!.stderr.transform(utf8.decoder).listen((_) {});
    _process!.exitCode.then((code) {
      _running = false;
      _events.add(ScanCoreProcessExit(exitCode: code));
    });

    await queryPermissions();
    await _send({
      'type': 'scan:start',
      'options': {'includeHidden': options.includeHidden},
    });
  }

  @override
  Future<void> stop() async {
    if (_process == null) {
      _running = false;
      return;
    }
    try {
      await _send({'type': 'scan:stop'});
      await _send({'type': 'shutdown'});
    } catch (_) {
      // ignore
    }
    _process!.kill(ProcessSignal.sigterm);
    _running = false;
    _process = null;
  }

  @override
  Future<void> setIntervalMs(int intervalMs) async {
    final ms = intervalMs < scanCoreMinIntervalMs ? scanCoreMinIntervalMs : intervalMs;
    await _send({'type': 'scan:setIntervalMs', 'intervalMs': ms});
  }

  @override
  Future<void> queryPermissions() async {
    await _send({'type': 'permissions:query'});
  }

  Future<void> _send(Map<String, dynamic> command) async {
    final process = _process;
    if (process == null) return;
    process.stdin.writeln(encodeJsonLine(command));
    await process.stdin.flush();
  }

  void _onStdoutChunk(String chunk) {
    for (final line in _lineBuffer.push(chunk)) {
      _handleLine(line);
    }
  }

  void _handleLine(String line) {
    final trimmed = line.trim();
    if (trimmed.isEmpty) return;
    final json = parseJsonLine(trimmed);
    if (json == null) {
      _events.add(ScanCoreParseWarning(rawLine: trimmed));
      return;
    }
    final event = decodeScanCoreLine(json);
    if (event != null) {
      _events.add(event);
      return;
    }
    _events.add(ScanCoreParseWarning(rawLine: trimmed, message: 'unknown type'));
  }

  void _onProcessError(Object error, StackTrace stackTrace) {
    _events.add(
      ScanCoreErrorEvent(
        error: ScanErrorDto(
          code: ScanErrorCode.scanFailed,
          message: error.toString(),
          recoverable: true,
        ),
      ),
    );
  }

  /// Visible for tests.
  void dispose() {
    _events.close();
  }
}
