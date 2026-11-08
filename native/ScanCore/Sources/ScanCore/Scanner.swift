// Paced CoreWLAN scan loop. Active scan on a background queue; never spin.
// Interval between cycle starts: max(3.0, lastDuration * 1.1).
// Public APIs only: CWWiFiClient.shared(), interface(), scanForNetworks(withName:includeHidden:).

import CoreWLAN
import Foundation

final class Scanner: NSObject, CWEventDelegate {
    private let client: CWWiFiClient
    private let location: LocationGate
    private let scanQueue = DispatchQueue(label: "com.lv24.wifi-explorer.scancore.scan", qos: .utility)
    private let lock = NSLock()
    private var preferredInterface: String?
    private var includeHidden = true
    /// Directed scan target: `scanForNetworks(withName:)` probes only this SSID.
    private var directedSsid: String?
    private var userInterval: TimeInterval = ScanMath.scanIntervalFloor
    private var lastDuration: TimeInterval = ScanMath.scanIntervalFloor
    private var scanning = false
    private var loopAlive = false
    private var stopRequested = false
    private var inFlight = false
    private var demoMode = false
    private var scanGeneration = 0
    private var lastNetworks: [CoreWlanNetworkRecord] = []
    private var lastEmitAt: Date = .distantPast

    var onSnapshot: ((ScanCoreSnapshot) -> Void)?

    init(location: LocationGate, interfaceName: String?, demoMode: Bool) {
        self.location = location
        self.preferredInterface = interfaceName
        self.demoMode = demoMode
        self.client = CWWiFiClient.shared()
        super.init()
        client.delegate = self
        if !demoMode {
            startEventMonitors()
        }
    }

    var isScanning: Bool {
        lock.lock()
        defer { lock.unlock() }
        return scanning
    }

    var isDemo: Bool {
        lock.lock()
        defer { lock.unlock() }
        return demoMode
    }

    func setDemoMode(_ value: Bool) {
        lock.lock()
        demoMode = value
        lock.unlock()
    }

    func setIncludeHidden(_ value: Bool) {
        lock.lock()
        includeHidden = value
        lock.unlock()
    }

    /// Empty string or nil clears directed mode (full active scan).
    func setDirectedSsid(_ value: String?) {
        lock.lock()
        let normalized = (value?.isEmpty == false) ? value : nil
        directedSsid = normalized
        lock.unlock()
        log(normalized == nil ? "directed scan disabled" : "directed scan enabled")
    }

    var isDirected: Bool {
        lock.lock()
        defer { lock.unlock() }
        return directedSsid != nil
    }

    func setIntervalMs(_ ms: Int) {
        lock.lock()
        userInterval = max(ScanMath.scanIntervalFloor, Double(ms) / 1000)
        lock.unlock()
    }

    func start() {
        lock.lock()
        if scanning || loopAlive {
            lock.unlock()
            return
        }
        scanning = true
        loopAlive = true
        stopRequested = false
        lock.unlock()
        scanQueue.async { [weak self] in
            self?.runLoop()
        }
    }

    func stop() {
        lock.lock()
        stopRequested = true
        scanning = false
        lock.unlock()
    }

    func snapshotNowFromCache() {
        scanQueue.async { [weak self] in
            self?.emitCacheIfIdle()
        }
    }

    private func runLoop() {
        while true {
            lock.lock()
            let shouldStop = stopRequested
            lock.unlock()
            if shouldStop { break }

            let started = Date()
            let snapshot = performCycle()
            onSnapshot?(snapshot)

            let duration = Date().timeIntervalSince(started)
            lock.lock()
            lastDuration = max(duration, 0.05)
            let interval = ScanMath.scanInterval(lastDuration: lastDuration, userFloor: userInterval)
            let sleepFor = max(0, interval - duration)
            lock.unlock()

            interruptibleSleep(sleepFor)
        }
        lock.lock()
        scanning = false
        loopAlive = false
        lock.unlock()
    }

