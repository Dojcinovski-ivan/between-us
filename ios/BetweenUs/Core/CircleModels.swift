import SwiftUI

// Rows and constants for the circle feed. The constants mirror small lists
// in the website's src/lib (reactions.ts, reportReasons.ts, stages.ts,
// categories.ts); keep them in step when those change.

struct Post: Decodable, Identifiable, Equatable, Sendable {
    struct Author: Decodable, Equatable, Sendable {
        let username: String
        let currentStage: String?

        enum CodingKeys: String, CodingKey {
            case username
            case currentStage = "current_stage"
        }
    }

    let id: UUID
    let circleId: UUID
    let userId: UUID
    var content: String
    let isPromptResponse: Bool
    let parentId: UUID?
    let createdAt: Date
    var editedAt: Date?
    /// Present when fetched with `users(username, current_stage)`; realtime
    /// rows come without it and get it filled in from the member list.
    var author: Author?

    static let select = "id, circle_id, user_id, content, is_prompt_response, parent_id, created_at, edited_at, users(username, current_stage)"

    enum CodingKeys: String, CodingKey {
        case id, content
        case circleId = "circle_id"
        case userId = "user_id"
        case isPromptResponse = "is_prompt_response"
        case parentId = "parent_id"
        case createdAt = "created_at"
        case editedAt = "edited_at"
        case author = "users"
    }
}

struct Member: Decodable, Identifiable, Equatable, Sendable {
    let id: UUID
    let username: String
    let currentStage: String?

    enum CodingKeys: String, CodingKey {
        case id, username
        case currentStage = "current_stage"
    }
}

struct Circle: Decodable, Equatable, Sendable {
    let id: UUID
    let category: String
    let memberCount: Int

    enum CodingKeys: String, CodingKey {
        case id, category
        case memberCount = "member_count"
    }

    /// src/lib/categories.ts. Retired slugs fall back to a readable title.
    var name: String {
        let names = [
            "growing_up": "Growing Up Circle",
            "the_caretaker": "The One Who Held It Together Circle",
            "loving_someone": "Loving Someone Who Is Struggling Circle",
            "when_home": "When Home Didn't Feel Safe Circle",
            "invisible_wound": "When It Was Never Said Out Loud Circle",
            "leaving_feels_impossible": "When Leaving Feels Impossible Circle",
            "finding_way_back": "Finding My Way Back Circle",
            "understanding_patterns": "Understanding My Patterns Circle",
        ]
        return names[category] ?? category.split(separator: "_").map(\.capitalized).joined(separator: " ") + " Circle"
    }
}

enum Reaction: String, CaseIterable, Identifiable, Sendable {
    case hearYou = "hear_you"
    case meToo = "me_too"
    case notAlone = "not_alone"
    case neededThis = "needed_this"

    var id: String { rawValue }

    var emoji: String {
        switch self {
        case .hearYou: "🤍"
        case .meToo: "🤝"
        case .notAlone: "💪"
        case .neededThis: "🙏"
        }
    }

    var label: String {
        switch self {
        case .hearYou: "I hear you"
        case .meToo: "Me too"
        case .notAlone: "You're not alone"
        case .neededThis: "I needed this"
        }
    }
}

enum ReportReason: String, CaseIterable, Identifiable {
    case spam = "Spam"
    case harassment = "Harassment"
    case crisis = "Crisis or self-harm content"
    case other = "Something else"

    var id: String { rawValue }
}

/// src/lib/stages.ts: a quiet coloured dot next to each username.
enum Stage {
    static func label(_ slug: String?) -> String {
        switch slug {
        case "building_strength": "Building Strength"
        case "steadier_ground": "Steadier Ground"
        case "thriving": "Thriving"
        default: "Finding My Footing"
        }
    }

    static func color(_ slug: String?) -> Color {
        switch slug {
        case "building_strength": Color(light: 0x8FA68E, dark: 0x8FA68E)
        case "steadier_ground": Color(light: 0xC9A24B, dark: 0xC9A24B)
        case "thriving": Color(light: 0x9A4A30, dark: 0xC46A4E)
        default: Color(light: 0xA8A29E, dark: 0xA8A29E)
        }
    }
}
