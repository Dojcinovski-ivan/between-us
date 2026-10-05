import SwiftUI

/// The opening moment: the mark and name settle in over the brand
/// background, then RootView fades this away to show the app.
struct SplashView: View {
    /// How long the splash stays up before RootView starts fading it out.
    static let duration: Duration = .milliseconds(1500)

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var appeared = false

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            // A soft warmth behind the mark, like the website's hero glow.
            // SwiftUI.Circle: the app has its own Circle, the model.
            SwiftUI.Circle()
                .fill(
                    RadialGradient(
                        colors: [Theme.accent.opacity(0.28), Theme.accent.opacity(0)],
                        center: .center,
                        startRadius: 0,
                        endRadius: 170
                    )
                )
                .frame(width: 340, height: 340)
                .scaleEffect(appeared || reduceMotion ? 1 : 0.6)
                .opacity(appeared ? 1 : 0)

            VStack(spacing: 18) {
                LogoMark()
                    .frame(width: 112, height: 112)
                    .scaleEffect(appeared || reduceMotion ? 1 : 0.86)

                Text("Between Us")
                    .font(.serif(.title))
                    .foregroundStyle(Theme.ink)
            }
            .opacity(appeared ? 1 : 0)
        }
        .accessibilityElement()
        .accessibilityLabel("Between Us")
        .onAppear {
            // The website's "calm" easing. With Reduce Motion on, nothing
            // moves or grows: it only fades.
            withAnimation(.timingCurve(0.22, 0.61, 0.36, 1, duration: reduceMotion ? 0.6 : 1.1)) {
                appeared = true
            }
        }
    }
}

#Preview {
    SplashView()
}
