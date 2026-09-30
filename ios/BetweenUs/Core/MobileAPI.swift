import Foundation

/// Calls the website's /api/mobile/* routes, for the steps that need the
/// service role key and so can't run from the app (sign-up, onboarding,
/// password reset emails and so on).
enum MobileAPI {
    enum APIError: LocalizedError {
        case server(status: Int)
        case rateLimited
        case network

        var errorDescription: String? {
            switch self {
            case .rateLimited: "Too many attempts from here. Please wait a while and try again."
            case .server: "Something went wrong on our side. Please try again."
            case .network: "We couldn't reach Between Us. Check your connection and try again."
            }
        }
    }

    /// POSTs `body` as JSON. When `authenticated` is true, the current
    /// Supabase access token goes along so the server can verify who is asking.
    @discardableResult
    static func post(_ path: String, body: some Encodable, authenticated: Bool = false) async throws -> Data {
        var request = URLRequest(url: AppConfig.apiBaseURL.appending(path: path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
        return try await send(request, authenticated: authenticated)
    }

    /// GETs `path` and decodes the JSON response.
    static func get<Response: Decodable>(_ path: String, as type: Response.Type, authenticated: Bool = false) async throws -> Response {
        let request = URLRequest(url: AppConfig.apiBaseURL.appending(path: path))
        let data = try await send(request, authenticated: authenticated)
        return try JSONDecoder().decode(Response.self, from: data)
    }

    private static func send(_ request: URLRequest, authenticated: Bool) async throws -> Data {
        var request = request
        if authenticated {
            let session = try await supabase.auth.session
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw APIError.network
        }

        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        if status == 429 { throw APIError.rateLimited }
        guard (200..<300).contains(status) else { throw APIError.server(status: status) }
        return data
    }
}
