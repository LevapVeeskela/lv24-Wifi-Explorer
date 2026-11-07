package by.lv24.lv24_wifi_explorer

import android.net.wifi.ScanResult
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AndroidScanMapperTest {
  @Test
  fun sanitizeSsid_stripsQuotesAndUnknown() {
    assertEquals("Office", AndroidScanMapper.sanitizeSsid("\"Office\""))
    assertNull(AndroidScanMapper.sanitizeSsid("<unknown ssid>"))
    assertNull(AndroidScanMapper.sanitizeSsid(""))
  }

  @Test
  fun sanitizeBssid_dropsRedactedPlaceholders() {
    assertEquals("02:11:24:00:00:01", AndroidScanMapper.sanitizeBssid("021124000001"))
    assertNull(AndroidScanMapper.sanitizeBssid("02:00:00:00:00:00"))
    assertNull(AndroidScanMapper.sanitizeBssid("00:00:00:00:00:00"))
  }

  @Test
  fun channelHint_mapsIeeeBands() {
    assertEquals("2.4GHz", AndroidScanMapper.channelHint(2437).band)
    assertEquals(6, AndroidScanMapper.channelHint(2437).number)
    assertEquals("5GHz", AndroidScanMapper.channelHint(5180).band)
    assertEquals(36, AndroidScanMapper.channelHint(5180).number)
    assertEquals("6GHz", AndroidScanMapper.channelHint(5955).band)
    assertEquals(1, AndroidScanMapper.channelHint(5955).number)
    assertEquals("unknown", AndroidScanMapper.channelHint(1000).band)
  }

  @Test
  fun channelWidth_marksUnsupportedWidthsUnknown() {
    assertEquals("20MHz", AndroidScanMapper.channelWidthWire(ScanResult.CHANNEL_WIDTH_20MHZ))
    assertEquals("160MHz", AndroidScanMapper.channelWidthWire(ScanResult.CHANNEL_WIDTH_160MHZ))
    assertEquals("unknown", AndroidScanMapper.channelWidthWire(ScanResult.CHANNEL_WIDTH_80MHZ_PLUS_MHZ))
    assertEquals("unknown", AndroidScanMapper.channelWidthWire(99))
  }

  @Test
  fun securityFromCapabilities_parsesCommonIes() {
    assertEquals(
      listOf("wpa2-personal"),
      AndroidScanMapper.securityFromCapabilities("[WPA2-PSK-CCMP][ESS]"),
    )
    assertEquals(
      listOf("wpa3-personal"),
      AndroidScanMapper.securityFromCapabilities("[RSN-SAE-CCMP][ESS]"),
    )
    assertEquals(
      listOf("open"),
      AndroidScanMapper.securityFromCapabilities("[ESS]"),
    )
    assertTrue(AndroidScanMapper.isIbss("[IBSS]"))
  }
}
