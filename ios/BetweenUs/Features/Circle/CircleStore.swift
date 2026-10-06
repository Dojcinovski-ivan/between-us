import Foundation
import Observation
import Supabase

/// Everything the circle feed shows, loaded with the same queries as the
/// website's /circle page and kept live over Supabase Realtime. All reads
/// and writes run under the member's own row-level security.
@MainActor
@Observable
final class CircleStore {
    enum Loading: Equatable {
        case loading
        case loaded
        case failed
    }

    let profile: Profile
    private(set) var loading: Loading = .loading

    private(set) var circle: Circle?
    private(set) var posts: [Post] = []
    private(set) var members: [UUID: Member] = [:]
    private(set) var prompt: String?
    private(set) var dailyQuestion: String?
    private(set) var spark: String?
    /// The waiting room's private draft, published by the server when a
    /// second member joins.
    private(set) var draft: Draft?

    /// Reactions I made, per post.
    private(set) var myReactions: [UUID: Set<Reaction>] = [:]
    /// Reaction totals, which RLS only returns for my own posts.
    private(set) var reactionCounts: [UUID: [Reaction: Int]] = [:]
    private(set) var readCounts: [UUID: Int] = [:]
    private var myReads: Set<UUID> = []
    private var blocked: Set<UUID> = []

    init(profile: Profile) {
        self.profile = profile
    }

    var me: UUID { profile.id }

    var topLevelPosts: [Post] {
        posts.filter { $0.parentId == nil }.sorted { $0.createdAt < $1.createdAt }
    }

    func post(_ id: UUID) -> Post? {
        posts.first { $0.id == id }
    }

    func replies(to post: Post) -> [Post] {
        posts.filter { $0.parentId == post.id }.sorted { $0.createdAt < $1.createdAt }
    }

    func replyCount(for post: Post) -> Int {
        posts.reduce(0) { $0 + ($1.parentId == post.id ? 1 : 0) }
    }

    func isRead(_ post: Post) -> Bool { myReads.contains(post.id) }

    /// Mirrors circleTenureTier: the daily question waits until after the
    /// first week, so a new member's circle feels calm.
    var isFirstWeek: Bool {
        guard let joined = profile.createdAt else { return false }
        return Date().timeIntervalSince(joined) <= 7 * 24 * 60 * 60
    }

    // MARK: - Loading

    private struct ReactionRow: Decodable {
        let postId: UUID
        let userId: UUID
        let type: String
        enum CodingKeys: String, CodingKey { case postId = "post_id", userId = "user_id", type }
    }

    private struct ReadRow: Decodable {
        let postId: UUID
        let userId: UUID
        enum CodingKeys: String, CodingKey { case postId = "post_id", userId = "user_id" }
    }

    private struct ContentRow: Decodable { let content: String }
    private struct BlockRow: Decodable {
        let blockedId: UUID
        enum CodingKeys: String, CodingKey { case blockedId = "blocked_id" }
    }

    /// A first load slower than this shows "Can't load your circle" with a
    /// Try Again button instead of a spinner that never ends.
    private static let loadTimeout: TimeInterval = 20

    func load() async {
        #if DEBUG
        if Demo.isOn { return showDemo() }
        #endif
        if circle == nil { loading = .loading }
        do {
            try await withTimeout(Self.loadTimeout) { try await self.fetch() }
        } catch {
            // A failed refresh leaves what is already on screen alone.
            if circle == nil { loading = .failed }
        }
    }

    #if DEBUG
    private func showDemo() {
        circle = Demo.circle
        members = Dictionary(uniqueKeysWithValues: Demo.members.map { ($0.id, $0) })
        posts = Demo.posts
        prompt = Demo.prompt
        reactionCounts = Demo.reactionCounts
        myReactions = Demo.myReactions
        loading = .loaded
    }
    #endif

    private struct NoCircle: Error {}