    private func performCycle() -> ScanCoreSnapshot {
        lock.lock()
        inFlight = true
        let hidden = includeHidden
        let ifaceName = preferredInterface
        let demo = demoMode
        let directed = directedSsid
        scanGeneration += 1
        let generation = scanGeneration
        lock.unlock()
        defer {
            lock.lock()
            inFlight = false
            lock.unlock()
        }

        let t0 = Date()
        let capturedAt = ISOTime.now()

        if demo {
            return DemoFixtures.snapshot(generation: generation, capturedAt: capturedAt)
        }

        let locationStatus = locationOnMain()
        let redact = locationStatus != .granted
        let authorized = locationStatus == .granted

        guard let iface = resolveInterface(named: ifaceName) else {
            return snapshot(
                capturedAt: capturedAt,
                interfaceName: ifaceName ?? "unknown",
                countryCode: nil,
                location: locationStatus,
                authorized: authorized,
                results: [],
                networks: [],
                associated: nil,
                hidden: hidden,
                stale: false,
                durationMs: millis(since: t0),
                source: SnapshotSource.activeScan,
                generation: generation,
                error: ScanErrorPayload(
                    code: ScanErrorCode.noInterface,
                    message: "No CWInterface from CWWiFiClient.",
                    recoverable: true
                )
            )
        }

        let name = iface.interfaceName ?? "unknown"
        let country = authorized ? iface.countryCode() : nil

        if !iface.powerOn() {
            return snapshot(
                capturedAt: capturedAt,
                interfaceName: name,
                countryCode: country,
                location: locationStatus,
                authorized: authorized,
                results: [],
                networks: [],
                associated: nil,
                hidden: hidden,
                stale: false,
                durationMs: millis(since: t0),
                source: SnapshotSource.activeScan,
                generation: generation,
                error: ScanErrorPayload(
                    code: ScanErrorCode.wifiOff,
                    message: "Wi-Fi interface is powered off.",
                    recoverable: true
                )
            )
        }

        var source = SnapshotSource.activeScan
        var stale = false
        var cycleError: ScanErrorPayload?
        var rawNetworks: Set<CWNetwork> = []

        do {
            rawNetworks = try iface.scanForNetworks(withName: directed, includeHidden: hidden)
        } catch {
            let mapped = mapScanError(error, directedSsid: directed)
            // Cache holds every BSS; a directed scan must not leak unrelated rows.
            let cached = (iface.cachedScanResults() ?? []).filter { network in
                guard let directed else { return true }
                return network.ssid == directed
            }
            if !cached.isEmpty {
                rawNetworks = cached
                source = SnapshotSource.cache
                stale = true
                cycleError = mapped
            } else {
                let associated = CoreWlanMapping.associatedLink(
                    from: iface,
                    capturedAt: capturedAt,
                    location: locationStatus
                )
                if let associated {
                    let connected = connectedOnly(
                        iface: iface,
                        capturedAt: capturedAt,
                        generation: generation,
                        redact: redact
                    )
                    lock.lock()
                    let previous = lastNetworks
                    lock.unlock()
                    return snapshot(
                        capturedAt: capturedAt,
                        interfaceName: name,
                        countryCode: country,
                        location: locationStatus,
                        authorized: authorized,
                        results: connected,
                        networks: previous,
                        associated: associated,
                        hidden: hidden,
                        stale: true,
                        durationMs: millis(since: t0),
                        source: SnapshotSource.associatedOnly,
                        generation: generation,
                        error: mapped
                    )
                }
                return snapshot(
                    capturedAt: capturedAt,
                    interfaceName: name,
                    countryCode: country,
                    location: locationStatus,
                    authorized: authorized,
                    results: [],
                    networks: [],
                    associated: nil,
                    hidden: hidden,
                    stale: false,
                    durationMs: millis(since: t0),
                    source: SnapshotSource.activeScan,
                    generation: generation,
                    error: mapped
                )
            }
        }

        var seen = Set<String>()
        var results: [ScanResult] = []
        var records: [CoreWlanNetworkRecord] = []
        for network in rawNetworks {
            let key = CoreWlanMapping.dedupeKey(for: network)
            if seen.contains(key) { continue }
            seen.insert(key)
            results.append(
                CoreWlanMapping.scanResult(
                    from: network,
                    generation: generation,
                    lastSeenAt: capturedAt,
                    redactIdentity: redact
                )
            )
            records.append(CoreWlanMapping.record(from: network, redactIdentity: redact))
        }
        results.sort {
            if $0.rssiDbm != $1.rssiDbm {
                return ($0.rssiDbm ?? Int.min) > ($1.rssiDbm ?? Int.min)
            }
            return ($0.bssid ?? "") < ($1.bssid ?? "")
        }
        records.sort {
            if $0.rssiDbm != $1.rssiDbm { return $0.rssiDbm > $1.rssiDbm }
            return ($0.bssid ?? "") < ($1.bssid ?? "")
        }

        lock.lock()
        lastNetworks = records
        lock.unlock()

        var error = cycleError
        if locationStatus == .denied {
            error = ScanErrorPayload(
                code: ScanErrorCode.locationDenied,
                message: "Location denied: ssid/bssid/oui redacted; RSSI/channel still emitted.",
                recoverable: true
            )
        } else if locationStatus == .restricted {
            error = ScanErrorPayload(
                code: ScanErrorCode.locationRestricted,
                message: "Location restricted: ssid/bssid/oui redacted.",
                recoverable: true
            )
        } else if locationStatus == .notDetermined {
            error = ScanErrorPayload(
                code: ScanErrorCode.locationDenied,
                message: "Location not determined: ssid/bssid/oui redacted until When In Use is granted.",
                recoverable: true
            )
        } else if authorized, !results.isEmpty, results.allSatisfy({ $0.bssid == nil }) {
            error = ScanErrorPayload(
                code: ScanErrorCode.bssidUnavailable,
                message: "Location granted but BSSID is nil (unsigned helper or TCC identity).",
                recoverable: true
            )
        }

        return snapshot(
            capturedAt: capturedAt,
            interfaceName: name,
            countryCode: country,
            location: locationStatus,
            authorized: authorized,
            results: results,
            networks: records,
            associated: CoreWlanMapping.associatedLink(
                from: iface,
                capturedAt: capturedAt,
                location: locationStatus
            ),
            hidden: hidden,
            stale: stale,
            durationMs: millis(since: t0),
            source: source,
            generation: generation,
            error: error
        )
    }

