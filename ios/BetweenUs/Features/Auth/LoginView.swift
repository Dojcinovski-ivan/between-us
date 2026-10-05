import SwiftUI
import Supabase

/// Email and password log in, straight against Supabase Auth like the
/// website's LoginForm. SessionStore picks up the new session and moves on.
struct LoginView: View {
    var onCreateAccount: () -> Void

    private enum Field { case email, password }

    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isSubmitting = false
    @State private var failedAttempts = 0
    @FocusState private var focus: Field?

    /// Long enough for a slow connection, short enough that nobody is left
    /// watching a spinner.
    private static let timeout: TimeInterval = 20

    private var canSubmit: Bool {
        email.contains("@") && !password.isEmpty && !isSubmitting
    }

    var body: some View {
        Form {
            Section {
                TextField("Email", text: $email)
                    .textContentType(.username)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .focused($focus, equals: .email)
                    .submitLabel(.next)
                    .onSubmit { focus = .password }

                SecureField("Password", text: $password)
                    .textContentType(.password)
                    .focused($focus, equals: .password)
                    .submitLabel(.go)
                    .onSubmit(submit)
            } header: {
                Text("Good to see you again.")
                    .textCase(nil)
            } footer: {
                if let errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(Theme.danger)
                        .accessibilityLabel("Error: \(errorMessage)")
                }
            }

            Section {
                Button(action: submit) {
                    HStack {
                        Spacer()
                        if isSubmitting {
                            ProgressView()
                                .accessibilityLabel("Logging in")
                        } else {
                            Text("Log In").font(.headline)
                        }
                        Spacer()
                    }
                }
                .disabled(!canSubmit)

                NavigationLink("Forgot password?") {
                    ForgotPasswordView(prefilledEmail: email)
                }
            }

            Section {
                Button("New here? Create an account", action: onCreateAccount)
                    .foregroundStyle(Theme.link)
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.background)
        .navigationTitle("Welcome back")
        .sensoryFeedback(.error, trigger: failedAttempts)
        .onAppear { focus = .email }
    }

    private func submit() {
        guard canSubmit else { return }
        focus = nil
        errorMessage = nil
        isSubmitting = true

        let email = email.trimmingCharacters(in: .whitespaces).lowercased()
        let password = password

        Task {
            defer { isSubmitting = false }
            do {
                _ = try await withTimeout(Self.timeout) {
                    try await supabase.auth.signIn(email: email, password: password)
                }
                // SessionStore hears .signedIn and swaps the whole screen.
            } catch is TimedOut {
                fail("Logging in is taking too long. Check your connection and try again.")
            } catch let error as URLError where error.code == .timedOut {
                fail("Logging in is taking too long. Check your connection and try again.")
            } catch let error as AuthError where error.errorCode == .emailNotConfirmed {
                fail("Please confirm your email first. The link is in your inbox.")
            } catch let error as URLError where error.code == .notConnectedToInternet {
                fail("You're offline. Check your connection and try again.")
            } catch {
                fail("That email or password doesn't look right.")
            }
        }
    }

    private func fail(_ message: String) {
        errorMessage = message
        failedAttempts += 1
        AccessibilityNotification.Announcement(message).post()
    }
}

#Preview {
    NavigationStack {
        LoginView(onCreateAccount: {})
    }
}
