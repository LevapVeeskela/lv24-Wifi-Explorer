/// Honest Android poll backoff (mirrors Kotlin `AndroidScanThrottle`).
///
/// ScanCore: `max(3s, duration * 1.1)`. Android scan throttling is stricter, so
/// the floor is 10s and a failed/`startScan` throttle uses at least 30s.
const androidScanMinInterval = Duration(seconds: 10);
const androidScanThrottledMinInterval = Duration(seconds: 30);
const androidScanCoreFloor = Duration(seconds: 3);
const androidScanMaxBackoffFactor = 4;

Duration androidScanBackoff({
  required int? scanDurationMs,
  required bool throttled,
  int consecutiveThrottle = 0,
}) {
  final durationMs = scanDurationMs ?? 0;
  final fromDuration = (durationMs * 1.1).round();
  final baseMs = _max3(
    androidScanMinInterval.inMilliseconds,
    androidScanCoreFloor.inMilliseconds,
    fromDuration,
  );
  if (!throttled) return Duration(milliseconds: baseMs);
  final factor = (1 + consecutiveThrottle).clamp(1, androidScanMaxBackoffFactor);
  final throttledMs =
      _max2(androidScanThrottledMinInterval.inMilliseconds, baseMs) * factor;
  return Duration(milliseconds: throttledMs);
}

int _max2(int a, int b) => a > b ? a : b;

int _max3(int a, int b, int c) => _max2(a, _max2(b, c));
