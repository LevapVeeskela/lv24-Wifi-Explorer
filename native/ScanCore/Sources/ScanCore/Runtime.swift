// Process lifetime: permissions, scan loop, JSON Lines commands, demo fixtures.

import Darwin
import Foundation

struct CLIOptions {
    var demo = false
    var stdioOnly = false
    var noSocket = false
    var socketPath: String?
    var port: UInt16?
    var token: String?
    var idle = false
    var includeHidden = true
    var interfaceName: String?
    var intervalMs = 3000

    static func parse(_ args: [String]) -> CLIOptions {
        var options = CLIOptions()
        if ProcessInfo.processInfo.environment["SCANCORE_DEMO"] == "1" {
            options.demo = true
        }
        var index = 0
        let argv = Array(args.dropFirst())
        while index < argv.count {
            let arg = argv[index]
            switch arg {
            case "--demo":
                options.demo = true
            case "--stdio-only":
                options.stdioOnly = true
            case "--no-socket":
                options.noSocket = true
            case "--idle":
                options.idle = true
            case "--include-hidden":
                index += 1
                if index < argv.count {
                    options.includeHidden = argv[index] != "false" && argv[index] != "0"
                }
            case "--socket":
                index += 1
                if index < argv.count { options.socketPath = argv[index] }
            case "--port":
                index += 1
                if index < argv.count { options.port = UInt16(argv[index]) }
            case "--token":
                index += 1
                if index < argv.count { options.token = argv[index] }
            case "--interface":
                index += 1
                if index < argv.count { options.interfaceName = argv[index] }
            case "--interval-ms":
                index += 1
                if index < argv.count, let ms = Int(argv[index]) {
                    options.intervalMs = max(3000, ms)
                }
            case "--help", "-h":
                printHelp()
                exit(0)
            default:
                if arg.hasPrefix("--include-hidden=") {
                    let value = String(arg.dropFirst("--include-hidden=".count))
                    options.includeHidden = value != "false" && value != "0"
                } else {
                    log("unknown argument: \(arg)")
                }
            }
            index += 1
        }
        return options
    }
}

func printHelp() {
    let text = """
    ScanCore — LV24 WiFi Explorer helper (CoreWLAN + CoreLocation)

    Usage: ScanCore [options]

      --demo                 Emit fixture snapshots (or SCANCORE_DEMO=1)
      --socket PATH          JSON Lines Unix domain socket (opt-in)
      --no-socket            Do not bind a UDS
      --stdio-only           JSON Lines on stdin/stdout only (default)
      --port N               JSON Lines loopback TCP on 127.0.0.1:N
      --token TOKEN          Auth token (required for TCP)
      --include-hidden BOOL  Pass includeHidden to scanForNetworks (default true)
      --interface NAME       BSD name (e.g. en0)
      --interval-ms N        Extra floor for scan pacing, min 3000
      --idle                 Wait for scan:start instead of auto-start

    Stdin commands (one JSON object per line):
      {"type":"scan:start"}
      {"type":"scan:stop"}
      {"type":"permissions:query"}
      {"type":"demo:enable"}
    """
    FileHandle.standardError.write(Data(text.utf8))
}

final class ScanCoreRuntime {
    let options: CLIOptions
    let location = LocationGate()
    let hub: JSONLinesHub
    let scanner: Scanner
    private var shuttingDown = false
    private var lastEmittedLocation: LocationAuthorization?

    init(options: CLIOptions) {
        self.options = options
        let token = options.token ?? (options.port != nil ? randomToken() : nil)
        self.hub = JSONLinesHub(token: token)
        self.scanner = Scanner(
            location: location,
            interfaceName: options.interfaceName,
            demoMode: options.demo
        )
        scanner.setIncludeHidden(options.includeHidden)
        scanner.setIntervalMs(options.intervalMs)
    }

