import SwiftUI

/// Shown once per account on this device, before the circle, until the
/// member agrees to the terms. Apple guideline 1.2 wants every member to
/// accept the zero-tolerance terms, including people who signed up on the
/// website or before the sign-up switch existed (and App Review, which
/// logs in with a demo account and never sees sign-up).
struct TermsGateView: View {
    let userId: UUID
    var onAgree: () -> Void

    @Environment(SessionStore.self) private var session

    static func key(for userId: UUID) -> String { "agreedToTerms.\(userId.uuidString.lowercased())" }

    static func hasAgreed(_ userId: UUID) -> Bool {
        UserDefaults.standard.bool(forKey: key(for: userId))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Before you join your circle")
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(Theme.ink)

                    rule("Zero tolerance",
                         "There is no tolerance for objectionable content or abusive members. That includes hate speech, slurs, threats, harassment, sexual content and encouraging anyone to harm themselves.")
                    rule("Filtered posts",
                         "Posts containing blocked language are refused automatically.")
                    rule("Report and block",
                         "Tap ⋯ on any post to report it or block its author. A post you report disappears from your feed straight away, and blocking hides everything that member writes.")
                    rule("We act within 24 hours",
                         "Every report is reviewed within 24 hours. Content that breaks the terms is removed and the member who posted it is banned for good.")
                    rule("Contact us",
                         "Email hello@betweenussupport.com at any time, or use Report a problem in your Profile.")

                    Link("Read the full Terms of Service", destination: URL(string: "https://www.betweenussupport.com/terms")!)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.link)
                }
                .padding(24)
                .frame(maxWidth: 560, alignment: .leading)
                .frame(maxWidth: .infinity)
            }
            .background(Theme.background)
            .safeAreaInset(edge: .bottom) {
                VStack(spacing: 12) {
                    Button {
                        UserDefaults.standard.set(true, forKey: Self.key(for: userId))
                        onAgree()
                    } label: {
                        Text("I Agree to the Terms").font(.headline).frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .tint(Theme.accent)

                    Button("Log Out") { Task { await session.signOut() } }
                        .foregroundStyle(Theme.link)
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .frame(maxWidth: 560)
                .background(Theme.background)
            }
            .navigationTitle("Community terms")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func rule(_ title: String, _ text: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.headline).foregroundStyle(Theme.ink)
            Text(text).font(.body).foregroundStyle(Theme.muted)
        }
    }
}
