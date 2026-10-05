import Foundation

/// Thrown by `withTimeout` when the work didn't finish in time.
struct TimedOut: Error {}

/// Runs `operation`, giving up after `seconds`. A request that stalls would
/// otherwise wait out URLSession's own timeout, which restarts every time a
/// byte arrives and so can leave a spinner up for minutes.
func withTimeout<T: Sendable>(
    _ seconds: TimeInterval,
    _ operation: @escaping @Sendable () async throws -> T
) async throws -> T {
    try await withThrowingTaskGroup(of: T.self) { group in
        group.addTask(operation: operation)
        group.addTask {
            try await Task.sleep(for: .seconds(seconds))
            throw TimedOut()
        }
        defer { group.cancelAll() }
        return try await group.next()!
    }
}
