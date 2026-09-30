import SwiftUI

/// The website's crisis note, with a direct link to findahelpline.com.
/// Kept reachable from signed-out screens as well, the same way /resources
/// is public on the website.
struct CrisisNote: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("If you are in crisis or need professional support, please reach out to a mental health specialist or call a crisis line.")
                .font(.footnote)
                .foregroundStyle(Theme.muted)
            Link(destination: CrisisLink.url) {
                Label("Find a crisis line in your country", systemImage: "phone.fill")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Theme.link)
            }
            .accessibilityHint("Opens findahelpline.com in Safari")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

enum CrisisLink {
    static let url = URL(string: "https://findahelpline.com")!
}
