import SwiftUI

/// First screen for anyone signed out. Mirrors the website's landing hero.
struct WelcomeView: View {
    enum Route: Hashable {
        case login
        case register
    }

    @State private var path: [Route] = []
    @ScaledMetric(relativeTo: .largeTitle) private var heroHeight: CGFloat = 240

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Overlay so the filled image can't widen the stack
                    // past the screen and eat the side padding below.
                    Color.clear
                        .frame(height: heroHeight)
                        .overlay {
                            Image(.hero)
                                .resizable()
                                .scaledToFill()
                        }
                        .clipped()
                        .accessibilityHidden(true)

                    VStack(alignment: .leading, spacing: 16) {
                        Text("Free · Anonymous · Always open")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Theme.link)

                        Text("Anonymous peer support for people healing from relationships that hurt them.")
                            .font(.serif(.largeTitle))
                            .foregroundStyle(Theme.ink)
                            .accessibilityAddTraits(.isHeader)

                        Text("We are not therapy. We are the space that makes therapy feel possible.")
                            .font(.body)
                            .foregroundStyle(Theme.muted)
                    }
                    .padding(.horizontal)

                    VStack(spacing: 12) {
                        NavigationLink(value: Route.register) {
                            Text("Find your circle")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)

                        NavigationLink(value: Route.login) {
                            Text("I already have an account")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.large)
                    }
                    .padding(.horizontal)

                    CrisisNote()
                        .padding(.horizontal)
                        .padding(.bottom)
                }
            }
            .background(Theme.background)
            .navigationDestination(for: Route.self) { route in
                switch route {
                case .login: LoginView(onCreateAccount: { path = [.register] })
                case .register: RegisterView(onLogIn: { path = [.login] })
                }
            }
        }
    }
}

#Preview {
    WelcomeView()
        .environment(SessionStore())
}