    private func fetch() async throws {
        // SessionStore keeps a profile without a circle away from here.
        guard let circleId = profile.circleId else { throw NoCircle() }

        do {
            let circle: Circle = try await supabase.from("circles")
                .select("id, category, member_count")
                .eq("id", value: circleId)
                .single()
                .execute().value
            self.circle = circle

            // Alone in the circle: the waiting room takes over and the feed
            // queries below never need to run.
            guard circle.memberCount > 1 else {
                let drafts: [Draft] = try await supabase.from("draft_posts")
                    .select("id, content")
                    .eq("circle_id", value: circleId)
                    .eq("user_id", value: me)
                    .limit(1)
                    .execute().value
                draft = drafts.first
                loading = .loaded
                return
            }

            let today = Date().formatted(.iso8601.year().month().day())
            // JavaScript's getDay(): 0 = Sunday, as daily_questions uses.
            let dayOfWeek = Calendar(identifier: .gregorian).component(.weekday, from: .now) - 1

            async let postsQuery: [Post] = supabase.from("posts")
                .select(Post.select)
                .eq("circle_id", value: circleId)
                .eq("is_removed", value: false)
                .order("created_at")
                .execute().value
            async let reactionsQuery: [ReactionRow] = supabase.from("reactions")
                .select("post_id, user_id, type, posts!inner(circle_id)")
                .eq("posts.circle_id", value: circleId)
                .execute().value
            async let readsQuery: [ReadRow] = supabase.from("post_reads")
                .select("post_id, user_id, posts!inner(circle_id)")
                .eq("posts.circle_id", value: circleId)
                .execute().value
            async let membersQuery: [Member] = supabase.from("users")
                .select("id, username, current_stage")
                .eq("circle_id", value: circleId)
                .execute().value
            async let promptQuery: [ContentRow] = supabase.from("prompts")
                .select("content")
                .eq("category", value: profile.category)
                .lte("week_start", value: today)
                .order("week_start", ascending: false)
                .limit(1)
                .execute().value
            async let questionQuery: [ContentRow] = supabase.from("daily_questions")
                .select("content")
                .eq("category", value: profile.category)
                .eq("day_of_week", value: dayOfWeek)
                .limit(1)
                .execute().value
            async let sparkQuery: [ContentRow] = supabase.from("circle_sparks")
                .select("content")
                .eq("circle_id", value: circleId)
                .gt("expires_at", value: Date().ISO8601Format())
                .order("created_at", ascending: false)
                .limit(1)
                .execute().value

            let (posts, reactions, reads, members) = try await (postsQuery, reactionsQuery, readsQuery, membersQuery)
            // These three are extras; the feed still works without them.
            prompt = (try? await promptQuery)?.first?.content
            dailyQuestion = (try? await questionQuery)?.first?.content
            spark = (try? await sparkQuery)?.first?.content
            // Also enforced by RLS once migration 0030 has run; filtering here
            // too means a block takes effect instantly, before any reload.
            blocked = await loadBlocks()

            self.members = Dictionary(uniqueKeysWithValues: members.map { ($0.id, $0) })
            self.posts = posts.filter { !blocked.contains($0.userId) }

            var mine: [UUID: Set<Reaction>] = [:]
            var counts: [UUID: [Reaction: Int]] = [:]
            for row in reactions {
                guard let reaction = Reaction(rawValue: row.type) else { continue }
                counts[row.postId, default: [:]][reaction, default: 0] += 1
                if row.userId == me { mine[row.postId, default: []].insert(reaction) }
            }
            myReactions = mine
            reactionCounts = counts

            readCounts = reads.reduce(into: [:]) { $0[$1.postId, default: 0] += 1 }
            myReads = Set(reads.filter { $0.userId == me }.map(\.postId))

            loading = .loaded
        }
    }

    private func loadBlocks() async -> Set<UUID> {
        let rows: [BlockRow]? = try? await supabase.from("user_blocks")
            .select("blocked_id")
            .eq("blocker_id", value: me)
            .execute().value
        return Set((rows ?? []).map(\.blockedId))
    }

    // MARK: - Realtime

    private struct DeletedRow: Decodable { let id: UUID }

    /// Follows inserts, edits and deletes in this circle until the calling
    /// task is cancelled (the view disappearing does that).
    func listen() async {
        #if DEBUG
        if Demo.isOn { return }
        #endif
        guard let circleId = profile.circleId else { return }
        let channel = supabase.channel("circle-\(circleId.uuidString.lowercased())")
        let filter = RealtimePostgresFilter.eq("circle_id", value: circleId.uuidString.lowercased())
        let inserts = channel.postgresChange(InsertAction.self, table: "posts", filter: filter)
        let updates = channel.postgresChange(UpdateAction.self, table: "posts", filter: filter)
        let deletes = channel.postgresChange(DeleteAction.self, table: "posts", filter: filter)

        do {
            try await channel.subscribeWithError()
        } catch {
            return
        }

        // Each loop ends when this task is cancelled, which ends the streams.
        async let a: Void = consumeInserts(inserts)
        async let b: Void = consumeUpdates(updates)
        async let c: Void = consumeDeletes(deletes)
        _ = await (a, b, c)

        await supabase.removeChannel(channel)
    }

