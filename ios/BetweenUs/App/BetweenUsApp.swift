import SwiftUI

@main
struct BetweenUsApp: App {
    @State private var session = SessionStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
                .tint(Theme.accent)
                .task { await session.start() }
                // Universal Links from our emails arrive here.
                .onOpenURL { url in Task { await session.open(url) } }
        }
    }
}
