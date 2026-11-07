#include "windows_scan_bridge.h"

#include <flutter/standard_method_codec.h>

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <wlanapi.h>

#include <cstdint>
#include <cstring>
#include <string>

#include "utils.h"

namespace {

using flutter::EncodableList;
using flutter::EncodableMap;
using flutter::EncodableValue;

constexpr char kChannelName[] = "dev.lv24.wifi_explorer/windows_scan";
constexpr char kSourceConnected[] = "connectedNetworkOnly";
constexpr char kSourceDemo[] = "demo";

constexpr char kNoBssListMessage[] =
    "WlanGetAvailableNetworkList is SSID-aggregated (no BSSID, channel, or "
    "IEs). Windows v1 shows the associated link only. WinRT WiFiAdapter is "
    "not used (unpackaged Flutter has no MSIX wifiControl; still no IEs).";

struct WlanClient {
  HANDLE handle = nullptr;
  ~WlanClient() {
    if (handle != nullptr) {
      WlanCloseHandle(handle, nullptr);
    }
  }
};

struct WlanMemory {
  PVOID ptr = nullptr;
  ~WlanMemory() {
    if (ptr != nullptr) {
      WlanFreeMemory(ptr);
    }
  }
};

std::string Iso8601NowUtc() {
  SYSTEMTIME st = {};
  GetSystemTime(&st);
  char buf[40] = {};
  sprintf_s(buf, "%04u-%02u-%02uT%02u:%02u:%02u.%03uZ", st.wYear, st.wMonth,
            st.wDay, st.wHour, st.wMinute, st.wSecond, st.wMilliseconds);
  return std::string(buf);
}

int32_t ElapsedMs(ULONGLONG started) {
  const ULONGLONG now = GetTickCount64();
  if (now < started) {
    return 0;
  }
  const ULONGLONG delta = now - started;
  if (delta > static_cast<ULONGLONG>(INT32_MAX)) {
    return INT32_MAX;
  }
  return static_cast<int32_t>(delta);
}

std::string SsidToUtf8(const DOT11_SSID& ssid) {
  if (ssid.uSSIDLength == 0 || ssid.uSSIDLength > DOT11_SSID_MAX_LENGTH) {
    return std::string();
  }
  return std::string(reinterpret_cast<const char*>(ssid.ucSSID),
                     ssid.uSSIDLength);
}

bool SsidEquals(const DOT11_SSID& left, const DOT11_SSID& right) {
  if (left.uSSIDLength != right.uSSIDLength) {
    return false;
  }
  if (left.uSSIDLength == 0) {
    return true;
  }
  return memcmp(left.ucSSID, right.ucSSID, left.uSSIDLength) == 0;
}

bool IsZeroMac(const DOT11_MAC_ADDRESS& mac) {
  for (int i = 0; i < 6; ++i) {
    if (mac[i] != 0) {
      return false;
    }
  }
  return true;
}

std::string FormatBssid(const DOT11_MAC_ADDRESS& mac) {
  if (IsZeroMac(mac)) {
    return std::string();
  }
  char buf[18] = {};
  sprintf_s(buf, "%02x:%02x:%02x:%02x:%02x:%02x", mac[0], mac[1], mac[2],
            mac[3], mac[4], mac[5]);
  return std::string(buf);
}

int32_t QualityToRssi(ULONG quality) {
  ULONG clamped = quality;
  if (clamped > 100) {
    clamped = 100;
  }
  // Documented Native Wifi mapping: 0 → -100 dBm, 100 → -50 dBm.
  return static_cast<int32_t>(clamped) / 2 - 100;
}

const char* SecurityFromAuth(DOT11_AUTH_ALGORITHM auth,
                             DOT11_CIPHER_ALGORITHM cipher,
                             BOOL security_enabled) {
  if (security_enabled == FALSE) {
    return "open";
  }
  switch (auth) {
    case DOT11_AUTH_ALGO_80211_OPEN:
      return cipher == DOT11_CIPHER_ALGO_NONE ? "open" : "wep";
    case DOT11_AUTH_ALGO_80211_SHARED_KEY:
      return "wep";
    case DOT11_AUTH_ALGO_WPA:
      return "wpa-enterprise";
    case DOT11_AUTH_ALGO_WPA_PSK:
      return "wpa-personal";
    case DOT11_AUTH_ALGO_RSNA:
      return "wpa2-enterprise";
    case DOT11_AUTH_ALGO_RSNA_PSK:
      return "wpa2-personal";
    default:
      // WPA3 / OWE enum values vary by SDK; do not guess.
      return "unknown";
  }
}

const char* PhyLetter(DOT11_PHY_TYPE phy) {
  switch (phy) {
    case dot11_phy_type_ofdm:
      return "a";
    case dot11_phy_type_hrdsss:
      return "b";
    case dot11_phy_type_erp:
      return "g";
    case dot11_phy_type_ht:
      return "n";
    case dot11_phy_type_vht:
      return "ac";
    default:
      // HE / EHT values vary by SDK; omit rather than guess.
      return nullptr;
  }
}

void PutString(EncodableMap& map, const char* key, const std::string& value) {
  map[EncodableValue(key)] = EncodableValue(value);
}

void PutBool(EncodableMap& map, const char* key, bool value) {
  map[EncodableValue(key)] = EncodableValue(value);
}

void PutInt(EncodableMap& map, const char* key, int32_t value) {
  map[EncodableValue(key)] = EncodableValue(value);
}

EncodableMap ErrorMap(const char* code, const char* message,
                      bool demo_fallback) {
  EncodableMap error;
  PutString(error, "code", code);
  PutString(error, "message", message);
  PutBool(error, "recoverable", true);
  PutBool(error, "demoFallback", demo_fallback);
  return error;
}

EncodableMap DemoPayload(const char* location, bool location_authorized,
                         int32_t duration_ms, const EncodableMap& error,
                         const std::string& interface_name,
                         const EncodableMap* associated) {
  EncodableMap payload;
  PutString(payload, "capturedAt", Iso8601NowUtc());
  PutString(payload, "interfaceName",
            interface_name.empty() ? "Wi-Fi" : interface_name);
  PutString(payload, "location", location);
  PutBool(payload, "locationAuthorized", location_authorized);
  PutBool(payload, "includeHiddenRequested", false);
  PutString(payload, "source", kSourceDemo);
  PutBool(payload, "demo", true);
  payload[EncodableValue("networks")] = EncodableValue(EncodableList());
  if (associated != nullptr) {
    payload[EncodableValue("associated")] = EncodableValue(*associated);
  }
  payload[EncodableValue("error")] = EncodableValue(error);
  PutInt(payload, "scanDurationMs", duration_ms);
  return payload;
}

EncodableList SsidDataList(const DOT11_SSID& ssid) {
  EncodableList data;
  const ULONG length =
      ssid.uSSIDLength > DOT11_SSID_MAX_LENGTH ? 0 : ssid.uSSIDLength;
  data.reserve(length);
  for (ULONG i = 0; i < length; ++i) {
    data.emplace_back(static_cast<int32_t>(ssid.ucSSID[i]));
  }
  return data;
}

EncodableMap AssociatedMap(const std::string& ssid, const std::string& bssid,
                           int32_t rssi) {
  EncodableMap associated;
  if (!ssid.empty()) {
    PutString(associated, "ssid", ssid);
  }
  if (!bssid.empty()) {
    PutString(associated, "bssid", bssid);
  }
  PutInt(associated, "rssiDbm", rssi);
  return associated;
}

EncodableMap ConnectedRow(const std::string& ssid, const std::string& bssid,
                          const DOT11_SSID& raw_ssid, int32_t rssi,
                          const char* security, const char* phy, bool ibss) {
  EncodableMap row;
  if (!ssid.empty()) {
    PutString(row, "ssid", ssid);
  }
  if (!bssid.empty()) {
    PutString(row, "bssid", bssid);
  }
  const EncodableList ssid_data = SsidDataList(raw_ssid);
  if (!ssid_data.empty()) {
    row[EncodableValue("ssidData")] = EncodableValue(ssid_data);
  }
  PutInt(row, "rssiDbm", rssi);
  PutInt(row, "noiseDbm", 0);
  PutString(row, "channelBand", "unknown");
  PutString(row, "channelWidth", "unknown");
  EncodableList security_list;
  security_list.emplace_back(security);
  row[EncodableValue("supportedSecurity")] = EncodableValue(security_list);
  EncodableList phy_list;
  if (phy != nullptr) {
    phy_list.emplace_back(phy);
  }
  row[EncodableValue("supportedPhyModes")] = EncodableValue(phy_list);
  PutBool(row, "ibss", ibss);
  return row;
}

const WLAN_INTERFACE_INFO* PickInterface(const WLAN_INTERFACE_INFO_LIST& list) {
  const WLAN_INTERFACE_INFO* fallback = nullptr;
  for (DWORD i = 0; i < list.dwNumberOfItems; ++i) {
    const WLAN_INTERFACE_INFO& info = list.InterfaceInfo[i];
    if (info.isState == wlan_interface_state_connected ||
        info.isState == wlan_interface_state_ad_hoc_network_formed) {
      return &info;
    }
    if (fallback == nullptr &&
        info.isState != wlan_interface_state_not_ready) {
      fallback = &info;
    }
  }
  if (fallback != nullptr) {
    return fallback;
  }
  if (list.dwNumberOfItems == 0) {
    return nullptr;
  }
  return &list.InterfaceInfo[0];
}

const WLAN_AVAILABLE_NETWORK* FindConnectedAvailable(
    const WLAN_AVAILABLE_NETWORK_LIST* list, const DOT11_SSID* ssid) {
  if (list == nullptr) {
    return nullptr;
  }
  const WLAN_AVAILABLE_NETWORK* flagged = nullptr;
  const WLAN_AVAILABLE_NETWORK* matched = nullptr;
  for (DWORD i = 0; i < list->dwNumberOfItems; ++i) {
    const WLAN_AVAILABLE_NETWORK& net = list->Network[i];
    if ((net.dwFlags & WLAN_AVAILABLE_NETWORK_CONNECTED) != 0) {
      flagged = &net;
    }
    if (ssid != nullptr && SsidEquals(net.dot11Ssid, *ssid)) {
      matched = &net;
    }
  }
  if (flagged != nullptr) {
    return flagged;
  }
  return matched;
}

EncodableMap CaptureSnapshot() {
  const ULONGLONG started = GetTickCount64();
  WlanClient client;
  DWORD negotiated = 0;
  const DWORD open_error =
      WlanOpenHandle(2, nullptr, &negotiated, &client.handle);
  (void)negotiated;
  if (open_error != ERROR_SUCCESS || client.handle == nullptr) {
    const bool denied = open_error == ERROR_ACCESS_DENIED;
    return DemoPayload(
        denied ? "denied" : "not-determined", false, ElapsedMs(started),
        ErrorMap("NO_INTERFACE",
                 open_error == ERROR_SUCCESS
                     ? "Native Wifi client handle was not created."
                     : "Native Wifi (wlanapi) is unavailable.",
                 true),
        "Wi-Fi", nullptr);
  }

  WlanMemory ifaces_mem;
  PWLAN_INTERFACE_INFO_LIST ifaces = nullptr;
  const DWORD enum_error =
      WlanEnumInterfaces(client.handle, nullptr, &ifaces);
  ifaces_mem.ptr = ifaces;
  if (enum_error != ERROR_SUCCESS || ifaces == nullptr ||
      ifaces->dwNumberOfItems == 0) {
    const bool denied = enum_error == ERROR_ACCESS_DENIED;
    return DemoPayload(
        denied ? "denied" : "not-determined", false, ElapsedMs(started),
        ErrorMap("NO_INTERFACE",
                 "No WLAN interface is visible to Native Wifi.", true),
        "Wi-Fi", nullptr);
  }

  const WLAN_INTERFACE_INFO* chosen = PickInterface(*ifaces);
  if (chosen == nullptr) {
    return DemoPayload("not-determined", false, ElapsedMs(started),
                       ErrorMap("NO_INTERFACE",
                                "No WLAN interface is visible to Native Wifi.",
                                true),
                       "Wi-Fi", nullptr);
  }

  const std::string interface_name =
      Utf8FromUtf16(chosen->strInterfaceDescription);

  WlanMemory conn_mem;
  PWLAN_CONNECTION_ATTRIBUTES conn = nullptr;
  DWORD conn_size = 0;
  const DWORD conn_error = WlanQueryInterface(
      client.handle, &chosen->InterfaceGuid,
      wlan_intf_opcode_current_connection, nullptr, &conn_size,
      reinterpret_cast<PVOID*>(&conn), nullptr);
  (void)conn_size;
  conn_mem.ptr = conn;

  WlanMemory avail_mem;
  PWLAN_AVAILABLE_NETWORK_LIST available = nullptr;
  const DWORD avail_error = WlanGetAvailableNetworkList(
      client.handle, &chosen->InterfaceGuid, 0, nullptr, &available);
  avail_mem.ptr = available;
  const DWORD available_count =
      (avail_error == ERROR_SUCCESS && available != nullptr)
          ? available->dwNumberOfItems
          : 0;

  const DOT11_SSID* connected_ssid = nullptr;
  if (conn_error == ERROR_SUCCESS && conn != nullptr) {
    connected_ssid = &conn->wlanAssociationAttributes.dot11Ssid;
  }
  const WLAN_AVAILABLE_NETWORK* available_connected =
      FindConnectedAvailable(available, connected_ssid);

  std::string ssid;
  std::string bssid;
  DOT11_SSID raw_ssid = {};
  ULONG quality = 0;
  BOOL security_enabled = TRUE;
  DOT11_AUTH_ALGORITHM auth = DOT11_AUTH_ALGO_80211_OPEN;
  DOT11_CIPHER_ALGORITHM cipher = DOT11_CIPHER_ALGO_NONE;
  DOT11_PHY_TYPE phy = dot11_phy_type_unknown;
  DOT11_BSS_TYPE bss_type = dot11_BSS_type_infrastructure;

  if (conn_error == ERROR_SUCCESS && conn != nullptr) {
    const WLAN_ASSOCIATION_ATTRIBUTES& assoc = conn->wlanAssociationAttributes;
    raw_ssid = assoc.dot11Ssid;
    ssid = SsidToUtf8(assoc.dot11Ssid);
    bssid = FormatBssid(assoc.dot11Bssid);
    quality = assoc.wlanSignalQuality;
    phy = assoc.dot11PhyType;
    bss_type = assoc.dot11BssType;
    security_enabled = conn->wlanSecurityAttributes.bSecurityEnabled;
    auth = conn->wlanSecurityAttributes.dot11AuthAlgorithm;
    cipher = conn->wlanSecurityAttributes.dot11CipherAlgorithm;
  } else if (available_connected != nullptr) {
    raw_ssid = available_connected->dot11Ssid;
    ssid = SsidToUtf8(available_connected->dot11Ssid);
    quality = available_connected->wlanSignalQuality;
    security_enabled = available_connected->bSecurityEnabled;
    auth = available_connected->dot11DefaultAuthAlgorithm;
    cipher = available_connected->dot11DefaultCipherAlgorithm;
    bss_type = available_connected->dot11BssType;
  }

  if (available_connected != nullptr) {
    if (quality == 0) {
      quality = available_connected->wlanSignalQuality;
    }
    if (ssid.empty()) {
      ssid = SsidToUtf8(available_connected->dot11Ssid);
      raw_ssid = available_connected->dot11Ssid;
    }
  }

  const bool has_identity = !ssid.empty() || !bssid.empty();
  if (!has_identity) {
    const bool radio_off = chosen->isState == wlan_interface_state_not_ready;
    std::string message = radio_off
                              ? "Wi-Fi radio is off or the WLAN interface is "
                                "not ready."
                              : "No Wi-Fi association detected. ";
    message += kNoBssListMessage;
    if (available_count > 0) {
      message += " Nearby SSID rows were not promoted to the workbench.";
    }
    return DemoPayload(
        conn_error == ERROR_ACCESS_DENIED || avail_error == ERROR_ACCESS_DENIED
            ? "denied"
            : "not-determined",
        false, ElapsedMs(started),
        ErrorMap("WIFI_OFF", message.c_str(), true),
        interface_name, nullptr);
  }

  if (available_connected != nullptr &&
      security_enabled == FALSE &&
      available_connected->bSecurityEnabled != FALSE) {
    security_enabled = available_connected->bSecurityEnabled;
    auth = available_connected->dot11DefaultAuthAlgorithm;
    cipher = available_connected->dot11DefaultCipherAlgorithm;
  }

  const int32_t rssi = QualityToRssi(quality);
  const char* security = SecurityFromAuth(auth, cipher, security_enabled);
  const char* phy_letter = PhyLetter(phy);
  const bool ibss = bss_type == dot11_BSS_type_independent;
  const EncodableMap associated = AssociatedMap(ssid, bssid, rssi);

  EncodableList networks;
  networks.emplace_back(ConnectedRow(ssid, bssid, raw_ssid, rssi, security,
                                     phy_letter, ibss));

  EncodableMap payload;
  PutString(payload, "capturedAt", Iso8601NowUtc());
  PutString(payload, "interfaceName",
            interface_name.empty() ? "Wi-Fi" : interface_name);
  PutString(payload, "location", "granted");
  PutBool(payload, "locationAuthorized", true);
  PutBool(payload, "includeHiddenRequested", false);
  PutString(payload, "source", kSourceConnected);
  PutBool(payload, "demo", false);
  payload[EncodableValue("networks")] = EncodableValue(networks);
  payload[EncodableValue("associated")] = EncodableValue(associated);
  PutInt(payload, "scanDurationMs", ElapsedMs(started));
  if (bssid.empty()) {
    payload[EncodableValue("error")] = EncodableValue(ErrorMap(
        "BSSID_UNAVAILABLE",
        "Associated SSID is visible but BSSID was not returned by Native Wifi.",
        false));
  }
  return payload;
}

std::string LocationWire() {
  WlanClient client;
  DWORD negotiated = 0;
  const DWORD open_error =
      WlanOpenHandle(2, nullptr, &negotiated, &client.handle);
  (void)negotiated;
  if (open_error == ERROR_ACCESS_DENIED) {
    return "denied";
  }
  if (open_error != ERROR_SUCCESS || client.handle == nullptr) {
    return "not-determined";
  }
  WlanMemory ifaces_mem;
  PWLAN_INTERFACE_INFO_LIST ifaces = nullptr;
  const DWORD enum_error =
      WlanEnumInterfaces(client.handle, nullptr, &ifaces);
  ifaces_mem.ptr = ifaces;
  if (enum_error == ERROR_ACCESS_DENIED) {
    return "denied";
  }
  if (enum_error == ERROR_SUCCESS && ifaces != nullptr &&
      ifaces->dwNumberOfItems > 0) {
    return "granted";
  }
  return "not-determined";
}

}  // namespace

WindowsScanBridge::WindowsScanBridge(flutter::BinaryMessenger* messenger) {
  channel_ = std::make_unique<flutter::MethodChannel<EncodableValue>>(
      messenger, kChannelName, &flutter::StandardMethodCodec::GetInstance());
  channel_->SetMethodCallHandler(
      [this](const flutter::MethodCall<EncodableValue>& call,
             std::unique_ptr<flutter::MethodResult<EncodableValue>> result) {
        HandleMethodCall(call, std::move(result));
      });
}

WindowsScanBridge::~WindowsScanBridge() {
  if (channel_) {
    channel_->SetMethodCallHandler(nullptr);
  }
}

void WindowsScanBridge::HandleMethodCall(
    const flutter::MethodCall<EncodableValue>& call,
    std::unique_ptr<flutter::MethodResult<EncodableValue>> result) {
  if (call.method_name() == "getSnapshot") {
    result->Success(EncodableValue(CaptureSnapshot()));
    return;
  }
  if (call.method_name() == "requestLocationAuthorization") {
    result->Success(EncodableValue(LocationWire()));
    return;
  }
  result->NotImplemented();
}
