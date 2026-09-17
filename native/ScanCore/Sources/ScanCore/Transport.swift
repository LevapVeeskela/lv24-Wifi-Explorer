// JSON Lines over stdio, loopback TCP, or a Unix domain socket.
// TCP binds 127.0.0.1 only and rejects non-local peers. Token required on TCP.

import Darwin
import Dispatch
import Foundation

final class LineConnection {
    let fd: Int32
    let requiresAuth: Bool
    private(set) var authenticated: Bool
    private var buffer = Data()
    private var source: DispatchSourceRead?
    private let queue: DispatchQueue
    var onLine: ((LineConnection, String) -> Void)?
    var onClose: ((LineConnection) -> Void)?

    init(fd: Int32, requiresAuth: Bool, queue: DispatchQueue) {
        self.fd = fd
        self.requiresAuth = requiresAuth
        self.authenticated = !requiresAuth
        self.queue = queue
        var flag: Int32 = 1
        setsockopt(fd, SOL_SOCKET, SO_NOSIGPIPE, &flag, socklen_t(MemoryLayout<Int32>.size))
    }

    func start() {
        let source = DispatchSource.makeReadSource(fileDescriptor: fd, queue: queue)
        source.setEventHandler { [weak self] in
            self?.readAvailable()
        }
        source.setCancelHandler { [weak self] in
            if let fd = self?.fd {
                Darwin.close(fd)
            }
        }
        self.source = source
        source.resume()
        if requiresAuth {
            queue.asyncAfter(deadline: .now() + 2) { [weak self] in
                guard let self, !self.authenticated else { return }
                log("closing unauthenticated peer")
                self.disconnect()
            }
        }
    }

    func acceptAuth(_ token: String?, expected: String?) {
        guard requiresAuth else {
            authenticated = true
            return
        }
        guard let expected, let token, token == expected, !expected.isEmpty else { return }
        authenticated = true
    }

    func send(_ data: Data) {
        guard authenticated || !requiresAuth else { return }
        data.withUnsafeBytes { raw in
            guard let base = raw.baseAddress else { return }
            var sent = 0
            while sent < data.count {
                let n = Darwin.write(fd, base.advanced(by: sent), data.count - sent)
                if n <= 0 { break }
                sent += n
            }
        }
    }

    func disconnect() {
        source?.cancel()
        source = nil
        onClose?(self)
    }

    private func readAvailable() {
        var chunk = [UInt8](repeating: 0, count: 4096)
        let n = Darwin.read(fd, &chunk, chunk.count)
        if n <= 0 {
            disconnect()
            return
        }
        buffer.append(contentsOf: chunk.prefix(n))
        while let range = buffer.firstRange(of: Data([0x0A])) {
            let lineData = buffer.subdata(in: buffer.startIndex..<range.lowerBound)
            buffer.removeSubrange(buffer.startIndex...range.lowerBound)
            if let line = String(data: lineData, encoding: .utf8)?
                .trimmingCharacters(in: .whitespacesAndNewlines),
               !line.isEmpty
            {
                onLine?(self, line)
            }
        }
        if buffer.count > 1_000_000 {
            log("dropping oversized inbound buffer")
            buffer.removeAll(keepingCapacity: false)
        }
    }
}

final class JSONLinesHub {
    private let queue = DispatchQueue(label: "com.lv24.wifi-explorer.scancore.hub")
    private var connections: [ObjectIdentifier: LineConnection] = [:]
    private var listenSources: [DispatchSourceRead] = []
    private var listenFds: [Int32] = []
    private var stdinBuffer = Data()
    private(set) var stdioEnabled = false
    private(set) var unixPath: String?
    private(set) var tcpPort: UInt16?
    let token: String?
    var onInbound: ((InboundMessage, LineConnection?) -> Void)?

    init(token: String?) {
        self.token = token
        signal(SIGPIPE, SIG_IGN)
    }

    func enableStdio() {
        stdioEnabled = true
        FileHandle.standardInput.readabilityHandler = { [weak self] handle in
            self?.readStdin(handle)
        }
    }

