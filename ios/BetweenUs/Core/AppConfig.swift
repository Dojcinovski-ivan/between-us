import Foundation

/// Values injected at build time from ios/Config/*.xcconfig through Info.plist,
/// so no key or URL is hard-coded in Swift.
enum AppConfig {
    static let supabaseURL = url(for: "SupabaseURL")
    static let supabaseAnonKey = string(for: "SupabaseAnonKey")
    static let apiBaseURL = url(for: "APIBaseURL")

    private static func string(for key: String) -> String {
        guard let value = Bundle.main.object(forInfoDictionaryKey: key) as? String,
              !value.isEmpty, !value.contains("$(") else {
            fatalError("\(key) is not set. Copy ios/Config/Secrets.example.xcconfig to Secrets.xcconfig and fill it in.")
        }
        return value
    }

    private static func url(for key: String) -> URL {
        guard let url = URL(string: string(for: key)) else {
            fatalError("\(key) is not a valid URL.")
        }
        return url
    }
}
