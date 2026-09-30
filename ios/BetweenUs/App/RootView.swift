import SwiftUI

/// Switches between the signed-out flow and the signed-in app.
struct RootView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        Group {
            switch session.state {
            case .loading:
                ProgressView()
                    .controlSize(.large)
                    .accessibilityLabel("Loading")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Theme.background)
            case .signedOut:
                WelcomeView()
            case .needsOnboarding:
                OnboardingView()
            case .signedIn(let profile):
                CircleView(profile: profile)
                    .id(profile.id)
            case .failed:
                ConnectionErrorView()
            }
        }
        .animation(.default, value: session.state)
    }
}

private struct ConnectionErrorView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        ContentUnavailableView {
            Label("Can't connect", systemImage: "wifi.exclamationmark")
        } description: {
            Text("We couldn't reach Between Us. Check your connection and try again.")
        } actions: {
            Button("Try Again") {
                Task { await session.reload() }
            }
            .buttonStyle(.borderedProminent)
        }
        .background(Theme.background)
    }
}
