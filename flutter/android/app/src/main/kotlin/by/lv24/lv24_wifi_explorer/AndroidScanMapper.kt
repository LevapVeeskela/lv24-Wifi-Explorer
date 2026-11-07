package by.lv24.lv24_wifi_explorer

import android.net.wifi.ScanResult
import android.net.wifi.WifiInfo
import android.os.Build
import java.util.Locale

/**
 * Public-API mapping from [ScanResult] / [WifiInfo] to ScanCore-shaped wire fields.
 * No private Wi‑Fi stacks, no monitor mode, no invented 6 GHz / width / PHY.
 */
internal object AndroidScanMapper {
  const val UNKNOWN_SSID = "<unknown ssid>"
  const val REDACTED_BSSID = "02:00:00:00:00:00"
  const val ZERO_BSSID = "00:00:00:00:00:00"

  data class ChannelHint(
    val band: String,
    val number: Int?,
  )

  fun sanitizeSsid(raw: String?): String? {
    if (raw == null) return null
    var value = raw.trim()
    if (value.length >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
      value = value.substring(1, value.length - 1)
    }
    if (value.isEmpty()) return null
    val lower = value.lowercase(Locale.US)
    if (lower == UNKNOWN_SSID || lower == "0x" || lower == "null") return null
    return value
  }

  fun sanitizeBssid(raw: String?): String? {
    val normalized = normalizeBssid(raw) ?: return null
    if (normalized == REDACTED_BSSID || normalized == ZERO_BSSID) return null
    return normalized
  }

  fun normalizeBssid(raw: String?): String? {
    if (raw.isNullOrBlank()) return null
    val hex = raw.lowercase(Locale.US).filter { it.isDigit() || it in 'a'..'f' }
    if (hex.length != 12) {
      val trimmed = raw.trim().lowercase(Locale.US)
      return trimmed.ifEmpty { null }
    }
    return hex.chunked(2).joinToString(":")
  }

  fun channelHint(frequencyMhz: Int): ChannelHint {
    if (frequencyMhz in 2400..2500) {
      val number = if (frequencyMhz == 2484) 14 else (frequencyMhz - 2407) / 5
      return ChannelHint("2.4GHz", number)
    }
    if (frequencyMhz in 4900..5914) {
      return ChannelHint("5GHz", (frequencyMhz - 5000) / 5)
    }
    if (frequencyMhz in 5925..7125) {
      return ChannelHint("6GHz", (frequencyMhz - 5950) / 5)
    }
    return ChannelHint("unknown", null)
  }

  fun channelWidthWire(width: Int): String {
    return when (width) {
      ScanResult.CHANNEL_WIDTH_20MHZ -> "20MHz"
      ScanResult.CHANNEL_WIDTH_40MHZ -> "40MHz"
      ScanResult.CHANNEL_WIDTH_80MHZ -> "80MHz"
      ScanResult.CHANNEL_WIDTH_160MHZ -> "160MHz"
      // 80+80 / 320 MHz: do not invent a scan_domain width.
      ScanResult.CHANNEL_WIDTH_80MHZ_PLUS_MHZ -> "unknown"
      else -> "unknown"
    }
  }

