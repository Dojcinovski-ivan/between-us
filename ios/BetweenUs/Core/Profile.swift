import Foundation

/// A row from public.users, the member's profile. The row only exists once
/// onboarding is finished; an auth user without one still needs onboarding.
struct Profile: Codable, Equatable, Identifiable, Sendable {
    let id: UUID
    let username: String
    let category: String
    let circleId: UUID?
    let currentStage: String?
    let bio: String?
    let lastActiveAt: Date?
    let createdAt: Date?
    let emailMarketingConsent: Bool?
    let deletedAt: Date?

    static let columns = "id, username, category, circle_id, current_stage, bio, last_active_at, created_at, email_marketing_consent, deleted_at"

    enum CodingKeys: String, CodingKey {
        case id, username, category, bio
        case circleId = "circle_id"
        case currentStage = "current_stage"
        case lastActiveAt = "last_active_at"
        case createdAt = "created_at"
        case emailMarketingConsent = "email_marketing_consent"
        case deletedAt = "deleted_at"
    }
}
