package by.lv24.lv24_wifi_explorer

import android.Manifest
import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.location.LocationManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.location.LocationManagerCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.PluginRegistry
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Public-API Android v1 scan bridge: [WifiManager.startScan] / [WifiManager.getScanResults]
 * plus [WifiInfo] for the associated link. No monitor mode, no hidden Wi‑Fi APIs.
 */
class AndroidScanBridge :
  FlutterPlugin,
  MethodChannel.MethodCallHandler,
  ActivityAware,
  PluginRegistry.RequestPermissionsResultListener {

  companion object {
    const val CHANNEL_NAME = "dev.lv24.wifi_explorer/android_scan"
    private const val PERMISSION_REQ = 2413
    private const val SOURCE_LIVE = "wifiManagerScanResults"
    private const val SOURCE_DEMO = "demo"
    private const val LIMITED_MESSAGE = "scan limited by Android"
  }

  private var channel: MethodChannel? = null
  private var appContext: Context? = null
  private var activity: Activity? = null
  private var activityBinding: ActivityPluginBinding? = null
  private var pendingPermissionResult: MethodChannel.Result? = null
  private var requestedPermissionsOnce = false

  private val mainHandler = Handler(Looper.getMainLooper())
  private val executor = Executors.newSingleThreadExecutor { runnable ->
    Thread(runnable, "lv24-android-scan").apply { isDaemon = true }
  }
  private val scanLock = Any()
  private val scanInFlight = AtomicBoolean(false)

  private var lastStartScanElapsedMs = 0L
  private var lastSuggestedIntervalMs = AndroidScanThrottle.ANDROID_FLOOR_MS
  private var consecutiveFailures = 0

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    appContext = binding.applicationContext
    channel = MethodChannel(binding.binaryMessenger, CHANNEL_NAME).also {
      it.setMethodCallHandler(this)
    }
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    channel?.setMethodCallHandler(null)
    channel = null
    appContext = null
    executor.shutdownNow()
  }

  override fun onAttachedToActivity(binding: ActivityPluginBinding) {
    activityBinding = binding
    activity = binding.activity
    binding.addRequestPermissionsResultListener(this)
  }

  override fun onDetachedFromActivityForConfigChanges() {
    detachActivity()
  }

  override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
    onAttachedToActivity(binding)
  }

  override fun onDetachedFromActivity() {
    detachActivity()
  }

  private fun detachActivity() {
    activityBinding?.removeRequestPermissionsResultListener(this)
    activityBinding = null
    activity = null
  }

  override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
    when (call.method) {
      "getSnapshot" -> captureSnapshot(result)
      "requestLocationAuthorization" -> requestLocationAuthorization(result)
      else -> result.notImplemented()
    }
  }

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<out String>,
    grantResults: IntArray,
  ): Boolean {
    if (requestCode != PERMISSION_REQ) return false
    val pending = pendingPermissionResult ?: return false
    pendingPermissionResult = null
    pending.success(locationWire())
    return true
  }

  private fun requestLocationAuthorization(result: MethodChannel.Result) {
    val act = activity
    if (act == null) {
      result.success(locationWire())
      return
    }
    val needed = missingRuntimePermissions()
    if (needed.isEmpty()) {
      result.success(locationWire())
      return
    }
    requestedPermissionsOnce = true
    pendingPermissionResult = result
    ActivityCompat.requestPermissions(act, needed.toTypedArray(), PERMISSION_REQ)
  }

  private fun captureSnapshot(result: MethodChannel.Result) {
    if (!scanInFlight.compareAndSet(false, true)) {
      executor.execute {
        val payload = synchronized(scanLock) {
          buildSnapshot(forceCached = true, cacheReason = "in-flight")
        }
        mainHandler.post { result.success(payload) }
        // in-flight flag belongs to the owner of the active scan
      }
      return
    }
    executor.execute {
      val payload = try {
        synchronized(scanLock) {
          buildSnapshot(forceCached = false, cacheReason = null)
        }
      } catch (error: Exception) {
        mainHandler.post {
          result.error("SCAN_FAILED", error.message ?: LIMITED_MESSAGE, null)
        }
        scanInFlight.set(false)
        return@execute
      }
      mainHandler.post { result.success(payload) }
      scanInFlight.set(false)
    }
  }

  private fun buildSnapshot(forceCached: Boolean, cacheReason: String?): Map<String, Any> {
    val startedAt = SystemClock.elapsedRealtime()
    val context = appContext
      ?: return demoPayload(
        location = "not-determined",
        locationAuthorized = false,
        scanDurationMs = 0,
        error = errorMap("NO_INTERFACE", "Android scan context unavailable.", demoFallback = true),
      )

    val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
    if (wifi == null) {
      return demoPayload(
        location = locationWire(),
        locationAuthorized = false,
        scanDurationMs = elapsedMs(startedAt),
        error = errorMap(
          "NO_INTERFACE",
          "WifiManager is not available on this device.",
          demoFallback = true,
        ),
      )
    }

    val location = locationWire()
    val authorized = location == "granted"
    if (!hasScanPermission()) {
      return livePayload(
        wifi = wifi,
        location = location,
        locationAuthorized = false,
        networks = emptyList(),
        associated = null,
        stale = true,
        throttled = false,
        scanDurationMs = elapsedMs(startedAt),
        suggestedIntervalMs = AndroidScanThrottle.ANDROID_FLOOR_MS.toInt(),
        error = errorMap(
          "LOCATION_DENIED",
          "Location or Nearby Wi‑Fi permission is required to read Android scan results.",
        ),
      )
    }

    if (!wifi.isWifiEnabled) {
      return livePayload(
        wifi = wifi,
        location = location,
        locationAuthorized = authorized,
        networks = emptyList(),
        associated = associatedOf(context, wifi),
        stale = true,
        throttled = false,
        scanDurationMs = elapsedMs(startedAt),
        suggestedIntervalMs = AndroidScanThrottle.ANDROID_FLOOR_MS.toInt(),
        error = errorMap("WIFI_OFF", "Wi‑Fi is turned off."),
      )
    }

    val foreground = isAppVisible()
    val nowElapsed = SystemClock.elapsedRealtime()
    val intervalElapsed =
      lastStartScanElapsedMs == 0L ||
        nowElapsed - lastStartScanElapsedMs >= lastSuggestedIntervalMs
    val attemptStart = !forceCached && foreground && intervalElapsed

    var throttled = false
    var stale = forceCached || !attemptStart
    var error: Map<String, Any>? = null

    if (!foreground && !forceCached) {
      stale = true
      error = errorMap("SCAN_FAILED", LIMITED_MESSAGE)
    }

    if (attemptStart) {
      lastStartScanElapsedMs = nowElapsed
      val started = try {
        @Suppress("DEPRECATION")
        wifi.startScan()
      } catch (_: SecurityException) {
        false
      }
      if (!started) {
        throttled = true
        stale = true
        consecutiveFailures += 1
        error = errorMap("SCAN_FAILED", LIMITED_MESSAGE)
      } else {
        val updated = awaitScanResults(context, wifi)
        if (updated) {
          consecutiveFailures = 0
          stale = false
        } else {
          stale = true
          consecutiveFailures += 1
          error = errorMap("TIMEOUT", LIMITED_MESSAGE)
        }
      }
    } else if (cacheReason == "in-flight") {
      stale = true
    }

    val durationMs = elapsedMs(startedAt)
    val suggested = AndroidScanThrottle.suggestedIntervalMs(
      lastDurationMs = durationMs.toLong(),
      throttled = throttled,
      consecutiveFailures = consecutiveFailures,
    )
    lastSuggestedIntervalMs = suggested

    val results = try {
      AndroidScanMapper.dedupeScanResults(wifi.scanResults.orEmpty())
    } catch (_: SecurityException) {
      emptyList()
    }

    if (results.isEmpty() && error == null && !authorized) {
      error = errorMap(
        "BSSID_UNAVAILABLE",
        "SSID/BSSID are redacted until Location or Nearby Wi‑Fi access is granted.",
      )
    }

    return livePayload(
      wifi = wifi,
      location = location,
      locationAuthorized = authorized,
      networks = results.map(AndroidScanMapper::flatNetworkRow),
      associated = associatedOf(context, wifi),
      stale = stale,
      throttled = throttled,
      scanDurationMs = durationMs,
      suggestedIntervalMs = suggested.toInt(),
      error = error,
    )
  }

  private fun awaitScanResults(context: Context, wifi: WifiManager): Boolean {
    val latch = CountDownLatch(1)
    val updated = AtomicBoolean(false)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val callback = object : WifiManager.ScanResultsCallback() {
        override fun onScanResultsAvailable() {
          updated.set(true)
          latch.countDown()
        }
      }
      return try {
        wifi.registerScanResultsCallback({ it.run() }, callback)
        val reached = latch.await(AndroidScanThrottle.SCAN_TIMEOUT_MS, TimeUnit.MILLISECONDS)
        wifi.unregisterScanResultsCallback(callback)
        reached && updated.get()
      } catch (_: Exception) {
        try {
          wifi.unregisterScanResultsCallback(callback)
        } catch (_: Exception) {
        }
        awaitScanBroadcast(context, updated)
      }
    }
    return awaitScanBroadcast(context, updated)
  }

  private fun awaitScanBroadcast(context: Context, updated: AtomicBoolean): Boolean {
    val latch = CountDownLatch(1)
    val receiver = object : BroadcastReceiver() {
      override fun onReceive(ctx: Context?, intent: Intent?) {
        if (intent?.action != WifiManager.SCAN_RESULTS_AVAILABLE_ACTION) return
        updated.set(intent.getBooleanExtra(WifiManager.EXTRA_RESULTS_UPDATED, false))
        latch.countDown()
      }
    }
    val filter = IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION)
    return try {
      registerScanReceiver(context, receiver, filter)
      val reached = latch.await(AndroidScanThrottle.SCAN_TIMEOUT_MS, TimeUnit.MILLISECONDS)
      reached && updated.get()
    } catch (_: Exception) {
      false
    } finally {
      try {
        context.unregisterReceiver(receiver)
      } catch (_: Exception) {
      }
    }
  }

  private fun registerScanReceiver(
    context: Context,
    receiver: BroadcastReceiver,
    filter: IntentFilter,
  ) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
    } else {
      @Suppress("UnspecifiedRegisterReceiverFlag")
      context.registerReceiver(receiver, filter)
    }
  }

  private fun associatedOf(context: Context, wifi: WifiManager): Map<String, Any>? {
    val info = currentWifiInfo(context, wifi) ?: return null
    return AndroidScanMapper.associatedMap(info)
  }

  @Suppress("DEPRECATION")
  private fun currentWifiInfo(context: Context, wifi: WifiManager): WifiInfo? {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
      val caps = cm?.getNetworkCapabilities(cm.activeNetwork)
      if (caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true) {
        val transport = caps.transportInfo
        if (transport is WifiInfo) return transport
      }
    }
    return try {
      wifi.connectionInfo
    } catch (_: SecurityException) {
      null
    }
  }

  private fun livePayload(
    wifi: WifiManager,
    location: String,
    locationAuthorized: Boolean,
    networks: List<Map<String, Any>>,
    associated: Map<String, Any>?,
    stale: Boolean,
    throttled: Boolean,
    scanDurationMs: Int,
    suggestedIntervalMs: Int,
    error: Map<String, Any>?,
  ): Map<String, Any> {
    val payload = HashMap<String, Any>(16)
    payload["snapshotId"] = UUID.randomUUID().toString()
    payload["capturedAt"] = iso8601Now()
    payload["interfaceName"] = "wlan0"
    payload["scanDurationMs"] = scanDurationMs
    payload["suggestedIntervalMs"] = suggestedIntervalMs
    payload["stale"] = stale
    payload["throttled"] = throttled
    payload["location"] = location
    payload["locationAuthorized"] = locationAuthorized
    payload["includeHiddenRequested"] = true
    payload["source"] = SOURCE_LIVE
    payload["demo"] = false
    payload["networks"] = ArrayList(networks)
    if (associated != null) payload["associated"] = associated
    if (error != null) payload["error"] = error
    payload["locationServicesEnabled"] = locationServicesEnabled()
    payload["scanThrottleEnabled"] = scanThrottleEnabled(wifi)
    payload["nearbyWifiGranted"] = hasNearbyWifiPermission()
    return payload
  }

  private fun demoPayload(
    location: String,
    locationAuthorized: Boolean,
    scanDurationMs: Int,
    error: Map<String, Any>,
  ): Map<String, Any> {
    return hashMapOf(
      "snapshotId" to UUID.randomUUID().toString(),
      "capturedAt" to iso8601Now(),
      "interfaceName" to "wlan0",
      "scanDurationMs" to scanDurationMs,
      "suggestedIntervalMs" to AndroidScanThrottle.ANDROID_FLOOR_MS.toInt(),
      "stale" to true,
      "throttled" to false,
      "location" to location,
      "locationAuthorized" to locationAuthorized,
      "includeHiddenRequested" to true,
      "source" to SOURCE_DEMO,
      "demo" to true,
      "networks" to ArrayList<Map<String, Any>>(),
      "error" to error,
    )
  }

  private fun errorMap(
    code: String,
    message: String,
    recoverable: Boolean = true,
    demoFallback: Boolean = false,
  ): Map<String, Any> {
    return hashMapOf(
      "code" to code,
      "message" to message,
      "recoverable" to recoverable,
      "demoFallback" to demoFallback,
    )
  }

  private fun locationWire(): String {
    val fine = hasFineLocationPermission()
    val nearby = hasNearbyWifiPermission()
    val services = locationServicesEnabled()
    val identityOk = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      nearby || (fine && services)
    } else {
      fine && services
    }
    if (identityOk) return "granted"
    if (!requestedPermissionsOnce && !fine && !nearby) return "not-determined"
    return "denied"
  }

  private fun hasScanPermission(): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && hasNearbyWifiPermission()) {
      return true
    }
    return hasFineLocationPermission() || hasCoarseLocationPermission()
  }

  private fun missingRuntimePermissions(): List<String> {
    val needed = ArrayList<String>()
    if (!hasFineLocationPermission()) {
      needed.add(Manifest.permission.ACCESS_FINE_LOCATION)
      if (!hasCoarseLocationPermission()) {
        needed.add(Manifest.permission.ACCESS_COARSE_LOCATION)
      }
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !hasNearbyWifiPermission()) {
      needed.add(Manifest.permission.NEARBY_WIFI_DEVICES)
    }
    return needed
  }

  private fun hasFineLocationPermission(): Boolean =
    hasPermission(Manifest.permission.ACCESS_FINE_LOCATION)

  private fun hasCoarseLocationPermission(): Boolean =
    hasPermission(Manifest.permission.ACCESS_COARSE_LOCATION)

  private fun hasNearbyWifiPermission(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return false
    return hasPermission(Manifest.permission.NEARBY_WIFI_DEVICES)
  }

  private fun hasPermission(permission: String): Boolean {
    val context = appContext ?: return false
    return ContextCompat.checkSelfPermission(context, permission) ==
      PackageManager.PERMISSION_GRANTED
  }

  private fun locationServicesEnabled(): Boolean {
    val context = appContext ?: return false
    val manager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
      ?: return false
    return try {
      LocationManagerCompat.isLocationEnabled(manager)
    } catch (_: Exception) {
      false
    }
  }

  private fun scanThrottleEnabled(wifi: WifiManager): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      try {
        wifi.isScanThrottleEnabled
      } catch (_: Exception) {
        true
      }
    } else {
      true
    }
  }

  private fun isAppVisible(): Boolean {
    val act = activity ?: return false
    if (act.isFinishing) return false
    val owner = act as? LifecycleOwner
    if (owner != null) {
      return owner.lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED)
    }
    return true
  }

  private fun elapsedMs(startedAt: Long): Int {
    return (SystemClock.elapsedRealtime() - startedAt).toInt().coerceAtLeast(0)
  }

  private fun iso8601Now(): String {
    val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    formatter.timeZone = TimeZone.getTimeZone("UTC")
    return formatter.format(Date())
  }
}
