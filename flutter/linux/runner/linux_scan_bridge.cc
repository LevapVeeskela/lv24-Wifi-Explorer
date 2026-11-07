#include "linux_scan_bridge.h"

#include <cstring>

#include <gio/gio.h>

namespace {

constexpr char kChannelName[] = "dev.lv24.wifi_explorer/linux_scan";
constexpr char kNmBus[] = "org.freedesktop.NetworkManager";
constexpr char kNmPath[] = "/org/freedesktop/NetworkManager";
constexpr char kNmIface[] = "org.freedesktop.NetworkManager";
constexpr char kDeviceIface[] = "org.freedesktop.NetworkManager.Device";
constexpr char kWirelessIface[] = "org.freedesktop.NetworkManager.Device.Wireless";
constexpr char kAccessPointIface[] = "org.freedesktop.NetworkManager.AccessPoint";
constexpr char kActiveConnectionIface[] =
    "org.freedesktop.NetworkManager.Connection.Active";
constexpr char kPropertiesIface[] = "org.freedesktop.DBus.Properties";

constexpr guint kNmDeviceTypeWifi = 2;

constexpr char kSourceAccessPoints[] = "networkManagerAccessPoints";
constexpr char kSourceConnectedOnly[] = "connectedNetworkOnly";
constexpr char kSourceDemo[] = "demo";

static int64_t NowMonotonicMs() {
  return g_get_monotonic_time() / 1000;
}

static gchar* Iso8601NowUtc() {
  GDateTime* now = g_date_time_new_now_utc();
  gchar* out = g_date_time_format(now, "%Y-%m-%dT%H:%M:%S.000Z");
  g_date_time_unref(now);
  return out;
}

static GVariant* NmGetProperty(GDBusConnection* connection,
                               const gchar* object_path,
                               const gchar* interface_name,
                               const gchar* property_name,
                               GError** error) {
  g_autoptr(GVariant) result = g_dbus_connection_call_sync(
      connection, kNmBus, object_path, kPropertiesIface, "Get",
      g_variant_new("(ss)", interface_name, property_name),
      G_VARIANT_TYPE("(v)"), G_DBUS_CALL_FLAGS_NONE, 5000, nullptr, error);
  if (result == nullptr) {
    return nullptr;
  }
  GVariant* inner = nullptr;
  g_variant_get(result, "(v)", &inner);
  return inner;
}

static GVariant* NmCall(GDBusConnection* connection,
                        const gchar* object_path,
                        const gchar* interface_name,
                        const gchar* method_name,
                        GVariant* parameters,
                        const GVariantType* reply_type,
                        GError** error) {
  return g_dbus_connection_call_sync(
      connection, kNmBus, object_path, interface_name, method_name, parameters,
      reply_type, G_DBUS_CALL_FLAGS_NONE, 8000, nullptr, error);
}

static gchar* FindWifiDevicePath(GDBusConnection* connection, GError** error) {
  g_autoptr(GVariant) result =
      NmCall(connection, kNmPath, kNmIface, "GetDevices", g_variant_new("()"),
             G_VARIANT_TYPE("(ao)"), error);
  if (result == nullptr) {
    return nullptr;
  }

  g_autoptr(GVariant) paths = g_variant_get_child_value(result, 0);
  const gchar* chosen = nullptr;
  gsize length = g_variant_n_children(paths);
  for (gsize i = 0; i < length; i++) {
    g_autoptr(GVariant) child = g_variant_get_child_value(paths, i);
    const gchar* path = g_variant_get_string(child, nullptr);
    g_autoptr(GVariant) type_variant =
        NmGetProperty(connection, path, kDeviceIface, "DeviceType", error);
    if (type_variant == nullptr) {
      g_clear_error(error);
      continue;
    }
    guint32 device_type = 0;
    g_variant_get(type_variant, "u", &device_type);
    if (device_type == kNmDeviceTypeWifi) {
      chosen = path;
      break;
    }
  }
  if (chosen == nullptr) {
    g_set_error(error, G_IO_ERROR, G_IO_ERROR_NOT_FOUND,
                "No NetworkManager Wi-Fi device found");
    return nullptr;
  }
  return g_strdup(chosen);
}

static gchar* VariantBytesToUtf8(GVariant* value) {
  if (value == nullptr) {
    return nullptr;
  }
  gsize length = 0;
  const guint8* bytes = static_cast<const guint8*>(
      g_variant_get_fixed_array(value, &length, sizeof(guint8)));
  if (length == 0) {
    return nullptr;
  }
  GString* out = g_string_sized_new(length);
  for (gsize i = 0; i < length; i++) {
    if (bytes[i] == '\0') {
      continue;
    }
    g_string_append_c(out, static_cast<gchar>(bytes[i]));
  }
  if (out->len == 0) {
    g_string_free(out, TRUE);
    return nullptr;
  }
  return g_string_free(out, FALSE);
}

static gchar* VariantBytesToBssid(GVariant* value) {
  if (value == nullptr) {
    return nullptr;
  }
  gsize length = 0;
  const guint8* bytes = static_cast<const guint8*>(
      g_variant_get_fixed_array(value, &length, sizeof(guint8)));
  if (length != 6) {
    return nullptr;
  }
  return g_strdup_printf("%02x:%02x:%02x:%02x:%02x:%02x", bytes[0], bytes[1],
                         bytes[2], bytes[3], bytes[4], bytes[5]);
}

static int FrequencyToChannel(guint32 frequency_mhz) {
  if (frequency_mhz >= 2412 && frequency_mhz <= 2484) {
    if (frequency_mhz == 2484) {
      return 14;
    }
    return static_cast<int>((frequency_mhz - 2407) / 5);
  }
  if (frequency_mhz >= 5170 && frequency_mhz <= 5825) {
    return static_cast<int>((frequency_mhz - 5000) / 5);
  }
  if (frequency_mhz >= 5955 && frequency_mhz <= 7115) {
    return static_cast<int>((frequency_mhz - 5950) / 5);
  }
  return 0;
}

static const char* FrequencyToBand(guint32 frequency_mhz) {
  if (frequency_mhz >= 2400 && frequency_mhz < 2500) {
    return "2.4GHz";
  }
  if (frequency_mhz >= 4900 && frequency_mhz < 5900) {
    return "5GHz";
  }
  if (frequency_mhz >= 5900) {
    return "6GHz";
  }
  return "unknown";
}

static int StrengthToRssi(guchar strength) {
  if (strength > 100) {
    strength = 100;
  }
  return static_cast<int>(strength) / 2 - 100;
}

static FlValue* SecurityListFromFlags(guint32 flags, guint32 wpa_flags,
                                      guint32 rsn_flags) {
  FlValue* list = fl_value_new_list();
  if (rsn_flags != 0) {
    fl_value_append_take(list, fl_value_new_string("wpa2-personal"));
    return list;
  }
  if (wpa_flags != 0) {
    fl_value_append_take(list, fl_value_new_string("wpa-personal"));
    return list;
  }
  if ((flags & 0x1) != 0) {
    fl_value_append_take(list, fl_value_new_string("wep"));
    return list;
  }
  fl_value_append_take(list, fl_value_new_string("open"));
  return list;
}

static FlValue* ReadAccessPointRow(GDBusConnection* connection,
                                   const gchar* ap_path, GError** error) {
  g_autoptr(GVariant) ssid_v =
      NmGetProperty(connection, ap_path, kAccessPointIface, "Ssid", error);
  if (ssid_v == nullptr) {
    return nullptr;
  }
  g_autoptr(GVariant) bssid_v =
      NmGetProperty(connection, ap_path, kAccessPointIface, "Bssid", error);
  g_autoptr(GVariant) strength_v =
      NmGetProperty(connection, ap_path, kAccessPointIface, "Strength", error);
  g_autoptr(GVariant) freq_v =
      NmGetProperty(connection, ap_path, kAccessPointIface, "Frequency", error);
  g_autoptr(GVariant) flags_v =
      NmGetProperty(connection, ap_path, kAccessPointIface, "Flags", error);
  g_autoptr(GVariant) wpa_v =
      NmGetProperty(connection, ap_path, kAccessPointIface, "WpaFlags", error);
  g_autoptr(GVariant) rsn_v =
      NmGetProperty(connection, ap_path, kAccessPointIface, "RsnFlags", error);
  if (strength_v == nullptr || freq_v == nullptr) {
    return nullptr;
  }

  g_autofree gchar* ssid = VariantBytesToUtf8(ssid_v);
  g_autofree gchar* bssid = VariantBytesToBssid(bssid_v);
  guchar strength = 0;
  guint32 frequency = 0;
  guint32 flags = 0;
  guint32 wpa_flags = 0;
  guint32 rsn_flags = 0;
  g_variant_get(strength_v, "y", &strength);
  g_variant_get(freq_v, "u", &frequency);
  if (flags_v != nullptr) {
    g_variant_get(flags_v, "u", &flags);
  }
  if (wpa_v != nullptr) {
    g_variant_get(wpa_v, "u", &wpa_flags);
  }
  if (rsn_v != nullptr) {
    g_variant_get(rsn_v, "u", &rsn_flags);
  }

  const int channel = FrequencyToChannel(frequency);
  FlValue* row = fl_value_new_map();
  if (ssid != nullptr) {
    fl_value_set_string_take(row, "ssid", fl_value_new_string(ssid));
  } else {
    fl_value_set_string(row, "ssid", fl_value_new_null());
  }
  if (bssid != nullptr) {
    fl_value_set_string_take(row, "bssid", fl_value_new_string(bssid));
  } else {
    fl_value_set_string(row, "bssid", fl_value_new_null());
  }
  fl_value_set_string_take(row, "rssiDbm",
                           fl_value_new_int(StrengthToRssi(strength)));
  fl_value_set_string_take(row, "noiseDbm", fl_value_new_int(0));
  if (channel > 0) {
    fl_value_set_string_take(row, "channelNumber", fl_value_new_int(channel));
  } else {
    fl_value_set_string(row, "channelNumber", fl_value_new_null());
  }
  fl_value_set_string_take(
      row, "channelBand",
      fl_value_new_string(FrequencyToBand(frequency)));
  fl_value_set_string_take(row, "channelWidth", fl_value_new_string("unknown"));
  fl_value_set_string_take(
      row, "supportedSecurity", SecurityListFromFlags(flags, wpa_flags, rsn_flags));
  fl_value_set_string_take(row, "supportedPhyModes", fl_value_new_list());
  fl_value_set_string_take(row, "ibss", fl_value_new_bool(FALSE));
  return row;
}

static FlValue* ReadAssociatedFromAccessPoint(GDBusConnection* connection,
                                                const gchar* ap_path) {
  g_autoptr(GError) error = nullptr;
  g_autoptr(GVariant) ssid_v =
      NmGetProperty(connection, ap_path, kAccessPointIface, "Ssid", &error);
  g_autoptr(GVariant) bssid_v =
      NmGetProperty(connection, ap_path, kAccessPointIface, "Bssid", &error);
  g_autoptr(GVariant) strength_v =
      NmGetProperty(connection, ap_path, kAccessPointIface, "Strength", &error);
  g_autoptr(GVariant) freq_v =
      NmGetProperty(connection, ap_path, kAccessPointIface, "Frequency", &error);
  if (strength_v == nullptr || freq_v == nullptr) {
    return nullptr;
  }

  g_autofree gchar* ssid = VariantBytesToUtf8(ssid_v);
  g_autofree gchar* bssid = VariantBytesToBssid(bssid_v);
  guchar strength = 0;
  guint32 frequency = 0;
  g_variant_get(strength_v, "y", &strength);
  g_variant_get(freq_v, "u", &frequency);
  const int channel = FrequencyToChannel(frequency);

  FlValue* associated = fl_value_new_map();
  if (ssid != nullptr) {
    fl_value_set_string_take(associated, "ssid", fl_value_new_string(ssid));
  } else {
    fl_value_set_string(associated, "ssid", fl_value_new_null());
  }
  if (bssid != nullptr) {
    fl_value_set_string_take(associated, "bssid", fl_value_new_string(bssid));
  } else {
    fl_value_set_string(associated, "bssid", fl_value_new_null());
  }
  fl_value_set_string_take(associated, "rssiDbm",
                             fl_value_new_int(StrengthToRssi(strength)));
  if (channel > 0) {
    fl_value_set_string_take(associated, "channelNumber",
                               fl_value_new_int(channel));
  } else {
    fl_value_set_string(associated, "channelNumber", fl_value_new_null());
  }
  fl_value_set_string_take(
      associated, "channelBand",
      fl_value_new_string(FrequencyToBand(frequency)));
  return associated;
}

static FlValue* ReadAssociatedFromActiveConnection(GDBusConnection* connection,
                                                   const gchar* device_path) {
  g_autoptr(GError) error = nullptr;
  g_autoptr(GVariant) active_v = NmGetProperty(
      connection, device_path, kDeviceIface, "ActiveConnection", &error);
  if (active_v == nullptr) {
    return nullptr;
  }
  const gchar* active_path = g_variant_get_string(active_v, nullptr);
  if (active_path == nullptr || active_path[0] == '\0' ||
      strcmp(active_path, "/") == 0) {
    return nullptr;
  }

  g_autoptr(GVariant) id_v = NmGetProperty(connection, active_path,
                                           kActiveConnectionIface, "Id", &error);
  g_autofree gchar* ssid = nullptr;
  if (id_v != nullptr) {
    ssid = g_variant_dup_string(id_v, nullptr);
  }

  FlValue* associated = fl_value_new_map();
  if (ssid != nullptr && ssid[0] != '\0') {
    fl_value_set_string_take(associated, "ssid", fl_value_new_string(ssid));
  } else {
    fl_value_set_string(associated, "ssid", fl_value_new_null());
  }
  fl_value_set_string(associated, "bssid", fl_value_new_null());
  fl_value_set_string(associated, "rssiDbm", fl_value_new_null());
  fl_value_set_string(associated, "channelNumber", fl_value_new_null());
  fl_value_set_string(associated, "channelBand", fl_value_new_null());
  return associated;
}

static bool AssociatedHasIdentity(FlValue* associated) {
  if (associated == nullptr) {
    return false;
  }
  FlValue* ssid = fl_value_lookup_string(associated, "ssid");
  if (ssid != nullptr && fl_value_get_type(ssid) == FL_VALUE_TYPE_STRING) {
    const gchar* text = fl_value_get_string(ssid);
    if (text != nullptr && text[0] != '\0') {
      return true;
    }
  }
  FlValue* bssid = fl_value_lookup_string(associated, "bssid");
  if (bssid != nullptr && fl_value_get_type(bssid) == FL_VALUE_TYPE_STRING) {
    const gchar* text = fl_value_get_string(bssid);
    if (text != nullptr && text[0] != '\0') {
      return true;
    }
  }
  return false;
}

static FlValue* ConnectedRowFromAssociated(FlValue* associated) {
  FlValue* row = fl_value_new_map();
  FlValue* ssid = fl_value_lookup_string(associated, "ssid");
  FlValue* bssid = fl_value_lookup_string(associated, "bssid");
  fl_value_set_string(
      row, "ssid",
      ssid != nullptr ? fl_value_ref(ssid) : fl_value_new_null());
  fl_value_set_string(
      row, "bssid",
      bssid != nullptr ? fl_value_ref(bssid) : fl_value_new_null());
  FlValue* rssi = fl_value_lookup_string(associated, "rssiDbm");
  fl_value_set_string(row, "rssiDbm",
                      rssi != nullptr && fl_value_get_type(rssi) != FL_VALUE_TYPE_NULL
                          ? fl_value_ref(rssi)
                          : fl_value_new_int(0));
  fl_value_set_string_take(row, "noiseDbm", fl_value_new_int(0));
  FlValue* channel = fl_value_lookup_string(associated, "channelNumber");
  fl_value_set_string(
      row, "channelNumber",
      channel != nullptr ? fl_value_ref(channel) : fl_value_new_null());
  FlValue* band = fl_value_lookup_string(associated, "channelBand");
  fl_value_set_string(
      row, "channelBand",
      band != nullptr ? fl_value_ref(band) : fl_value_new_string("unknown"));
  fl_value_set_string_take(row, "channelWidth", fl_value_new_string("unknown"));
  fl_value_set_string_take(row, "supportedSecurity", fl_value_new_list());
  fl_value_set_string_take(row, "supportedPhyModes", fl_value_new_list());
  fl_value_set_string_take(row, "ibss", fl_value_new_bool(FALSE));
  return row;
}

static FlValue* ErrorMap(const char* code, const char* message,
                         bool demo_fallback) {
  FlValue* error = fl_value_new_map();
  fl_value_set_string_take(error, "code", fl_value_new_string(code));
  fl_value_set_string_take(error, "message", fl_value_new_string(message));
  fl_value_set_string_take(error, "recoverable", fl_value_new_bool(TRUE));
  fl_value_set_string_take(error, "demoFallback",
                             fl_value_new_bool(demo_fallback));
  return error;
}

static FlValue* BuildSnapshotPayload(GDBusConnection* connection,
                                     const gchar* device_path,
                                     int64_t started_ms) {
  g_autoptr(GError) error = nullptr;
  g_autofree gchar* interface_name = nullptr;
  g_autoptr(GVariant) iface_v =
      NmGetProperty(connection, device_path, kDeviceIface, "Interface", &error);
  if (iface_v != nullptr) {
    interface_name = g_variant_dup_string(iface_v, nullptr);
  }

  g_autoptr(GVariant) active_ap_v = NmGetProperty(
      connection, device_path, kWirelessIface, "ActiveAccessPoint", &error);
  g_autofree gchar* active_ap_path = nullptr;
  if (active_ap_v != nullptr) {
    active_ap_path = g_variant_dup_string(active_ap_v, nullptr);
  }

  FlValue* associated = nullptr;
  if (active_ap_path != nullptr && active_ap_path[0] != '\0' &&
      strcmp(active_ap_path, "/") != 0) {
    associated = ReadAssociatedFromAccessPoint(connection, active_ap_path);
  }
  if (associated == nullptr) {
    associated = ReadAssociatedFromActiveConnection(connection, device_path);
  }

  bool access_points_ok = false;
  FlValue* networks = fl_value_new_list();
  g_autoptr(GError) ap_error = nullptr;
  g_autoptr(GVariant) ap_result =
      NmCall(connection, device_path, kWirelessIface, "GetAccessPoints",
             g_variant_new("()"), G_VARIANT_TYPE("(ao)"), &ap_error);
  if (ap_result != nullptr) {
    access_points_ok = true;
    g_autoptr(GVariant) ap_paths = g_variant_get_child_value(ap_result, 0);
    const gsize ap_count = g_variant_n_children(ap_paths);
    for (gsize i = 0; i < ap_count; i++) {
      g_autoptr(GVariant) child = g_variant_get_child_value(ap_paths, i);
      const gchar* ap_path = g_variant_get_string(child, nullptr);
      g_autoptr(GError) row_error = nullptr;
      g_autoptr(FlValue) row =
          ReadAccessPointRow(connection, ap_path, &row_error);
      if (row != nullptr) {
        fl_value_append_take(networks, fl_value_ref(row));
      }
    }
  }

  const int duration_ms = static_cast<int>(NowMonotonicMs() - started_ms);
  g_autofree gchar* captured_at = Iso8601NowUtc();

  FlValue* payload = fl_value_new_map();
  fl_value_set_string_take(payload, "capturedAt",
                           fl_value_new_string(captured_at));
  if (interface_name != nullptr) {
    fl_value_set_string_take(payload, "interfaceName",
                             fl_value_new_string(interface_name));
  } else {
    fl_value_set_string_take(payload, "interfaceName",
                             fl_value_new_string("wlan0"));
  }
  fl_value_set_string_take(payload, "location",
                           fl_value_new_string("not-applicable"));
  fl_value_set_string_take(payload, "locationAuthorized",
                           fl_value_new_bool(TRUE));
  fl_value_set_string_take(payload, "includeHiddenRequested",
                           fl_value_new_bool(FALSE));

  const gsize network_count = fl_value_get_length(networks);
  if (access_points_ok && network_count > 0) {
    fl_value_set_string_take(payload, "source",
                             fl_value_new_string(kSourceAccessPoints));
    fl_value_set_string_take(payload, "demo", fl_value_new_bool(FALSE));
    fl_value_set_string_take(payload, "networks", networks);
    if (associated != nullptr) {
      fl_value_set_string_take(payload, "associated", associated);
    } else {
      fl_value_set_string(payload, "associated", fl_value_new_null());
    }
  } else if (access_points_ok && AssociatedHasIdentity(associated)) {
    FlValue* connected_rows = fl_value_new_list();
    fl_value_append_take(connected_rows,
                         ConnectedRowFromAssociated(associated));
    fl_value_set_string_take(payload, "source",
                             fl_value_new_string(kSourceConnectedOnly));
    fl_value_set_string_take(payload, "demo", fl_value_new_bool(FALSE));
    fl_value_set_string_take(payload, "networks", connected_rows);
    fl_value_set_string_take(payload, "associated", associated);
    fl_value_unref(networks);
  } else {
    fl_value_unref(networks);
    fl_value_set_string_take(payload, "source", fl_value_new_string(kSourceDemo));
    fl_value_set_string_take(payload, "demo", fl_value_new_bool(TRUE));
    fl_value_set_string_take(payload, "networks", fl_value_new_list());
    if (!access_points_ok && AssociatedHasIdentity(associated)) {
      fl_value_set_string_take(payload, "associated", associated);
    } else {
      if (associated != nullptr) {
        fl_value_unref(associated);
      }
      fl_value_set_string(payload, "associated", fl_value_new_null());
    }

    const char* message = nullptr;
    if (!access_points_ok) {
      message =
          "NetworkManager GetAccessPoints is unavailable in this session "
          "(cached scan list not exposed); showing demo fixtures with any "
          "known associated link from ActiveConnection.";
    } else if (AssociatedHasIdentity(associated)) {
      message =
          "NetworkManager returned no visible access points; showing demo "
          "fixtures.";
    } else {
      message =
          "No Wi-Fi access points or association visible via NetworkManager; "
          "showing demo fixtures.";
    }
    fl_value_set_string_take(payload, "error",
                             ErrorMap("NM_SCAN_LIMITED", message, true));
  }

  fl_value_set_string_take(payload, "scanDurationMs",
                           fl_value_new_int(duration_ms));

  return payload;
}

static FlValue* CaptureSnapshot() {
  const int64_t started_ms = NowMonotonicMs();
  g_autoptr(GError) error = nullptr;
  g_autoptr(GDBusConnection) connection =
      g_bus_get_sync(G_BUS_TYPE_SYSTEM, nullptr, &error);
  if (connection == nullptr) {
    g_autofree gchar* captured_at = Iso8601NowUtc();
    FlValue* payload = fl_value_new_map();
    fl_value_set_string_take(payload, "capturedAt",
                             fl_value_new_string(captured_at));
    fl_value_set_string_take(payload, "interfaceName",
                             fl_value_new_string("wlan0"));
    fl_value_set_string_take(payload, "location",
                             fl_value_new_string("not-applicable"));
    fl_value_set_string_take(payload, "locationAuthorized",
                             fl_value_new_bool(TRUE));
    fl_value_set_string_take(payload, "includeHiddenRequested",
                             fl_value_new_bool(FALSE));
    fl_value_set_string_take(payload, "source", fl_value_new_string(kSourceDemo));
    fl_value_set_string_take(payload, "demo", fl_value_new_bool(TRUE));
    fl_value_set_string_take(payload, "networks", fl_value_new_list());
    fl_value_set_string(payload, "associated", fl_value_new_null());
    fl_value_set_string_take(
        payload, "error",
        ErrorMap("NM_UNAVAILABLE",
                 error != nullptr ? error->message
                                  : "Could not connect to system D-Bus.",
                 true));
    fl_value_set_string_take(
        payload, "scanDurationMs",
        fl_value_new_int(static_cast<int>(NowMonotonicMs() - started_ms)));
    return payload;
  }

  g_autofree gchar* device_path = FindWifiDevicePath(connection, &error);
  if (device_path == nullptr) {
    g_autofree gchar* captured_at = Iso8601NowUtc();
    FlValue* payload = fl_value_new_map();
    fl_value_set_string_take(payload, "capturedAt",
                             fl_value_new_string(captured_at));
    fl_value_set_string_take(payload, "interfaceName",
                             fl_value_new_string("wlan0"));
    fl_value_set_string_take(payload, "location",
                             fl_value_new_string("not-applicable"));
    fl_value_set_string_take(payload, "locationAuthorized",
                             fl_value_new_bool(TRUE));
    fl_value_set_string_take(payload, "includeHiddenRequested",
                             fl_value_new_bool(FALSE));
    fl_value_set_string_take(payload, "source", fl_value_new_string(kSourceDemo));
    fl_value_set_string_take(payload, "demo", fl_value_new_bool(TRUE));
    fl_value_set_string_take(payload, "networks", fl_value_new_list());
    fl_value_set_string(payload, "associated", fl_value_new_null());
    fl_value_set_string_take(
        payload, "error",
        ErrorMap("NM_NO_WIFI",
                 error != nullptr ? error->message : "No Wi-Fi device.", true));
    fl_value_set_string_take(
        payload, "scanDurationMs",
        fl_value_new_int(static_cast<int>(NowMonotonicMs() - started_ms)));
    return payload;
  }

  return BuildSnapshotPayload(connection, device_path, started_ms);
}

static void MethodCallCb(FlMethodChannel* channel, FlMethodCall* method_call,
                         gpointer user_data) {
  const gchar* method = fl_method_call_get_name(method_call);
  g_autoptr(FlMethodResponse) response = nullptr;

  if (strcmp(method, "getSnapshot") == 0) {
    FlValue* payload = CaptureSnapshot();
    response = FL_METHOD_RESPONSE(fl_method_success_response_new(payload));
  } else if (strcmp(method, "requestLocationAuthorization") == 0) {
    response = FL_METHOD_RESPONSE(
        fl_method_success_response_new(fl_value_new_string("not-applicable")));
  } else {
    response = FL_METHOD_RESPONSE(fl_method_not_implemented_response_new());
  }

  g_autoptr(GError) error = nullptr;
  if (!fl_method_call_respond(method_call, response, &error)) {
    g_warning("Linux scan bridge failed to respond: %s", error->message);
  }
}

}  // namespace

void linux_scan_bridge_register(FlView* view) {
  static bool registered = false;
  if (registered) {
    return;
  }
  registered = true;

  FlEngine* engine = fl_view_get_engine(view);
  g_autoptr(FlStandardMethodCodec) codec = fl_standard_method_codec_new();
  FlBinaryMessenger* messenger = fl_engine_get_binary_messenger(engine);
  g_autoptr(FlMethodChannel) channel = fl_method_channel_new(
      messenger, kChannelName, FL_METHOD_CODEC(codec));
  fl_method_channel_set_method_call_handler(channel, MethodCallCb, nullptr,
                                            nullptr);
  g_object_ref(channel);
}
