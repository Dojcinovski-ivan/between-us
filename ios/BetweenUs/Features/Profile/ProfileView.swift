import SwiftUI
import UniformTypeIdentifiers

/// The member's own profile, like the website's /profile: bio, email
/// preferences, blocked members, their data, and deleting the account.
struct ProfileView: View {
    let profile: Profile
    let store: CircleStore

    @Environment(SessionStore.self) private var session

    @State private var bio: String
    @State private var savedBio: String
    @State private var isSavingBio = false
    @State private var emailConsent: Bool
    @State private var loadingConsent = false
    @State private var isExporting = false
    @State private var exportDocument: JSONDocument?
    @State private var showDelete = false
    @State private var errorMessage: String?
    @State private var saved = 0
    @FocusState private var bioFocused: Bool

    private static let bioLimit = 200

    init(profile: Profile, store: CircleStore) {
        self.profile = profile
        self.store = store
        _bio = State(initialValue: profile.bio ?? "")
        _savedBio = State(initialValue: profile.bio ?? "")
        _emailConsent = State(initialValue: profile.emailMarketingConsent ?? false)
    }

    var body: some View {
        Form {
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text(profile.username)
                        .font(.serif(.title2))
                        .foregroundStyle(Theme.ink)
                    if let joined = profile.createdAt {
                        Text("Member since \(joined.formatted(.dateTime.month(.wide).year()))")
                            .font(.subheadline)
                            .foregroundStyle(Theme.muted)
                    }
                }
                .padding(.vertical, 4)
                LabeledContent("Circle", value: store.circle?.name ?? "")
                LabeledContent("Stage") {
                    HStack(spacing: 6) {
                        SwiftUI.Circle().fill(Stage.color(profile.currentStage)).frame(width: 8, height: 8)
                            .accessibilityHidden(true)
                        Text(Stage.label(profile.currentStage))
                    }
                }
            }

            Section {
                TextField("Share as much or as little as you'd like.", text: $bio, axis: .vertical)
                    .lineLimit(3...)
                    .focused($bioFocused)
                    .onChange(of: bio) { _, new in
                        if new.count > Self.bioLimit { bio = String(new.prefix(Self.bioLimit)) }
                    }
                if bio != savedBio {
                    Button {
                        saveBio()
                    } label: {
                        if isSavingBio { ProgressView() } else { Text("Save") }
                    }
                    .disabled(isSavingBio)
                }
            } header: {
                Text("About")
            } footer: {
                Text("\(bio.count)/\(Self.bioLimit)")
            }

            Section {
                Toggle("Circle updates and news by email", isOn: $emailConsent)
                    .onChange(of: emailConsent) { _, on in
                        if loadingConsent { loadingConsent = false } else { saveConsent(on) }
                    }
            } header: {
                Text("Email preferences")
            } footer: {
                Text("Optional. Includes emails when someone mentions you. You can change this at any time.")
            }

            Section {
                NavigationLink("Blocked members") {
                    BlockedMembersView(store: store)
                }
            } footer: {
                Text("People you block can't see that you did.")
            }

            Section {
                Button {
                    export()
                } label: {
                    HStack {
                        Label("Download my data", systemImage: "square.and.arrow.down")
                        Spacer()
                        if isExporting { ProgressView() }
                    }
                }
                .disabled(isExporting)
            } header: {
                Text("Your data")
            } footer: {
                Text("Everything Between Us holds about you, as a file you can keep or take elsewhere.")
            }

            Section {
                Button("Log Out") { Task { await session.signOut() } }
                Button("Delete My Account", role: .destructive) { showDelete = true }
            }

            Section {
                Link("Privacy Policy", destination: URL(string: "https://betweenussupport.com/privacy")!)
                Link("Terms of Service", destination: URL(string: "https://betweenussupport.com/terms")!)
                Link("Community Guidelines", destination: URL(string: "https://betweenussupport.com/guidelines")!)
            }
            .foregroundStyle(Theme.link)
        }
        .scrollContentBackground(.hidden)
        .background(Theme.background)
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .sensoryFeedback(.success, trigger: saved)
        .task { await refresh() }
        .sheet(isPresented: $showDelete) {
            DeleteAccountView()
        }
        .fileExporter(
            isPresented: Binding(get: { exportDocument != nil }, set: { if !$0 { exportDocument = nil } }),
            document: exportDocument,
            contentType: .json,
            defaultFilename: "between-us-data"
        ) { _ in }
        .alert("Something went wrong", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "")
        }
    }

    private struct Editable: Decodable {
        let bio: String?
        let emailMarketingConsent: Bool?
        enum CodingKeys: String, CodingKey {
            case bio
            case emailMarketingConsent = "email_marketing_consent"
        }
    }

    /// The profile passed in is from login time; edits made since (here or
    /// on the website) would otherwise show stale.
    private func refresh() async {
        guard let fresh: Editable = try? await supabase.from("users")
            .select("bio, email_marketing_consent")
            .eq("id", value: profile.id)
            .single()
            .execute().value else { return }
        if bio == savedBio { bio = fresh.bio ?? "" }
        savedBio = fresh.bio ?? ""
        if emailConsent != (fresh.emailMarketingConsent ?? false) {
            loadingConsent = true
            emailConsent = fresh.emailMarketingConsent ?? false
        }
    }

    private func saveBio() {
        let text = bio.trimmingCharacters(in: .whitespacesAndNewlines)
        isSavingBio = true
        Task {
            do {
                try await supabase.from("users")
                    .update(["bio": text.isEmpty ? nil : text])
                    .eq("id", value: profile.id)
                    .execute()
                bio = text
                savedBio = text
                bioFocused = false
                saved += 1
            } catch {
                errorMessage = "Your bio didn't save. Please try again."
            }
            isSavingBio = false
        }
    }

    private struct ConsentUpdate: Encodable {
        let email_marketing_consent: Bool
        let email_marketing_consent_date: String?
    }

    private func saveConsent(_ on: Bool) {
        Task {
            do {
                try await supabase.from("users")
                    .update(ConsentUpdate(email_marketing_consent: on, email_marketing_consent_date: on ? Date().ISO8601Format() : nil))
                    .eq("id", value: profile.id)
                    .execute()
                saved += 1
            } catch {
                errorMessage = "Your email preference didn't save. Please try again."
            }
        }
    }

    private func export() {
        isExporting = true
        Task {
            do {
                var request = URLRequest(url: AppConfig.apiBaseURL.appending(path: "api/mobile/account/export"))
                let session = try await supabase.auth.session
                request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
                let (data, response) = try await URLSession.shared.data(for: request)
                guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw MobileAPI.APIError.server(status: 0) }
                exportDocument = JSONDocument(data: data)
            } catch {
                errorMessage = "We couldn't prepare your data just now. Please try again."
            }
            isExporting = false
        }
    }
}

