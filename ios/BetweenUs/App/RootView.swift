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
            case .noCircle:
                NoCircleView()
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

private struct NoCircleView: View {
    @Environment(SessionStore.self) private var session

    var body: some View {
        ContentUnavailableView {
            Label("No circle yet", systemImage: "person.2.slash")
        } description: {
            Text("This account isn't in a circle, so there is nothing to show here. If you manage Between Us, use the website instead.")
        } actions: {
            Button("Try Again") {
                Task { await session.reload() }
            }
            .buttonStyle(.borderedProminent)
            Button("Log Out") {
                Task { await session.signOut() }
            }
        }
        .background(Theme.background)
    }
}