    @discardableResult
    func listenUnix(path: String) throws -> String {
        unlink(path)
        let fd = socket(AF_UNIX, SOCK_STREAM, 0)
        guard fd >= 0 else { throw TransportError.socket }
        setCloexec(fd)
        var addr = sockaddr_un()
        addr.sun_family = sa_family_t(AF_UNIX)
        let utf8 = path.utf8CString
        guard utf8.count <= 104 else {
            Darwin.close(fd)
            throw TransportError.pathTooLong
        }
        withUnsafeMutableBytes(of: &addr.sun_path) { raw in
            utf8.withUnsafeBytes { src in
                raw.copyMemory(from: src)
            }
        }
        let bindOk = withUnsafePointer(to: &addr) { pointer in
            pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                bind(fd, $0, socklen_t(MemoryLayout<sockaddr_un>.size))
            }
        }
        guard bindOk == 0, listen(fd, 8) == 0 else {
            Darwin.close(fd)
            throw TransportError.bind
        }
        chmod(path, 0o600)
        unixPath = path
        acceptLoop(fd: fd, requiresAuth: token != nil)
        return path
    }

    @discardableResult
    func listenLoopback(port: UInt16) throws -> UInt16 {
        guard token != nil, !(token?.isEmpty ?? true) else {
            throw TransportError.tokenRequired
        }
        let fd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP)
        guard fd >= 0 else { throw TransportError.socket }
        setCloexec(fd)
        var reuse: Int32 = 1
        setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &reuse, socklen_t(MemoryLayout<Int32>.size))
        var addr = sockaddr_in()
        addr.sin_len = UInt8(MemoryLayout<sockaddr_in>.stride)
        addr.sin_family = sa_family_t(AF_INET)
        addr.sin_port = port.bigEndian
        addr.sin_addr = in_addr(s_addr: in_addr_t(INADDR_LOOPBACK).bigEndian)
        let bindOk = withUnsafePointer(to: &addr) { pointer in
            pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                bind(fd, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
            }
        }
        guard bindOk == 0, listen(fd, 8) == 0 else {
            Darwin.close(fd)
            throw TransportError.bind
        }
        var bound = sockaddr_in()
        var len = socklen_t(MemoryLayout<sockaddr_in>.size)
        let got = withUnsafeMutablePointer(to: &bound) { pointer in
            pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                getsockname(fd, $0, &len)
            }
        }
        let used = got == 0 ? UInt16(bigEndian: bound.sin_port) : port
        tcpPort = used
        acceptLoop(fd: fd, requiresAuth: true)
        return used
    }

    func broadcast<T: Encodable>(_ value: T) {
        guard let data = JSONLines.line(value) else { return }
        if stdioEnabled {
            data.withUnsafeBytes { raw in
                if let base = raw.baseAddress {
                    _ = Darwin.write(STDOUT_FILENO, base, data.count)
                }
            }
        }
        broadcastSockets(data: data)
    }

    func broadcastSockets<T: Encodable>(_ value: T) {
        guard let data = JSONLines.line(value) else { return }
        broadcastSockets(data: data)
    }

    private func broadcastSockets(data: Data) {
        queue.async {
            for conn in self.connections.values where conn.authenticated {
                conn.send(data)
            }
        }
    }

    func writeStdout<T: Encodable>(_ value: T) {
        guard let data = JSONLines.line(value) else { return }
        data.withUnsafeBytes { raw in
            if let base = raw.baseAddress {
                _ = Darwin.write(STDOUT_FILENO, base, data.count)
            }
        }
    }

    func shutdown() {
        FileHandle.standardInput.readabilityHandler = nil
        queue.sync {
            connections.values.forEach { $0.disconnect() }
            connections.removeAll()
            listenSources.forEach { $0.cancel() }
            listenSources.removeAll()
            listenFds.removeAll()
        }
        if let unixPath {
            unlink(unixPath)
        }
    }

    private func acceptLoop(fd: Int32, requiresAuth: Bool) {
        listenFds.append(fd)
        let source = DispatchSource.makeReadSource(fileDescriptor: fd, queue: queue)
        source.setEventHandler { [weak self] in
            self?.acceptOne(listenFd: fd, requiresAuth: requiresAuth)
        }
        source.setCancelHandler {
            Darwin.close(fd)
        }
        listenSources.append(source)
        source.resume()
    }

    private func acceptOne(listenFd: Int32, requiresAuth: Bool) {
        var addr = sockaddr_storage()
        var len = socklen_t(MemoryLayout<sockaddr_storage>.size)
        let client = withUnsafeMutablePointer(to: &addr) { pointer in
            pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                accept(listenFd, $0, &len)
            }
        }
        guard client >= 0 else { return }
        setCloexec(client)
        if !isLocalPeer(addr) {
            log("rejected non-local peer")
            Darwin.close(client)
            return
        }
        if connections.count >= 8 {
            log("rejected extra client (max 8)")
            Darwin.close(client)
            return
        }
        let conn = LineConnection(fd: client, requiresAuth: requiresAuth, queue: queue)
        let id = ObjectIdentifier(conn)
        conn.onLine = { [weak self] connection, line in
            self?.handleLine(connection, line)
        }
        conn.onClose = { [weak self] connection in
            self?.queue.async {
                self?.connections.removeValue(forKey: ObjectIdentifier(connection))
            }
        }
        connections[id] = conn
        conn.start()
        if !requiresAuth {
            emitHello(to: conn)
        }
    }

    private func handleLine(_ connection: LineConnection?, _ line: String) {
        guard let data = line.data(using: .utf8) else { return }
        do {
            let message = try JSONDecoder().decode(InboundMessage.self, from: data)
            if message.type == "auth" {
                connection?.acceptAuth(message.token, expected: token)
                if connection?.authenticated == true {
                    emitHello(to: connection)
                }
                return
            }
            if let connection, connection.requiresAuth, !connection.authenticated {
                return
            }
            onInbound?(message, connection)
        } catch {
            log("ignored malformed inbound JSON")
        }
    }

    private func emitHello(to connection: LineConnection?) {
        let hello = HelloPayload(
            transport: tcpPort != nil ? "loopback" : (unixPath != nil ? "uds" : "stdio"),
            path: unixPath,
            port: tcpPort,
            tokenRequired: token != nil,
            authToken: nil
        )
        if let data = JSONLines.line(hello) {
            connection?.send(data)
        }
    }

    private func readStdin(_ handle: FileHandle) {
        let data = handle.availableData
        if data.isEmpty {
            return
        }
        stdinBuffer.append(data)
        while let range = stdinBuffer.firstRange(of: Data([0x0A])) {
            let lineData = stdinBuffer.subdata(in: stdinBuffer.startIndex..<range.lowerBound)
            stdinBuffer.removeSubrange(stdinBuffer.startIndex...range.lowerBound)
            if let line = String(data: lineData, encoding: .utf8)?
                .trimmingCharacters(in: .whitespacesAndNewlines),
               !line.isEmpty
            {
                handleLine(nil, line)
            }
        }
    }

    private func isLocalPeer(_ storage: sockaddr_storage) -> Bool {
        if storage.ss_family == sa_family_t(AF_UNIX) {
            return true
        }
        if storage.ss_family == sa_family_t(AF_INET) {
            var copy = storage
            return withUnsafePointer(to: &copy) { pointer in
                pointer.withMemoryRebound(to: sockaddr_in.self, capacity: 1) { inet in
                    inet.pointee.sin_addr.s_addr == in_addr_t(INADDR_LOOPBACK).bigEndian
                }
            }
        }
        if storage.ss_family == sa_family_t(AF_INET6) {
            var copy = storage
            return withUnsafePointer(to: &copy) { pointer in
                pointer.withMemoryRebound(to: sockaddr_in6.self, capacity: 1) { inet6 in
                    var addr = inet6.pointee.sin6_addr
                    return withUnsafeBytes(of: &addr) { raw in
                        let bytes = raw.bindMemory(to: UInt8.self)
                        // ::1
                        if bytes[15] == 1 && bytes.prefix(15).allSatisfy({ $0 == 0 }) {
                            return true
                        }
                        // ::ffff:127.0.0.1
                        let v4mapped = bytes[0...9].allSatisfy({ $0 == 0 })
                            && bytes[10] == 0xFF && bytes[11] == 0xFF
                            && bytes[12] == 127 && bytes[13] == 0 && bytes[14] == 0 && bytes[15] == 1
                        return v4mapped
                    }
                }
            }
        }
        return false
    }
}

enum TransportError: Error {
    case socket
    case bind
    case pathTooLong
    case tokenRequired
}

private func setCloexec(_ fd: Int32) {
    let flags = fcntl(fd, F_GETFD)
    if flags >= 0 {
        _ = fcntl(fd, F_SETFD, flags | FD_CLOEXEC)
    }
}