    private func connectedOnly(
        iface: CWInterface,
        capturedAt: String,
        generation: Int,
        redact: Bool
    ) -> [ScanResult] {
        let channelObj = iface.wlanChannel()
        let band: WifiBand
        switch channelObj?.channelBand.rawValue {
        case 1: band = .twoPointFour
        case 2: band = .five
        case 3: band = .six
        default: band = .unknown
        }
        let width: WifiChannelWidth
        switch channelObj?.channelWidth.rawValue {
        case 1: width = .mhz20
        case 2: width = .mhz40
        case 3: width = .mhz80
        case 4: width = .mhz160
        default: width = .unknown
        }
        let rawBssid = CoreWlanMapping.normalizeBSSID(iface.bssid())
        let rawSsid = CoreWlanMapping.emptyToNil(iface.ssid())
        let rssi = iface.rssiValue()
        let noiseRaw = iface.noiseMeasurement()
        let phy = CoreWlanMapping.phyLetter(iface.activePHYMode()).map(wifiPhy) ?? .unknown
        let kind = CoreWlanMapping.securityKind(iface.security())
        return [
            ScanResult(
                id: ScanMath.rowId(
                    bssid: rawBssid,
                    ssid: rawSsid,
                    channel: channelObj?.channelNumber,
                    band: band,
                    redactIdentity: redact
                ),
                ssid: redact ? nil : rawSsid,
                bssid: redact ? nil : rawBssid,
                rssiDbm: rssi,
                noiseDbm: ScanMath.isNoiseValid(noiseRaw) ? noiseRaw : nil,
                snrDb: ScanMath.snrDb(rssiDbm: rssi, noiseDbm: noiseRaw),
                channel: channelObj?.channelNumber,
                channelWidth: width,
                band: band,
                phyMode: phy,
                phyModesSupported: phy == .unknown ? [] : [phy],
                security: CoreWlanMapping.securityLabel([kind]),
                securityRaw: [kind.rawValue],
                oui: redact ? nil : ScanMath.oui(from: rawBssid),
                hidden: CoreWlanMapping.isHidden(ssid: iface.ssid(), ssidData: iface.ssidData()),
                lastSeenAt: capturedAt,
                scanGeneration: generation
            ),
        ]
    }

