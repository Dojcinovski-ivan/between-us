import SwiftUI

/// The dialogs behind a post's long-press menu: edit, delete, report and
/// block. Shared by the feed and threads.
enum PostAction: Identifiable {
    case edit(Post)
    case delete(Post)
    case report(Post)
    case block(Post)

    var id: String {
        switch self {
        case .edit(let p): "edit-\(p.id)"
        case .delete(let p): "delete-\(p.id)"
        case .report(let p): "report-\(p.id)"
        case .block(let p): "block-\(p.id)"
        }
    }
}

extension View {
    func postActions(_ action: Binding<PostAction?>, store: CircleStore) -> some View {
        modifier(PostActionsModifier(action: action, store: store))
    }
}

private struct PostActionsModifier: ViewModifier {
    @Binding var action: PostAction?
    let store: CircleStore

    @State private var reported: Post?
    @State private var errorMessage: String?
    @State private var feedback = 0

    private func binding(_ matches: @escaping (PostAction) -> Post?) -> Binding<Post?> {
        Binding(
            get: { action.flatMap(matches) },
            set: { if $0 == nil { action = nil } }
        )
    }

    private var editing: Binding<Post?> { binding { if case .edit(let p) = $0 { p } else { nil } } }
    private var deleting: Binding<Post?> { binding { if case .delete(let p) = $0 { p } else { nil } } }
    private var reporting: Binding<Post?> { binding { if case .report(let p) = $0 { p } else { nil } } }
    private var blocking: Binding<Post?> { binding { if case .block(let p) = $0 { p } else { nil } } }

    func body(content: Content) -> some View {
        content
            .sheet(item: editing) { post in
                EditPostSheet(post: post) { text in
                    try await store.edit(post, to: text)
                }
            }
            .confirmationDialog(
                deleteTitle(deleting.wrappedValue),
                isPresented: isPresented(deleting),
                titleVisibility: .visible,
                presenting: deleting.wrappedValue
            ) { post in
                Button("Delete", role: .destructive) {
                    run { try await store.delete(post) }
                }
            } message: { _ in
                Text("This can't be undone.")
            }
            .confirmationDialog(
                "Why are you reporting this?",
                isPresented: isPresented(reporting),
                titleVisibility: .visible,
                presenting: reporting.wrappedValue
            ) { post in
                ForEach(ReportReason.allCases) { reason in
                    Button(reason.rawValue) {
                        run {
                            try await store.report(post, reason: reason)
                            reported = post
                        }
                    }
                }
            } message: { _ in
                Text("Reports are private. The team reviews every one.")
            }
            .alert(
                "Thanks, we'll take a look.",
                isPresented: Binding(get: { reported != nil }, set: { if !$0 { reported = nil } }),
                presenting: reported
            ) { post in
                Button("Block \(store.name(of: post))", role: .destructive) {
                    action = .block(post)
                }
                Button("Done", role: .cancel) {}
            } message: { post in
                Text("You can also block \(store.name(of: post)) so you no longer see anything they write.")
            }
            .alert(
                blockTitle(blocking.wrappedValue),
                isPresented: isPresented(blocking),
                presenting: blocking.wrappedValue
            ) { post in
                Button("Block", role: .destructive) {
                    run { try await store.block(post.userId) }
                }
                Button("Cancel", role: .cancel) {}
            } message: { _ in
                Text("You won't see their posts or replies anymore. They won't be told.")
            }
            .alert(
                "Something went wrong",
                isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })
            ) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
            .sensoryFeedback(.success, trigger: feedback)
    }

    private func isPresented(_ post: Binding<Post?>) -> Binding<Bool> {
        Binding(get: { post.wrappedValue != nil }, set: { if !$0 { post.wrappedValue = nil } })
    }

    private func deleteTitle(_ post: Post?) -> String {
        guard let post else { return "Delete this post?" }
        let replies = store.replyCount(for: post)
        return switch replies {
        case 0: "Delete this post?"
        case 1: "Delete this post and its reply?"
        default: "Delete this post and its \(replies) replies?"
        }
    }

    private func blockTitle(_ post: Post?) -> String {
        guard let post else { return "Block this member?" }
        return "Block \(store.name(of: post))?"
    }

    private func run(_ work: @escaping () async throws -> Void) {
        Task {
            do {
                try await work()
                feedback += 1
            } catch {
                errorMessage = "Please check your connection and try again."
            }
        }
    }
}

private struct EditPostSheet: View {
    let post: Post
    var onSave: (String) async throws -> Void

    @State private var text: String
    @State private var isSaving = false
    @State private var failed = false
    @FocusState private var focused: Bool
    @Environment(\.dismiss) private var dismiss

    init(post: Post, onSave: @escaping (String) async throws -> Void) {
        self.post = post
        self.onSave = onSave
        _text = State(initialValue: post.content)
    }

    private var trimmed: String { text.trimmingCharacters(in: .whitespacesAndNewlines) }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Your post", text: $text, axis: .vertical)
                        .lineLimit(4...)
                        .focused($focused)
                } footer: {
                    if failed {
                        Text("That didn't save. Please try again.").foregroundStyle(Theme.danger)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("Edit post")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if isSaving {
                        ProgressView()
                    } else {
                        Button("Save") { save() }
                            .disabled(trimmed.isEmpty || trimmed == post.content)
                    }
                }
            }
            .onAppear { focused = true }
        }
        .presentationDetents([.medium, .large])
    }

    private func save() {
        isSaving = true
        failed = false
        Task {
            do {
                try await onSave(trimmed)
                dismiss()
            } catch {
                failed = true
            }
            isSaving = false
        }
    }
}
