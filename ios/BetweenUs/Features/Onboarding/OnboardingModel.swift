import Foundation
import Observation

/// The option lists, served by GET /api/mobile/onboarding from the same
/// constants the website uses, so the app never has its own copy.
struct OnboardingOptions: Decodable, Sendable {
    struct Option: Decodable, Hashable, Identifiable, Sendable {
        let slug: String
        let label: String
        var id: String { slug }
    }

    struct NameParts: Decodable, Sendable {
        let adjectives: [String]
        let nouns: [String]
    }

    let feltExperiences: [Option]
    let whoWasIt: [Option]
    let mechanisms: [Option]
    let journeyStages: [Option]
    let ageRanges: [Option]
    let genders: [Option]
    let countries: [String]
    let nameParts: NameParts

    /// Same shape as the website's suggestAnonymousName: quiet_river42.
    func suggestName() -> String {
        let adjective = nameParts.adjectives.randomElement() ?? "quiet"
        let noun = nameParts.nouns.randomElement() ?? "river"
        return "\(adjective)_\(noun)\(Int.random(in: 10...99))"
    }
}

/// Answers collected across the onboarding screens, and the final submit.
@MainActor
@Observable
final class OnboardingModel {
    enum Loading {
        case loading
        case loaded(OnboardingOptions)
        case failed(String)
    }

    private(set) var loading: Loading = .loading

    var sensitiveConsent = false
    var feltExperience: String?
    var whoWasIt: String?
    var mechanisms: Set<String> = []
    var journeyStage: String?
    var ageRange: String?
    var gender: String?
    var country: String?
    var username = ""

    private(set) var isSubmitting = false
    private(set) var errorMessage: String?
    private(set) var failedAttempts = 0

    func load() async {
        loading = .loading
        do {
            let options = try await MobileAPI.get("api/mobile/onboarding", as: OnboardingOptions.self, authenticated: true)
            if username.isEmpty { username = options.suggestName() }
            loading = .loaded(options)
        } catch {
            loading = .failed(error.localizedDescription)
        }
    }

    private struct Request: Encodable {
        let username, feltExperience, whoWasIt: String
        let mechanisms: [String]
        let journeyStage, ageRange, gender, country: String
        let sensitiveConsent: Bool
    }

    private struct Response: Decodable {
        let ok: Bool
        let error: String?
        let alreadyOnboarded: Bool?
    }

    /// Returns true once the profile exists, so the caller can reload the session.
    func submit() async -> Bool {
        guard let feltExperience, let whoWasIt, !mechanisms.isEmpty, let journeyStage,
              let ageRange, let gender, let country else {
            fail("Something is missing. Please go back and check your answers.")
            return false
        }

        errorMessage = nil
        isSubmitting = true
        defer { isSubmitting = false }

        let request = Request(
            username: username.trimmingCharacters(in: .whitespaces),
            feltExperience: feltExperience,
            whoWasIt: whoWasIt,
            mechanisms: mechanisms.sorted(),
            journeyStage: journeyStage,
            ageRange: ageRange,
            gender: gender,
            country: country,
            sensitiveConsent: sensitiveConsent
        )

        do {
            let data = try await MobileAPI.post("api/mobile/onboarding", body: request, authenticated: true)
            let response = try JSONDecoder().decode(Response.self, from: data)
            if response.ok || response.alreadyOnboarded == true { return true }
            fail(response.error ?? "Something went wrong. Please try again.")
        } catch {
            fail(error.localizedDescription)
        }
        return false
    }

    private func fail(_ message: String) {
        errorMessage = message
        failedAttempts += 1
    }
}