    private func consumeInserts(_ stream: AsyncStream<InsertAction>) async {
        for await action in stream {
            if let post = try? action.decodeRecord(as: Post.self, decoder: AnyJSON.decoder) {
                await received(post)
            }
        }
    }

    private func consumeUpdates(_ stream: AsyncStream<UpdateAction>) async {
        for await action in stream {
            if let post = try? action.decodeRecord(as: Post.self, decoder: AnyJSON.decoder) {
                applyEdit(id: post.id, content: post.content, editedAt: post.editedAt)
            }
        }
    }

    private func consumeDeletes(_ stream: AsyncStream<DeleteAction>) async {
        for await action in stream {
            if let row = try? action.decodeOldRecord(as: DeletedRow.self, decoder: AnyJSON.decoder) {
                removePost(row.id)
            }
        }
    }

    private func received(_ post: Post) async {
        guard !blocked.contains(post.userId), !posts.contains(where: { $0.id == post.id }) else { return }
        var post = post
        if members[post.userId] == nil {
            // Someone new joined since the feed loaded.
            let member: Member? = try? await supabase.from("users")
                .select("id, username, current_stage")
                .eq("id", value: post.userId)
                .single()
                .execute().value
            if let member { members[member.id] = member }
        }
        if let member = members[post.userId] {
            post.author = .init(username: member.username, currentStage: member.currentStage)
        }
        guard !posts.contains(where: { $0.id == post.id }) else { return }
        posts.append(post)
    }

    private func applyEdit(id: UUID, content: String, editedAt: Date?) {
        guard let index = posts.firstIndex(where: { $0.id == id }) else { return }
        posts[index].content = content
        posts[index].editedAt = editedAt
    }

    private func removePost(_ id: UUID) {
        posts.removeAll { $0.id == id || $0.parentId == id }
    }

    // MARK: - Waiting room

    struct Draft: Decodable, Equatable, Sendable {
        let id: UUID
        let content: String
    }

    private struct MemberCountRow: Decodable {
        let memberCount: Int
        enum CodingKeys: String, CodingKey { case memberCount = "member_count" }
    }

    /// Waits for a second member to join, then reloads into the feed.
    func listenForMembers() async {
        guard let circleId = profile.circleId else { return }
        let channel = supabase.channel("circle-waiting-\(circleId.uuidString.lowercased())")
        let updates = channel.postgresChange(
            UpdateAction.self,
            table: "circles",
            filter: .eq("id", value: circleId.uuidString.lowercased())
        )
        do {
            try await channel.subscribeWithError()
        } catch {
            return
        }
        for await action in updates {
            if let row = try? action.decodeRecord(as: MemberCountRow.self, decoder: AnyJSON.decoder), row.memberCount >= 2 {
                await load()
                break
            }
        }
        await supabase.removeChannel(channel)
    }

    private struct DraftUpsert: Encodable {
        let circle_id: UUID
        let user_id: UUID
        let content: String
    }

    func saveDraft(_ content: String) async throws {
        guard let circleId = profile.circleId else { return }
        draft = try await supabase.from("draft_posts")
            .upsert(
                DraftUpsert(circle_id: circleId, user_id: me, content: String(content.prefix(Self.maxLength))),
                onConflict: "circle_id,user_id"
            )
            .select("id, content")
            .single()
            .execute().value
    }

    func deleteDraft() async throws {
        guard let draft else { return }
        try await supabase.from("draft_posts").delete().eq("id", value: draft.id).execute()
        self.draft = nil
    }

    // MARK: - Writing

    private struct NewPost: Encodable {
        let circle_id: UUID
        let user_id: UUID
        let content: String
        let parent_id: UUID?
        let is_prompt_response: Bool
    }

    private struct PostIDRequest: Encodable { let postId: String }
    private struct ReportIDRequest: Encodable { let reportId: String }

    static let maxLength = 1000

