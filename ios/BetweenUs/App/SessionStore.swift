import Foundation
import Observation
import Supabase

/// Tracks who is signed in and whether they have a profile yet, and decides
/// which part of the app RootView shows.
@MainActor
@Observable
final class SessionStore {
    enum State: Equatable {
        case loading
        case signedOut
        case needsOnboarding
        case signedIn(Profile)
        case failed
    }

    private(set) var state: State = .loading

    /// Same once-a-day throttle as the website, which drives the
    /// re-engagement email.
    private static let activityThrottle: TimeInterval = 24 * 60 * 60

    /// Follows Supabase auth events for the life of the app.
    func start() async {
        for await (event, session) in supabase.auth.authStateChanges {
            switch event {
            case .initialSession, .signedIn, .userUpdated:
                await load(session: session)
            case .signedOut, .userDeleted:
                state = .signedOut
            default:
                break
            }
        }
    }

    /// Re-reads the profile, e.g. after a failed launch or once onboarding
    /// has created it.
    func reload() async {
        state = .loading
        await load(session: try? await supabase.auth.session)
    }

    func signOut() async {
        try? await supabase.auth.signOut()
        state = .signedOut
    }

    private func load(session: Session?) async {
        guard var session else {
            state = .signedOut
            return
        }

        // The stored session may be days old. Refresh it before using it; if
        // that fails the refresh token is gone and they need to log in again.
        if session.isExpired {
            guard let refreshed = try? await supabase.auth.refreshSession() else {
                state = .signedOut
                return
            }
            session = refreshed
        }

        do {
            let rows: [Profile] = try await supabase
                .from("users")
                .select(Profile.columns)
                .eq("id", value: session.user.id)
                .limit(1)
                .execute()
                .value

            guard let profile = rows.first else {
                state = .needsOnboarding
                return
            }

            // An erased account is anonymised, not deleted, and its login is
            // banned. If a stale session still gets here, end it.
            if profile.deletedAt != nil {
                await signOut()
                return
            }

            state = .signedIn(profile)
            await markActive(profile)
        } catch {
            state = .failed
        }
    }

    private func markActive(_ profile: Profile) async {
        let lastActive = profile.lastActiveAt ?? .distantPast
        guard Date().timeIntervalSince(lastActive) > Self.activityThrottle else { return }
        _ = try? await supabase
            .from("users")
            .update(["last_active_at": Date().ISO8601Format()])
            .eq("id", value: profile.id)
            .execute()
    }
}
