// Long-lived ScanCore helper. JSON Lines on stdout. protocolVersion 1.

import Darwin
import Foundation

@main
enum ScanCoreMain {
    static func main() {
        signal(SIGPIPE, SIG_IGN)

        let options = CLIOptions.parse(CommandLine.arguments)
        do {
            try run(options)
        } catch {
            let envelope = TypedEnvelope(
                type: "error",
                payload: ScanErrorPayload(
                    code: ScanErrorCode.helperUnavailable,
                    message: "ScanCore failed to start (\(error.localizedDescription)).",
                    recoverable: true,
                    demoFallback: true
                )
            )
            if let data = JSONLines.line(envelope) {
                data.withUnsafeBytes { raw in
                    if let base = raw.baseAddress {
                        _ = Darwin.write(STDOUT_FILENO, base, data.count)
                    }
                }
            }
            log("startup failed: \(error.localizedDescription)")
            exit(0)
        }
    }

    private static func run(_ options: CLIOptions) throws {
        let runtime = ScanCoreRuntime(options: options)
        runtime.run()
    }
}
