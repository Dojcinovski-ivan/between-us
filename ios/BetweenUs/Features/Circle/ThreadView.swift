import SwiftUI

/// A post and its replies, pushed from the feed. Uses the feed's store, so
/// live updates, reactions and blocks are shared with it.
struct ThreadView: View {
    let parentId: UUID
    let store: CircleStore

    @State private var draft = ""
    @State private var postAction: PostAction?
    @State private var postFailed = false
    @FocusState private var composerFocused: Bool
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Group {
            if let parent = store.post(parentId) {
                thread(parent)
            } else {
                ContentUnavailableView("This post was deleted", systemImage: "trash")
            }
        }
        .background(Theme.background)
        .navigationTitle("Thread")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: store.post(parentId) == nil) { _, gone in
            // Deleted while open (by its author, an admin, or live from
            // elsewhere): go back rather than sit on a post that's gone.
            if gone { dismiss() }
        }
    }

    private func thread(_ parent: Post) -> some View {
        let replies = store.replies(to: parent)

        return ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 20) {
                    row(parent)

                    HStack {
                        Text(replies.isEmpty ? "No replies yet" : (replies.count == 1 ? "1 reply" : "\(replies.count) replies"))
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(Theme.muted)
                            .accessibilityAddTraits(.isHeader)
                        VStack { Divider() }
                    }

                    if replies.isEmpty {
                        Text("Be the first to respond.")
                            .font(.subheadline)
                            .foregroundStyle(Theme.muted)
                            .frame(maxWidth: .infinity)
                    } else {
                        ForEach(replies) { reply in row(reply) }
                    }
                }
                .padding()
            }
            .scrollDismissesKeyboard(.interactively)
            .safeAreaInset(edge: .bottom) {
                ComposerBar(text: $draft, placeholder: "Reply in thread…", focus: $composerFocused) { content in
                    do {
                        let reply = try await store.createPost(content, parentId: parent.id)
                        withAnimation { proxy.scrollTo(reply.id, anchor: .bottom) }
                        return true
                    } catch {
                        postFailed = true
                        return false
                    }
                }
            }
            .postActions($postAction, store: store)
            .alert("That didn't post", isPresented: $postFailed) {
                Button("OK", role: .cancel) {}
            } message: {
                Text("Your reply is still in the box. Check your connection and try again.")
            }
        }
    }

    private func row(_ post: Post) -> some View {
        PostRow(
            post: post,
            store: store,
            showsReplies: false,
            onEdit: { postAction = .edit($0) },
            onDelete: { postAction = .delete($0) },
            onReport: { postAction = .report($0) },
            onBlock: { postAction = .block($0) }
        )
        .id(post.id)
    }
}
