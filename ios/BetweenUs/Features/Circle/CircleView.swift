import SwiftUI

/// The member's circle: this week's conversation at the bottom like any
/// chat, earlier weeks folded away above it, and the composer pinned over
/// the keyboard.
struct CircleView: View {
    @State private var store: CircleStore
    @State private var draft = ""
    @State private var isPromptResponse = false
    @State private var postAction: PostAction?
    @State private var threadPath: [UUID] = []
    @State private var postFailed = false
    @FocusState private var composerFocused: Bool
    @Environment(SessionStore.self) private var session
    @Environment(\.scenePhase) private var scenePhase

    init(profile: Profile) {
        _store = State(initialValue: CircleStore(profile: profile))
    }

    var body: some View {
        NavigationStack(path: $threadPath) {
            content
                .background(Theme.background)
                .toolbar { toolbar }
                .navigationBarTitleDisplayMode(.inline)
                .navigationDestination(for: UUID.self) { id in
                    ThreadView(parentId: id, store: store)
                }
        }
        .task { await store.load() }
        .task(id: store.circle?.memberCount ?? 0 > 1) {
            // Live updates only matter once there is a feed to update.
            guard store.circle?.memberCount ?? 0 > 1 else { return }
            await store.listen()
        }
        .onChange(of: scenePhase) { _, phase in
            // Realtime can drop while the app is in the background.
            if phase == .active { Task { await store.load() } }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch store.loading {
        case .loading:
            ProgressView()
                .accessibilityLabel("Loading your circle")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        case .failed:
            ContentUnavailableView {
                Label("Can't load your circle", systemImage: "wifi.exclamationmark")
            } description: {
                Text("Check your connection and try again.")
            } actions: {
                Button("Try Again") { Task { await store.load() } }
                    .buttonStyle(.borderedProminent)
            }
        case .loaded:
            if let circle = store.circle, circle.memberCount <= 1 {
                WaitingRoomView(store: store)
            } else {
                feed
            }
        }
    }

    // MARK: - Feed

    private var feed: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 20) {
                    cards
                    weeks
                }
                .padding()
            }
            .defaultScrollAnchor(.bottom)
            .scrollDismissesKeyboard(.interactively)
            .refreshable { await store.load() }
            .safeAreaInset(edge: .bottom) {
                ComposerBar(
                    text: $draft,
                    isPromptResponse: isPromptResponse,
                    onClearPromptResponse: { isPromptResponse = false },
                    focus: $composerFocused
                ) { content in
                    do {
                        let post = try await store.createPost(content, isPromptResponse: isPromptResponse)
                        isPromptResponse = false
                        withAnimation { proxy.scrollTo(post.id, anchor: .bottom) }
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
                Text("Your message is still in the box. Check your connection and try again.")
            }
        }
    }

    @ViewBuilder
    private var cards: some View {
        if let spark = store.spark {
            InfoCard(label: "A gentle nudge from Between Us", text: spark, tint: Theme.sage)
        }
        if let prompt = store.prompt {
            PromptCard(prompt: prompt) {
                isPromptResponse = true
                composerFocused = true
            }
        }
        if !store.isFirstWeek, let question = store.dailyQuestion {
            InfoCard(label: "Today's question", text: question, tint: Theme.accent, action: "Respond") {
                draft = "Reflecting on today's question, \"\(question)\"\n\n"
                composerFocused = true
            }
        }
    }

    @ViewBuilder
    private var weeks: some View {
        let groups = WeekGroup.group(store.topLevelPosts)

        ForEach(groups.previous) { week in
            DisclosureGroup {
                VStack(spacing: 20) {
                    ForEach(week.posts) { post in row(post) }
                }
                .padding(.top, 12)
            } label: {
                Text("\(week.label) · \(week.posts.count) \(week.posts.count == 1 ? "post" : "posts")")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Theme.muted)
            }
            .tint(Theme.muted)
        }

        Text("This Week")
            .font(.subheadline.weight(.medium))
            .foregroundStyle(Theme.muted)
            .accessibilityAddTraits(.isHeader)

        if groups.thisWeek.isEmpty {
            Text("No posts yet this week. Be the first to share something.")
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .padding()
                .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Theme.border, style: StrokeStyle(lineWidth: 1, dash: [4])))
        } else {
            ForEach(groups.thisWeek) { post in row(post) }
        }
    }

    private func row(_ post: Post) -> some View {
        PostRow(
            post: post,
            store: store,
            onOpenThread: { threadPath.append($0.id) },
            onEdit: { postAction = .edit($0) },
            onDelete: { postAction = .delete($0) },
            onReport: { postAction = .report($0) },
            onBlock: { postAction = .block($0) }
        )
        .id(post.id)
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var toolbar: some ToolbarContent {
        ToolbarItem(placement: .principal) {
            if let circle = store.circle {
                VStack(spacing: 0) {
                    Text(circle.name)
                        .font(.headline)
                        .lineLimit(1)
                    Text(circle.memberCount == 1 ? "1 member" : "\(circle.memberCount) members")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                }
                .accessibilityElement(children: .combine)
                .accessibilityAddTraits(.isHeader)
            }
        }
        ToolbarItem(placement: .topBarLeading) {
            NavigationLink {
                ResourcesView(category: store.profile.category)
            } label: {
                Label("Resources", systemImage: "lifepreserver")
            }
        }
        ToolbarItem(placement: .topBarTrailing) {
            NavigationLink {
                ProfileView(profile: store.profile, store: store)
            } label: {
                Label("Profile", systemImage: "person.crop.circle")
            }
        }
    }
}

