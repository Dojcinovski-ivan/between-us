#if DEBUG
import Foundation

/// Made-up content for the App Store screenshots. Launching a Debug build
/// with `-demo` shows a signed-in circle filled from here: nobody is logged
/// in and nothing is read from or written to the database. Not compiled
/// into Release builds. See BetweenUsUITests/ScreenshotTests.swift.
enum Demo {
    static let isOn = ProcessInfo.processInfo.arguments.contains("-demo")

    private static func id(_ n: Int) -> UUID { UUID(uuidString: "00000000-0000-0000-0000-\(String(format: "%012d", n))")! }
    private static func ago(hours: Double) -> Date { Date().addingTimeInterval(-hours * 3600) }

    static let circle = Circle(id: id(100), category: "finding_way_back", memberCount: 6)

    static let members = [
        Member(id: id(1), username: "quiet_harbor", currentStage: "building_strength"),
        Member(id: id(2), username: "morning_wren", currentStage: nil),
        Member(id: id(3), username: "steady_oak", currentStage: "steadier_ground"),
        Member(id: id(4), username: "gentle_river", currentStage: "building_strength"),
    ]

    static let profile = Profile(
        id: id(1), username: "quiet_harbor", category: circle.category, circleId: circle.id,
        currentStage: "building_strength", bio: nil, lastActiveAt: .now,
        createdAt: ago(hours: 24 * 40), emailMarketingConsent: false, deletedAt: nil
    )

    static let prompt = "What is one small thing you did for yourself this week?"

    static let posts: [Post] = [
        post(10, by: 2, hours: 5, "I said no to something today without explaining myself for ten minutes first. It felt strange. Good strange."),
        post(11, by: 3, hours: 4.6, parent: 10, "That is not a small thing. The explaining was the hardest habit for me to drop."),
        post(12, by: 1, hours: 4.2, parent: 10, "Good strange is exactly it. Proud of you."),
        post(13, by: 4, hours: 3, "Does anyone else find the quiet evenings the hardest part? I keep reaching for my phone to check on someone who is not mine to check on any more."),
        post(14, by: 3, hours: 2.5, parent: 13, "Every evening for the first few months. It does ease. I started walking at that hour instead."),
        post(15, by: 1, hours: 1.2, "Cooked a proper dinner just for me tonight, sat at the table and everything. A year ago I would not have bothered.", promptResponse: true),
        post(16, by: 2, hours: 0.4, parent: 15, "This made me smile. What did you make?"),
    ]

    /// Totals only show on the member's own posts, as in the real feed.
    static let reactionCounts: [UUID: [Reaction: Int]] = [id(15): [.hearYou: 3, .neededThis: 2]]
    static let myReactions: [UUID: Set<Reaction>] = [id(10): [.meToo], id(13): [.notAlone]]

    private static func post(_ n: Int, by member: Int, hours: Double, parent: Int? = nil, _ content: String, promptResponse: Bool = false) -> Post {
        let author = members[member - 1]
        return Post(
            id: id(n), circleId: circle.id, userId: author.id, content: content,
            isPromptResponse: promptResponse, parentId: parent.map(id), createdAt: ago(hours: hours),
            editedAt: nil, author: .init(username: author.username, currentStage: author.currentStage)
        )
    }
}
#endif
