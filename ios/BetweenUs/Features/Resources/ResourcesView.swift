import SwiftUI

/// Crisis help first, then the curated books and links from the resources
/// table: the general set plus the member's own pod's, like /resources.
struct ResourcesView: View {
    let category: String

    private struct Resource: Decodable, Identifiable {
        let id: UUID
        let title: String
        let type: String
        let description: String?
        let url: String?
        let category: String?
    }

    @State private var resources: [Resource] = []
    @State private var loaded = false

    private var visible: [Resource] { resources.filter { $0.category == nil || $0.category == category } }
    private var books: [Resource] { visible.filter { $0.type == "book" } }
    private var links: [Resource] { visible.filter { $0.type == "link" } }

    var body: some View {
        List {
            Section {
                Link(destination: CrisisLink.url) {
                    VStack(alignment: .leading, spacing: 4) {
                        Label("findahelpline.com", systemImage: "phone.fill")
                            .font(.headline)
                            .foregroundStyle(Theme.link)
                        Text("A directory of crisis lines around the world.")
                            .font(.subheadline)
                            .foregroundStyle(Theme.muted)
                    }
                    .padding(.vertical, 4)
                }
                .accessibilityHint("Opens in Safari")
            } header: {
                Text("If you need help right now")
            } footer: {
                Text("If you are in danger, contact your local emergency services.")
            }

            if !books.isEmpty {
                Section("A few books people here have found helpful") {
                    ForEach(books) { book in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(book.title).foregroundStyle(Theme.ink)
                            if let description = book.description {
                                Text(description).font(.subheadline).foregroundStyle(Theme.muted)
                            }
                        }
                        .accessibilityElement(children: .combine)
                    }
                }
            }

            if !links.isEmpty {
                Section("Other places that might help") {
                    ForEach(links) { link in
                        if let string = link.url, let url = URL(string: string) {
                            Link(destination: url) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(link.title).foregroundStyle(Theme.link)
                                    if let description = link.description {
                                        Text(description).font(.subheadline).foregroundStyle(Theme.muted)
                                    }
                                }
                            }
                            .accessibilityHint("Opens in Safari")
                        }
                    }
                }
            }

            Section {
                Text("Between Us is currently available in English only. All circles are conducted in English.")
                    .font(.footnote)
                    .foregroundStyle(Theme.muted)
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.background)
        .navigationTitle("Resources")
        .overlay {
            if !loaded { ProgressView() }
        }
        .task {
            resources = (try? await supabase.from("resources")
                .select("id, title, type, description, url, category")
                .order("created_at")
                .execute().value) ?? []
            loaded = true
        }
    }
}