    private func wifiPhy(_ letter: PhyLetter) -> WifiPhyMode {
        switch letter {
        case .a: return .a
        case .b: return .b
        case .g: return .g
        case .n: return .n
        case .ac: return .ac
        case .ax: return .ax
        case .be: return .be
        }
    }

    private func resolveInterface(named name: String?) -> CWInterface? {
        if let name, let iface = client.interface(withName: name) {
            return iface
        }
        if let iface = client.interface() {
            return iface
        }
        if let names = client.interfaceNames(), let first = names.first {
            return client.interface(withName: first)
        }
        return nil
    }

    private func mapScanError(_ error: Error, directedSsid: String? = nil) -> ScanErrorPayload {
        let ns = error as NSError
        let code = ns.code
        let mode = directedSsid == nil ? "" : " (directed SSID)"
        if code == -3905 {
            return ScanErrorPayload(
                code: ScanErrorCode.timeout,
                message: "scanForNetworks\(mode) timed out; serving cache if available.",
                recoverable: true
            )
        }
        return ScanErrorPayload(
            code: ScanErrorCode.scanFailed,
            message: "scanForNetworks\(mode) failed (\(code)).",
            recoverable: true
        )
    }

    private func snapshot(
        capturedAt: String,
        interfaceName: String,
        countryCode: String?,
        location: LocationAuthorization,
        authorized: Bool,
        results: [ScanResult],
        networks: [CoreWlanNetworkRecord],
        associated: AssociatedLink?,
        hidden: Bool,
        stale: Bool,
        durationMs: Int,
        source: String,
        generation: Int,
        error: ScanErrorPayload?
    ) -> ScanCoreSnapshot {
        _ = generation
        lastEmitAt = Date()
        return ScanCoreSnapshot(
            snapshotId: UUID().uuidString.lowercased(),
            capturedAt: capturedAt,
            interfaceName: interfaceName,
            countryCode: countryCode,
            scanDurationMs: durationMs,
            stale: stale,
            locationAuthorized: authorized,
            results: results,
            error: error,
            location: location,
            networks: networks,
            associated: associated,
            includeHiddenRequested: hidden,
            source: source
        )
    }

    private func millis(since t0: Date) -> Int {
        Int(Date().timeIntervalSince(t0) * 1000)
    }

    private func locationOnMain() -> LocationAuthorization {
        if Thread.isMainThread {
            return location.status
        }
        return DispatchQueue.main.sync {
            location.status
        }
    }

    private func interruptibleSleep(_ seconds: TimeInterval) {
        var remaining = seconds
        while remaining > 0 {
            lock.lock()
            let stop = stopRequested
            lock.unlock()
            if stop { return }
            let slice = min(0.2, remaining)
            Thread.sleep(forTimeInterval: slice)
            remaining -= slice
        }
    }

