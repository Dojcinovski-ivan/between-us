import SwiftUI

/// One post as a chat bubble: yours on the right in the accent colour,
/// everyone else's on the left. Long press for reactions and actions.
struct PostRow: View {
    let post: Post
    let store: CircleStore
    var showsReplies = true
    var onOpenThread: (Post) -> Void = { _ in }
    var onEdit: (Post) -> Void
    var onDelete: (Post) -> Void
    var onReport: (Post) -> Void
    var onBlock: (Post) -> Void

    @State private var reactionTrigger = 0

    private var isMine: Bool { post.userId == store.me }
    private var replies: Int { store.replyCount(for: post) }
    private var myReactions: Set<Reaction> { store.myReactions[post.id] ?? [] }

    var body: some View {
        VStack(alignment: isMine ? .trailing : .leading, spacing: 6) {
            header
            bubble
            footer
        }
        .frame(maxWidth: .infinity, alignment: isMine ? .trailing : .leading)
        .task(id: post.id) {
            // A read counts once the post has been on screen for 3 seconds,
            // same as the website. Scrolling away cancels the wait.
            guard !isMine, !store.isRead(post) else { return }
            try? await Task.sleep(for: .seconds(3))
            guard !Task.isCancelled else { return }
            await store.markRead(post)
        }
        .sensoryFeedback(.impact(weight: .light), trigger: reactionTrigger)
    }

    private var header: some View {
        HStack(spacing: 6) {
            SwiftUI.Circle()
                .fill(Stage.color(store.stage(of: post)))
                .frame(width: 8, height: 8)
                .accessibilityHidden(true)
            Text(store.name(of: post))
                .font(.caption.weight(.semibold))
                .foregroundStyle(Theme.ink)
            if post.isPromptResponse {
                Text("Prompt response")
                    .font(.caption2)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Theme.sage.opacity(0.18), in: Capsule())
                    .foregroundStyle(Theme.ink)
            }
        }
        .padding(.horizontal, 4)
    }

    private var bubble: some View {
        Text(post.content)
            .font(.body)
            .foregroundStyle(isMine ? .white : Theme.ink)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                isMine ? Theme.accent : Theme.surface2,
                in: UnevenRoundedRectangle(
                    topLeadingRadius: 18,
                    bottomLeadingRadius: isMine ? 18 : 6,
                    bottomTrailingRadius: isMine ? 6 : 18,
                    topTrailingRadius: 18
                )
            )
            .frame(maxWidth: 320, alignment: isMine ? .trailing : .leading)
            .contentShape(.contextMenuPreview, RoundedRectangle(cornerRadius: 18))
            .contextMenu { menu }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("\(store.name(of: post)): \(post.content)")
            .accessibilityValue(post.editedAt == nil ? "" : "Edited")
            .accessibilityHint("Touch and hold for reactions and more options")
            .accessibilityActions {
                ForEach(Reaction.allCases) { reaction in
                    Button(myReactions.contains(reaction) ? "Remove \(reaction.label)" : "React \(reaction.label)") { react(reaction) }
                }
                if showsReplies { Button("Reply") { onOpenThread(post) } }
            }
    }

    @ViewBuilder
    private var menu: some View {
        Section {
            ForEach(Reaction.allCases) { reaction in
                Button {
                    react(reaction)
                } label: {
                    Label {
                        Text("\(reaction.emoji) \(reaction.label)")
                    } icon: {
                        if myReactions.contains(reaction) { Image(systemName: "checkmark") }
                    }
                }
            }
        }

        if showsReplies {
            Button("Reply", systemImage: "arrowshape.turn.up.left") { onOpenThread(post) }
        }
        Button("Copy", systemImage: "doc.on.doc") { UIPasteboard.general.string = post.content }

        if isMine {
            Button("Edit", systemImage: "pencil") { onEdit(post) }
            Button("Delete", systemImage: "trash", role: .destructive) { onDelete(post) }
        } else {
            Button("Report", systemImage: "flag") { onReport(post) }
            Button("Block \(store.name(of: post))", systemImage: "hand.raised", role: .destructive) { onBlock(post) }
        }
    }

    private var footer: some View {
        VStack(alignment: isMine ? .trailing : .leading, spacing: 6) {
            HStack(spacing: 4) {
                Text(post.createdAt, format: .relative(presentation: .named))
                if post.editedAt != nil { Text("· Edited") }
            }
            .font(.caption2)
            .foregroundStyle(Theme.muted)

            reactionPills

            if isMine, let reads = store.readCounts[post.id], reads > 0 {
                Text(reads == 1 ? "1 person read this" : "\(reads) people read this")
                    .font(.caption2)
                    .foregroundStyle(Theme.muted)
            }

            if showsReplies {
                Button {
                    onOpenThread(post)
                } label: {
                    Text(replies == 0 ? "Reply" : (replies == 1 ? "1 reply" : "\(replies) replies"))
                        .font(.caption.weight(.medium))
                        .foregroundStyle(Theme.link)
                }
                .buttonStyle(.borderless)
            }
        }
        .padding(.horizontal, 4)
    }

    /// Like the website: you see the reactions you gave, and on your own
    /// posts, how many of each you received. Tapping one toggles yours.
    @ViewBuilder
    private var reactionPills: some View {
        let counts = store.reactionCounts[post.id] ?? [:]
        let shown = Reaction.allCases.filter { myReactions.contains($0) || (isMine && counts[$0, default: 0] > 0) }
        if !shown.isEmpty {
            HStack(spacing: 6) {
                ForEach(shown) { reaction in
                    let count = counts[reaction, default: 0]
                    Button {
                        react(reaction)
                    } label: {
                        HStack(spacing: 3) {
                            Text(reaction.emoji)
                            if isMine, count > 0 { Text("\(count)").foregroundStyle(Theme.muted) }
                        }
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(myReactions.contains(reaction) ? Theme.sage.opacity(0.2) : .clear, in: Capsule())
                        .overlay(Capsule().strokeBorder(myReactions.contains(reaction) ? Theme.sage : Theme.border))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(isMine ? "\(reaction.label), \(count)" : reaction.label)
                    .accessibilityAddTraits(myReactions.contains(reaction) ? .isSelected : [])
                }
            }
        }
    }

    private func react(_ reaction: Reaction) {
        reactionTrigger += 1
        Task { await store.toggle(reaction, on: post) }
    }
}
