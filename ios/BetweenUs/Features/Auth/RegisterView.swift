import SwiftUI

/// Account creation through /api/mobile/register, which shares its logic
/// and rate limits with the website's register form. The account stays
/// unconfirmed until the emailed link is opened; after that they log in.
struct RegisterView: View {
    var onLogIn: () -> Void

    private enum Field { case email, password, confirm }

    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    // Starts on today and has to be changed, so nobody passes the age check
    // by leaving a pre-filled adult birthday in place.
    @State private var dateOfBirth = Date()
    @State private var dateOfBirthSet = false
    @State private var marketingConsent = false

    @State private var isSubmitting = false
    @State private var problem: Problem?
    @State private var sentTo: String?
    @State private var failedAttempts = 0
    @FocusState private var focus: Field?

    private static let minimumAge = 18

    var body: some View {
        if let sentTo {
            CheckEmailView(email: sentTo, onLogIn: onLogIn)
        } else {
            form
        }
    }

    private var form: some View {
        Form {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Between Us is a peer support community, not therapy.")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.ink)
                    Text("You will be talking with people who have lived through similar things, not with therapists or counsellors. If you are in crisis or in danger right now, please contact your local emergency services.")
                        .font(.footnote)
                        .foregroundStyle(Theme.muted)
                    Link("Find a free helpline at findahelpline.com", destination: CrisisLink.url)
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Theme.link)
                }
                .padding(.vertical, 4)
            }

            Section {
                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .focused($focus, equals: .email)
                    .submitLabel(.next)
                    .onSubmit { focus = .password }

                SecureField("Password", text: $password)
                    .textContentType(.newPassword)
                    .focused($focus, equals: .password)
                    .submitLabel(.next)
                    .onSubmit { focus = .confirm }

                SecureField("Confirm password", text: $confirmPassword)
                    .textContentType(.newPassword)
                    .focused($focus, equals: .confirm)
                    .submitLabel(.done)
                    .onSubmit { focus = nil }
            } header: {
                Text("Your email stays private. You'll pick an anonymous username next.")
                    .textCase(nil)
            } footer: {
                Text("At least 8 characters.")
            }

            Section {
                DatePicker("Date of birth", selection: $dateOfBirth, in: ...Date(), displayedComponents: .date)
                    .onChange(of: dateOfBirth) { dateOfBirthSet = true }
            } footer: {
                Text("Between Us is for adults. We check your age and then discard the date, so your birthday is never stored.")
            }

            Section {
                Toggle("Email me circle updates and news (optional)", isOn: $marketingConsent)
            } footer: {
                Text("You can unsubscribe at any time from your profile.")
            }

            if let problem {
                Section {
                    ProblemView(problem: problem, onLogIn: onLogIn)
                }
            }

            Section {
                Button(action: submit) {
                    HStack {
                        Spacer()
                        if isSubmitting {
                            ProgressView().accessibilityLabel("Creating account")
                        } else {
                            Text("Create Account").font(.headline)
                        }
                        Spacer()
                    }
                }
                .disabled(isSubmitting)
            } footer: {
                Text("By creating an account you agree to our [Terms of Service](https://betweenussupport.com/terms). Our [Privacy Policy](https://betweenussupport.com/privacy) explains what we collect and why.")
                    .tint(Theme.link)
            }

            Section {
                Button("Already have an account? Log in", action: onLogIn)
                    .foregroundStyle(Theme.link)
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.background)
        .navigationTitle("Create account")
        .sensoryFeedback(.error, trigger: failedAttempts)
    }

    // MARK: - Submitting

    private struct RegisterRequest: Encodable {
        struct DateOfBirth: Encodable { let day, month, year: Int }
        let email: String
        let password: String
        let marketingConsent: Bool
        let dateOfBirth: DateOfBirth
    }

    private struct RegisterResponse: Decodable { let status: String }

    private func submit() {
        focus = nil
        let address = email.trimmingCharacters(in: .whitespaces).lowercased()

        // Same order as the website: age first, so someone too young is
        // turned away before they invest anything else in the form.
        guard dateOfBirthSet else { return fail(.message("Please enter your date of birth.")) }
        let parts = Calendar(identifier: .gregorian).dateComponents([.day, .month, .year], from: dateOfBirth)
        guard let age = Calendar(identifier: .gregorian).dateComponents([.year], from: dateOfBirth, to: .now).year,
              age >= Self.minimumAge,
              let day = parts.day, let month = parts.month, let year = parts.year else {
            return fail(.underage)
        }
        guard address.contains("@") else { return fail(.message("Please enter your email address.")) }
        guard password.count >= 8 else { return fail(.message("Your password needs to be at least 8 characters.")) }
        guard password == confirmPassword else { return fail(.message("Those passwords don't match.")) }

        problem = nil
        isSubmitting = true

        let request = RegisterRequest(
            email: address,
            password: password,
            marketingConsent: marketingConsent,
            dateOfBirth: .init(day: day, month: month, year: year)
        )

        Task {
            defer { isSubmitting = false }
            do {
                let data = try await MobileAPI.post("api/mobile/register", body: request)
                let response = try JSONDecoder().decode(RegisterResponse.self, from: data)
                switch response.status {
                case "sent": sentTo = address
                case "exists": fail(.exists)
                case "underage": fail(.underage)
                default: fail(.message("We couldn't create your account just now. Please try again in a moment."))
                }
            } catch MobileAPI.APIError.server {
                fail(.message("We couldn't create your account just now. Please try again in a moment."))
            } catch {
                fail(.message(error.localizedDescription))
            }
        }
    }

    private func fail(_ problem: Problem) {
        self.problem = problem
        failedAttempts += 1
        AccessibilityNotification.Announcement(problem.announcement).post()
    }
}

// MARK: - Problems

private enum Problem: Equatable {
    case message(String)
    case exists
    case underage

    var announcement: String {
        switch self {
        case .message(let text): text
        case .exists: "There's already an account with that email."
        case .underage: "Between Us is for adults, so you need to be 18 or over to join."
        }
    }
}

private struct ProblemView: View {
    let problem: Problem
    var onLogIn: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            switch problem {
            case .message(let text):
                Text(text).foregroundStyle(Theme.danger)
            case .exists:
                Text("There's already an account with that email.")
                    .foregroundStyle(Theme.danger)
                Button("Log in instead", action: onLogIn)
                    .foregroundStyle(Theme.link)
            case .underage:
                Text("Between Us is for adults, so you need to be 18 or over to join.")
                    .foregroundStyle(Theme.danger)
                Text("If you are going through something and need support right now, findahelpline.com lists free confidential helplines in your country, including ones for young people.")
                    .font(.footnote)
                    .foregroundStyle(Theme.muted)
                Link("Open findahelpline.com", destination: CrisisLink.url)
                    .foregroundStyle(Theme.link)
            }
        }
        .buttonStyle(.borderless)
        .padding(.vertical, 4)
    }
}

// MARK: - Sent

private struct CheckEmailView: View {
    let email: String
    var onLogIn: () -> Void

    var body: some View {
        ContentUnavailableView {
            Label("Check your email", systemImage: "envelope.badge")
        } description: {
            Text("We sent a confirmation link to \(email). Tap it to confirm your account, then come back here and log in.")
        } actions: {
            Button("Log In", action: onLogIn)
                .buttonStyle(.borderedProminent)
        }
        .background(Theme.background)
        .navigationTitle("Create account")
        .navigationBarTitleDisplayMode(.inline)
        .sensoryFeedback(.success, trigger: email)
    }
}

#Preview {
    NavigationStack { RegisterView(onLogIn: {}) }
}