// MARK: - Cards

private struct InfoCard: View {
    let label: String
    let text: String
    let tint: Color
    var action: String?
    var onAction: () -> Void = {}

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label.uppercased())
                .font(.caption2.weight(.semibold))
                .foregroundStyle(Theme.muted)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(Theme.ink)
            if let action {
                Button(action, action: onAction)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.link)
                    .buttonStyle(.borderless)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 16))
        .accessibilityElement(children: .combine)
    }
}

/// Collapsed by default so it stays out of the way, like the website's.
private struct PromptCard: View {
    let prompt: String
    var onRespond: () -> Void
    @State private var expanded = false

    var body: some View {
        DisclosureGroup(isExpanded: $expanded) {
            VStack(alignment: .leading, spacing: 10) {
                Text(prompt)
                    .font(.subheadline)
                    .foregroundStyle(Theme.ink)
                Button("Respond to this prompt", action: onRespond)
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, 8)
        } label: {
            HStack(spacing: 8) {
                Text("PROMPT")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(Theme.muted)
                if !expanded {
                    Text(prompt)
                        .font(.subheadline)
                        .foregroundStyle(Theme.ink)
                        .lineLimit(1)
                }
            }
        }
        .tint(Theme.muted)
        .padding()
        .background(Theme.sage.opacity(0.14), in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Weeks

/// Monday-based weeks in the viewer's time zone, like src/lib/time.ts.
struct WeekGroup: Identifiable {
    let start: Date
    let posts: [Post]
    var id: Date { start }
    var label: String { "Week of \(start.formatted(.dateTime.month(.abbreviated).day()))" }

    static func group(_ posts: [Post]) -> (previous: [WeekGroup], thisWeek: [Post]) {
        var calendar = Calendar(identifier: .gregorian)
        calendar.firstWeekday = 2
        let startOf = { (date: Date) in calendar.dateInterval(of: .weekOfYear, for: date)?.start ?? date }
        let current = startOf(.now)

        var thisWeek: [Post] = []
        var byWeek: [Date: [Post]] = [:]
        for post in posts {
            let start = startOf(post.createdAt)
            if start == current { thisWeek.append(post) } else { byWeek[start, default: []].append(post) }
        }
        let previous = byWeek.keys.sorted().map { WeekGroup(start: $0, posts: byWeek[$0]!) }
        return (previous, thisWeek)
    }
}