    func run() {
        installSignals()
        location.onChange = { [weak self] status in
            self?.emitLocation(status)
        }
        if !options.demo {
            location.requestWhenInUse()
        }

        scanner.onSnapshot = { [weak self] snapshot in
            self?.hub.broadcast(TypedEnvelope(type: "scan:snapshot", payload: snapshot))
            self?.emitLocation(snapshot.location, force: false)
        }

        hub.onInbound = { [weak self] message, _ in
            self?.handle(message)
        }

        hub.enableStdio()

        var transport = "stdio"
        if !options.stdioOnly {
            if let path = options.socketPath, !options.noSocket {
                do {
                    _ = try hub.listenUnix(path: path)
                    transport = "uds"
                    log("uds \(path)")
                } catch {
                    log("failed to bind Unix socket: \(error)")
                }
            }
            if let port = options.port {
                do {
                    let used = try hub.listenLoopback(port: port)
                    transport = "loopback"
                    log("loopback 127.0.0.1:\(used)")
                } catch {
                    log("failed to bind loopback TCP: \(error)")
                }
            }
        }

        emitHello(transport: transport)
        emitLocation(options.demo ? .granted : location.status, force: true)
        emitHelperStatus()

        if !options.idle {
            scanner.start()
            emitHelperStatus()
        }

        RunLoop.main.run()
    }

    private func handle(_ message: InboundMessage) {
        switch message.type {
        case "scan:start":
            if let hidden = message.options?.includeHidden {
                scanner.setIncludeHidden(hidden)
            }
            scanner.start()
            emitHelperStatus()
        case "scan:stop":
            scanner.stop()
            emitHelperStatus()
        case "scan:setIntervalMs":
            if let ms = message.intervalMs {
                scanner.setIntervalMs(ms)
            }
        case "permissions:query":
            let status = options.demo ? .granted : location.refresh()
            emitLocation(status, force: true)
        case "permissions:openSettings":
            LocationGate.openSystemSettings()
        case "demo:enable":
            if message.enabled == false {
                scanner.setDemoMode(false)
            } else {
                scanner.setDemoMode(true)
                if !scanner.isScanning {
                    scanner.start()
                }
            }
            emitHelperStatus()
        case "shutdown":
            shutdown()
        default:
            log("unknown inbound type \(message.type)")
        }
    }

    private func emitHello(transport: String) {
        let hello = HelloPayload(
            transport: transport,
            path: hub.unixPath,
            port: hub.tcpPort,
            tokenRequired: hub.token != nil,
            authToken: hub.token
        )
        hub.writeStdout(hello)
        var socketHello = hello
        socketHello.authToken = nil
        hub.broadcastSockets(socketHello)
    }

    private func emitLocation(_ status: LocationAuthorization, force: Bool = false) {
        if !force, lastEmittedLocation == status { return }
        lastEmittedLocation = status
        let authorized = status == .granted
        hub.broadcast(
            TypedEnvelope(
                type: "locationAuthorized",
                payload: LocationAuthorizedPayload(authorized: authorized, location: status)
            )
        )
        hub.broadcast(
            TypedEnvelope(
                type: "permissions:status",
                payload: PermissionsPayload(location: status, authorized: authorized)
            )
        )
    }

    private func emitHelperStatus() {
        hub.broadcast(
            TypedEnvelope(
                type: "helper:status",
                payload: HelperStatusPayload(running: true, scanning: scanner.isScanning)
            )
        )
    }

    private func installSignals() {
        signal(SIGINT) { _ in
            ScanCoreRuntime.sharedShutdown()
        }
        signal(SIGTERM) { _ in
            ScanCoreRuntime.sharedShutdown()
        }
        Self.shutdownHook = { [weak self] in
            self?.shutdown()
        }
    }

    private func shutdown() {
        guard !shuttingDown else { return }
        shuttingDown = true
        scanner.stop()
        hub.shutdown()
        exit(0)
    }

    private static var shutdownHook: (() -> Void)?

    private static func sharedShutdown() {
        shutdownHook?()
        exit(0)
    }
}

func randomToken() -> String {
    (0..<16).map { _ in String(format: "%02x", UInt8.random(in: 0...255)) }.joined()
}