struct JSONDocument: FileDocument {
    static let readableContentTypes: [UTType] = [.json]
    let data: Data

    init(data: Data) { self.data = data }
    init(configuration: ReadConfiguration) throws {
        data = configuration.file.regularFileContents ?? Data()
    }

    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: data)
    }
}

// MARK: - Blocked members

private struct BlockedMembersView: View {
    let store: CircleStore

    @State private var members: [CircleStore.BlockedMember]?
    @State private var failed = false
    @State private var unblocked = 0

    var body: some View {
        Group {
            if let members, members.isEmpty {
                ContentUnavailableView("No one blocked", systemImage: "hand.raised",
                                       description: Text("Block someone from the menu on any of their posts."))
            } else if let members {
                List {
                    ForEach(members) { member in
                        HStack {
                            Text(member.username)
                            Spacer()
                            Button("Unblock") { unblock(member) }
                                .buttonStyle(.bordered)
                                .accessibilityLabel("Unblock \(member.username)")
                        }
                    }
                }
                .scrollContentBackground(.hidden)
            } else if failed {
                ContentUnavailableView {
                    Label("Can't load", systemImage: "wifi.exclamationmark")
                } actions: {
                    Button("Try Again") { Task { await load() } }
                }
            } else {
                ProgressView()
            }
        }
        .background(Theme.background)
        .navigationTitle("Blocked members")
        .navigationBarTitleDisplayMode(.inline)
        .sensoryFeedback(.success, trigger: unblocked)
        .task { await load() }
    }

    private func load() async {
        failed = false
        do {
            members = try await store.blockedMembers()
        } catch {
            failed = true
        }
    }

    private func unblock(_ member: CircleStore.BlockedMember) {
        Task {
            do {
                try await store.unblock(member.blockedId)
                members?.removeAll { $0.id == member.id }
                unblocked += 1
            } catch {
                failed = true
            }
        }
    }
}

// MARK: - Delete account

/// Required in-app by the App Store. Same wording and the same typed
/// DELETE confirmation as the website.
private struct DeleteAccountView: View {
    @Environment(SessionStore.self) private var session
    @Environment(\.dismiss) private var dismiss

    @State private var confirmText = ""
    @State private var isDeleting = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("This removes your email address, your name here, and everything you told us about your experiences. It cannot be undone.")
                    Text("The posts you wrote stay in your circle, shown as coming from a former member, because they are part of conversations other people were in.")
                        .foregroundStyle(Theme.muted)
                }

                Section {
                    TextField("DELETE", text: $confirmText)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .accessibilityLabel("Type DELETE to confirm")
                } header: {
                    Text("Type DELETE to confirm").textCase(nil)
                } footer: {
                    if let errorMessage { Text(errorMessage).foregroundStyle(Theme.danger) }
                }

                Section {
                    Button(role: .destructive) {
                        delete()
                    } label: {
                        HStack {
                            Spacer()
                            if isDeleting {
                                ProgressView().accessibilityLabel("Deleting")
                            } else {
                                Text("Delete My Account").font(.headline)
                            }
                            Spacer()
                        }
                    }
                    .disabled(confirmText != "DELETE" || isDeleting)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Theme.background)
            .navigationTitle("Delete account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .interactiveDismissDisabled(isDeleting)
        }
    }

    private struct Result: Decodable { let ok: Bool; let error: String? }

    private func delete() {
        isDeleting = true
        errorMessage = nil
        Task {
            do {
                let data = try await MobileAPI.post("api/mobile/account/delete", body: [String: String](), authenticated: true)
                let result = try JSONDecoder().decode(Result.self, from: data)
                guard result.ok else { throw MobileAPI.APIError.server(status: 0) }
                dismiss()
                await session.signOut()
            } catch {
                errorMessage = "We could not delete your account just now. Please try again."
                isDeleting = false
            }
        }
    }
}
