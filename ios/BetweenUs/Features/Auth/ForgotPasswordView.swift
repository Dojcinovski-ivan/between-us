import SwiftUI

/// Asks the website to send its own reset email. The link in that email
/// opens the website's /reset-password page, which is where the new
/// password is chosen; the app is then used with it as normal.
struct ForgotPasswordView: View {
    @State private var email: String
    @State private var isSubmitting = false
    @State private var sentTo: String?
    @State private var errorMessage: String?
    @FocusState private var emailFocused: Bool

    init(prefilledEmail: String = "") {
        _email = State(initialValue: prefilledEmail)
    }

    var body: some View {
        Form {
            if let sentTo {
                Section {
                    Label {
                        Text("If an account exists for \(sentTo), we sent a link to reset your password. It can take a minute to arrive.")
                    } icon: {
                        Image(systemName: "envelope.badge")
                            .foregroundStyle(Theme.accent)
                    }
                } header: {
                    Text("Check your email").textCase(nil)
                }
            } else {
                Section {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .focused($emailFocused)
                        .submitLabel(.send)
                        .onSubmit(submit)
                } header: {
                    Text("Enter the email you signed up with and we'll send you a link.")
                        .textCase(nil)
                } footer: {
                    if let errorMessage {
                        Text(errorMessage).foregroundStyle(Theme.danger)
                    }
                }

                Section {
                    Button(action: submit) {
                        HStack {
                            Spacer()
                            if isSubmitting {
                                ProgressView().accessibilityLabel("Sending")
                            } else {
                                Text("Send Reset Link").font(.headline)
                            }
                            Spacer()
                        }
                    }
                    .disabled(!email.contains("@") || isSubmitting)
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(Theme.background)
        .navigationTitle("Reset password")
        .navigationBarTitleDisplayMode(.inline)
        .sensoryFeedback(.success, trigger: sentTo)
        .onAppear { emailFocused = sentTo == nil }
    }

    private struct ResetRequest: Encodable { let email: String }

    private func submit() {
        let address = email.trimmingCharacters(in: .whitespaces).lowercased()
        guard address.contains("@"), !isSubmitting else { return }
        errorMessage = nil
        isSubmitting = true

        Task {
            defer { isSubmitting = false }
            do {
                try await MobileAPI.post("api/mobile/forgot-password", body: ResetRequest(email: address))
                sentTo = address
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

#Preview {
    NavigationStack { ForgotPasswordView() }
}