  fun securityOf(result: ScanResult): List<String> {
    val fromCaps = securityFromCapabilities(result.capabilities)
    if (fromCaps.isNotEmpty() && fromCaps != listOf("unknown")) return fromCaps
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      val fromTypes = securityFromTypes(result.securityTypes)
      if (fromTypes.isNotEmpty()) return fromTypes
    }
    return fromCaps
  }

  fun securityFromTypes(types: IntArray?): List<String> {
    if (types == null || types.isEmpty()) return emptyList()
    val out = LinkedHashSet<String>()
    for (type in types) {
      when (type) {
        ScanResult.SECURITY_TYPE_OPEN -> out.add("open")
        ScanResult.SECURITY_TYPE_WEP -> out.add("wep")
        ScanResult.SECURITY_TYPE_PSK -> out.add("personal-generic")
        ScanResult.SECURITY_TYPE_EAP,
        ScanResult.SECURITY_TYPE_PASSPOINT_R1_R2,
        ScanResult.SECURITY_TYPE_PASSPOINT_R3,
        -> out.add("enterprise-generic")
        ScanResult.SECURITY_TYPE_SAE -> out.add("wpa3-personal")
        ScanResult.SECURITY_TYPE_OWE -> out.add("owe")
        ScanResult.SECURITY_TYPE_EAP_WPA3_ENTERPRISE,
        ScanResult.SECURITY_TYPE_EAP_WPA3_ENTERPRISE_192_BIT,
        -> out.add("wpa3-enterprise")
      }
    }
    return out.toList()
  }

  fun ssidOf(result: ScanResult): String? {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      val fromTyped = sanitizeSsid(result.wifiSsid?.toString())
      if (fromTyped != null) return fromTyped
    }
    @Suppress("DEPRECATION")
    return sanitizeSsid(result.SSID)
  }

  fun bssidOf(result: ScanResult): String? = sanitizeBssid(result.BSSID)

  fun securityFromCapabilities(capabilities: String?): List<String> {
    val caps = capabilities?.uppercase(Locale.US).orEmpty()
    if (caps.isEmpty()) return listOf("unknown")

    val out = ArrayList<String>()
    val hasSae = caps.contains("SAE") || caps.contains("WPA3-PSK")
    val hasPsk = caps.contains("PSK")
    val hasEap =
      caps.contains("EAP") ||
        caps.contains("802.1X") ||
        caps.contains("SUITE-B")
    val hasOwe = caps.contains("OWE")
    val hasWep = caps.contains("WEP")
    val hasWpa3 = caps.contains("WPA3") || hasSae
    val hasWpa2 = caps.contains("WPA2") || caps.contains("RSN")
    val hasWpa1 = Regex("(?<!\\d)WPA(?!\\d)").containsMatchIn(caps) ||
      caps.contains("WPA-")

    if (hasOwe && caps.contains("OWE_TRANSITION")) {
      out.add("owe-transition")
    } else if (hasOwe) {
      out.add("owe")
    }

    if (hasEap && hasWpa3) {
      out.add("wpa3-enterprise")
    } else if (hasEap && hasWpa2) {
      out.add("wpa2-enterprise")
    } else if (hasEap && hasWpa1) {
      out.add("wpa-enterprise")
    } else if (hasEap) {
      out.add("wpa2-enterprise")
    }

    if (hasSae && hasPsk) {
      out.add("wpa3-transition")
    } else if (hasSae || (hasWpa3 && !hasEap)) {
      out.add("wpa3-personal")
    }

    if (hasPsk && hasWpa2 && !hasSae) {
      out.add("wpa2-personal")
    } else if (hasPsk && hasWpa1 && !hasWpa2 && !hasSae) {
      out.add("wpa-personal")
    } else if (hasPsk && !hasSae && !out.contains("wpa2-personal") && !out.contains("wpa3-transition")) {
      out.add("wpa2-personal")
    }

    if (hasWep) out.add("wep")

    if (out.isNotEmpty()) return out.distinct()

    val openLike =
      caps.contains("ESS") &&
        !hasPsk &&
        !hasEap &&
        !hasWep &&
        !hasOwe &&
        !hasWpa3 &&
        !hasWpa2 &&
        !hasWpa1
    return if (openLike) listOf("open") else listOf("unknown")
  }

  fun phyModesOf(result: ScanResult): List<String> {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return emptyList()
    return when (result.wifiStandard) {
      ScanResult.WIFI_STANDARD_11N -> listOf("n")
      ScanResult.WIFI_STANDARD_11AC -> listOf("ac")
      ScanResult.WIFI_STANDARD_11AX -> listOf("ax")
      ScanResult.WIFI_STANDARD_11BE -> listOf("be")
      else -> emptyList()
    }
  }

  fun isIbss(capabilities: String?): Boolean {
    return capabilities?.uppercase(Locale.US)?.contains("IBSS") == true
  }

  fun dedupeScanResults(results: List<ScanResult>): List<ScanResult> {
    val best = LinkedHashMap<String, ScanResult>()
    for (result in results) {
      val hint = channelHint(result.frequency)
      val bssid = bssidOf(result) ?: result.BSSID.orEmpty()
      val key = "$bssid|${hint.number}|${hint.band}"
      val previous = best[key]
      if (previous == null || result.level > previous.level) {
        best[key] = result
      }
    }
    return best.values.toList()
  }

  fun flatNetworkRow(result: ScanResult): Map<String, Any> {
    val hint = channelHint(result.frequency)
    val ssid = ssidOf(result)
    val width =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        channelWidthWire(result.channelWidth)
      } else {
        "unknown"
      }
    val row = HashMap<String, Any>(12)
    if (ssid != null) row["ssid"] = ssid
    val bssid = bssidOf(result)
    if (bssid != null) row["bssid"] = bssid
    row["rssiDbm"] = result.level
    row["noiseDbm"] = 0
    if (hint.number != null) row["channelNumber"] = hint.number
    row["channelBand"] = hint.band
    row["channelWidth"] = width
    row["supportedSecurity"] = securityOf(result)
    row["supportedPhyModes"] = phyModesOf(result)
    row["ibss"] = isIbss(result.capabilities)
    row["beaconIntervalMs"] = 100
    return row
  }

  fun associatedMap(info: WifiInfo): Map<String, Any>? {
    val ssid = sanitizeSsid(info.ssid)
    val bssid = sanitizeBssid(info.bssid)
    if (ssid == null && bssid == null) return null
    val hint = channelHint(info.frequency)
    val map = HashMap<String, Any>(6)
    if (ssid != null) map["ssid"] = ssid
    if (bssid != null) map["bssid"] = bssid
    map["rssiDbm"] = info.rssi
    if (hint.number != null) map["channelNumber"] = hint.number
    if (hint.band != "unknown") map["channelBand"] = hint.band
    return map
  }
}
