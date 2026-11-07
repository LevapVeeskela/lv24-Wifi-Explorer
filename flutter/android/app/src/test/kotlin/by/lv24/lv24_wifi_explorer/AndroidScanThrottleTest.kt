package by.lv24.lv24_wifi_explorer

import org.junit.Assert.assertEquals
import org.junit.Test

class AndroidScanThrottleTest {
  @Test
  fun floorIsSlowerThanScanCore() {
    assertEquals(10_000L, AndroidScanThrottle.suggestedIntervalMs(100, throttled = false))
  }

  @Test
  fun durationBackoffMatchesScanCoreSpirit() {
    assertEquals(22_000L, AndroidScanThrottle.suggestedIntervalMs(20_000, throttled = false))
  }

  @Test
  fun throttledBackoffUsesThirtySecondFloor() {
    assertEquals(30_000L, AndroidScanThrottle.suggestedIntervalMs(100, throttled = true))
    assertEquals(
      90_000L,
      AndroidScanThrottle.suggestedIntervalMs(100, throttled = true, consecutiveFailures = 2),
    )
  }
}
