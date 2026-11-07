package by.lv24.lv24_wifi_explorer

/**
 * Honest Android scan backoff.
 *
 * ScanCore uses `max(3s, duration * 1.1)`. Android additionally rate-limits
 * `WifiManager.startScan()` (about four foreground scans per two minutes), so
 * the floor is higher and throttle failures stretch the interval further.
 */
internal object AndroidScanThrottle {
  const val SCANCORE_FLOOR_MS = 3_000L
  const val ANDROID_FLOOR_MS = 10_000L
  const val THROTTLED_FLOOR_MS = 30_000L
  const val MAX_BACKOFF_FACTOR = 4
  const val SCAN_TIMEOUT_MS = 8_000L

  fun suggestedIntervalMs(
    lastDurationMs: Long,
    throttled: Boolean,
    consecutiveFailures: Int = 0,
  ): Long {
    val durationBackoff = (lastDurationMs.coerceAtLeast(0L) * 11L) / 10L
    val base = maxOf(ANDROID_FLOOR_MS, SCANCORE_FLOOR_MS, durationBackoff)
    if (!throttled) return base
    val factor = (1 + consecutiveFailures.coerceAtLeast(0)).coerceAtMost(MAX_BACKOFF_FACTOR)
    return maxOf(THROTTLED_FLOOR_MS, base) * factor
  }
}