    private func startEventMonitors() {
        let types: [CWEventType] = [
            .powerDidChange,
            .ssidDidChange,
            .bssidDidChange,
            .countryCodeDidChange,
            .linkDidChange,
            .linkQualityDidChange,
            .modeDidChange,
            .scanCacheUpdated,
        ]
        for type in types {
            do {
                try client.startMonitoringEvent(with: type)
            } catch {
                log("event monitor \(type.rawValue) unavailable")
            }
        }
    }

    private func emitCacheIfIdle() {
        lock.lock()
        let busy = inFlight
        let hidden = includeHidden
        let demo = demoMode
        lock.unlock()
        if busy || demo { return }
        if Date().timeIntervalSince(lastEmitAt) < 1 { return }

        let capturedAt = ISOTime.now()
        let locationStatus = locationOnMain()
        guard let iface = resolveInterface(named: preferredInterface), iface.powerOn() else { return }
        guard let cached = iface.cachedScanResults() else { return }

        lock.lock()
        scanGeneration += 1
        let generation = scanGeneration
        lock.unlock()

        var seen = Set<String>()
        var results: [ScanResult] = []
        var records: [CoreWlanNetworkRecord] = []
        for network in cached {
            let key = CoreWlanMapping.dedupeKey(for: network)
            if seen.contains(key) { continue }
            seen.insert(key)
            let redact = locationStatus != .granted
            results.append(
                CoreWlanMapping.scanResult(
                    from: network,
                    generation: generation,
                    lastSeenAt: capturedAt,
                    redactIdentity: redact
                )
            )
            records.append(CoreWlanMapping.record(from: network, redactIdentity: redact))
        }
        lock.lock()
        lastNetworks = records
        lock.unlock()
        onSnapshot?(
            snapshot(
                capturedAt: capturedAt,
                interfaceName: iface.interfaceName ?? "unknown",
                countryCode: locationStatus == .granted ? iface.countryCode() : nil,
                location: locationStatus,
                authorized: locationStatus == .granted,
                results: results,
                networks: records,
                associated: CoreWlanMapping.associatedLink(
                    from: iface,
                    capturedAt: capturedAt,
                    location: locationStatus
                ),
                hidden: hidden,
                stale: true,
                durationMs: 0,
                source: SnapshotSource.cache,
                generation: generation,
                error: nil
            )
        )
    }

    // MARK: - CWEventDelegate

    func clientConnectionInterrupted() {
        log("CWWiFiClient connection interrupted; will resync on next cycle")
    }

    func clientConnectionInvalidated() {
        log("CWWiFiClient connection invalidated")
    }

    func powerStateDidChangeForWiFiInterface(withName interfaceName: String) {
        _ = interfaceName
        snapshotNowFromCache()
    }

    func ssidDidChangeForWiFiInterface(withName interfaceName: String) {
        _ = interfaceName
        snapshotNowFromCache()
    }

    func bssidDidChangeForWiFiInterface(withName interfaceName: String) {
        _ = interfaceName
        snapshotNowFromCache()
    }

    func countryCodeDidChangeForWiFiInterface(withName interfaceName: String) {
        _ = interfaceName
        snapshotNowFromCache()
    }

    func linkDidChangeForWiFiInterface(withName interfaceName: String) {
        _ = interfaceName
        snapshotNowFromCache()
    }

    func linkQualityDidChangeForWiFiInterface(withName interfaceName: String, rssi: Int, transmitRate: Double) {
        _ = (interfaceName, rssi, transmitRate)
        snapshotNowFromCache()
    }

    func modeDidChangeForWiFiInterface(withName interfaceName: String) {
        _ = interfaceName
        snapshotNowFromCache()
    }

    func scanCacheUpdatedForWiFiInterface(withName interfaceName: String) {
        _ = interfaceName
        snapshotNowFromCache()
    }
}