    /// Creates a post (or a reply, with `parentId`) and returns it.
    func createPost(_ content: String, parentId: UUID? = nil, isPromptResponse: Bool = false) async throws -> Post {
        guard let circleId = profile.circleId else { throw CancellationError() }
        let post: Post = try await supabase.from("posts")
            .insert(NewPost(
                circle_id: circleId,
                user_id: me,
                content: String(content.prefix(Self.maxLength)),
                parent_id: parentId,
                is_prompt_response: isPromptResponse
            ))
            .select(Post.select)
            .single()
            .execute().value

        if !posts.contains(where: { $0.id == post.id }) { posts.append(post) }

        // After the post is saved, never part of it: records @mentions and
        // emails the people named, like the website's recordMentions.
        Task { try? await MobileAPI.post("api/mobile/mentions", body: PostIDRequest(postId: post.id.uuidString.lowercased()), authenticated: true) }
        return post
    }

    func edit(_ post: Post, to content: String) async throws {
        let editedAt = Date()
        try await supabase.from("posts")
            .update(["content": String(content.prefix(Self.maxLength)), "edited_at": editedAt.ISO8601Format()])
            .eq("id", value: post.id)
            .execute()
        applyEdit(id: post.id, content: content, editedAt: editedAt)
    }

    func delete(_ post: Post) async throws {
        try await supabase.from("posts").delete().eq("id", value: post.id).execute()
        removePost(post.id)
    }

    func toggle(_ reaction: Reaction, on post: Post) async {
        let hasIt = myReactions[post.id, default: []].contains(reaction)
        do {
            if hasIt {
                try await supabase.from("reactions").delete()
                    .eq("post_id", value: post.id)
                    .eq("user_id", value: me)
                    .eq("type", value: reaction.rawValue)
                    .execute()
                myReactions[post.id, default: []].remove(reaction)
                reactionCounts[post.id, default: [:]][reaction] = max(0, (reactionCounts[post.id]?[reaction] ?? 1) - 1)
            } else {
                try await supabase.from("reactions")
                    .insert(["post_id": post.id.uuidString, "user_id": me.uuidString, "type": reaction.rawValue])
                    .execute()
                myReactions[post.id, default: []].insert(reaction)
                reactionCounts[post.id, default: [:]][reaction, default: 0] += 1
            }
        } catch {
            // Nothing changed locally, so the button simply stays as it was.
        }
    }

    /// Silent read receipt; only the post's author ever sees the count.
    func markRead(_ post: Post) async {
        guard post.userId != me, !myReads.contains(post.id) else { return }
        myReads.insert(post.id)
        _ = try? await supabase.from("post_reads")
            .insert(["post_id": post.id.uuidString, "user_id": me.uuidString])
            .execute()
    }

    private struct ReportRow: Decodable { let id: UUID }

    func report(_ post: Post, reason: ReportReason) async throws {
        let row: ReportRow = try await supabase.from("reports")
            .insert(["post_id": post.id.uuidString, "reported_by": me.uuidString, "reason": reason.rawValue])
            .select("id")
            .single()
            .execute().value
        // Emails the team, like the website's notifyReportSubmitted.
        Task { try? await MobileAPI.post("api/mobile/reports", body: ReportIDRequest(reportId: row.id.uuidString.lowercased()), authenticated: true) }
    }

    /// Hides everything this member writes, here and (via RLS) everywhere.
    func block(_ userId: UUID) async throws {
        try await supabase.from("user_blocks")
            .insert(["blocker_id": me.uuidString, "blocked_id": userId.uuidString])
            .execute()
        blocked.insert(userId)
        posts.removeAll { $0.userId == userId }
    }

    struct BlockedMember: Decodable, Identifiable, Sendable {
        struct Name: Decodable, Sendable { let username: String }
        let blockedId: UUID
        let member: Name?
        var id: UUID { blockedId }
        var username: String { member?.username ?? "former member" }
        enum CodingKeys: String, CodingKey {
            case blockedId = "blocked_id"
            case member = "blocked"
        }
    }

    func blockedMembers() async throws -> [BlockedMember] {
        try await supabase.from("user_blocks")
            .select("blocked_id, blocked:users!user_blocks_blocked_id_fkey(username)")
            .eq("blocker_id", value: me)
            .order("created_at", ascending: false)
            .execute().value
    }

    /// Their posts come back on the next load, which this does.
    func unblock(_ userId: UUID) async throws {
        try await supabase.from("user_blocks").delete()
            .eq("blocker_id", value: me)
            .eq("blocked_id", value: userId)
            .execute()
        blocked.remove(userId)
        await load()
    }

    func name(of post: Post) -> String {
        if post.userId == me { return "You" }
        return post.author?.username ?? members[post.userId]?.username ?? "someone"
    }

    func stage(of post: Post) -> String? {
        post.author?.currentStage ?? members[post.userId]?.currentStage
    }
}
