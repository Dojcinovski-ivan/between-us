import SwiftUI

/// Shown while the member is alone in their circle. They can leave one
/// private message; the server publishes it as their first post the moment
/// a second member joins, and this screen then turns into the feed.
struct WaitingRoomView: View {
    let store: CircleStore

    @State private var text = ""
    @State private var isEditing = false
    @State private var dismissed = false
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var savedCount = 0
    @State private var confirmDelete = false
    @FocusState private var focused: Bool

    private var trimmed: String { text.trimmingCharacters(in: .whitespacesAndNewlines) }

    var body: some View {
        Form {
            Section {
                VStack(spacing: 12) {
                    Image(systemName: "person.2.circle")
                        .font(.system(size: 44))
                        .foregroundStyle(Theme.sage)
                        .accessibilityHidden(true)
                    Text("You are the first one here.")
                        .font(.serif(.title2))
                        .foregroundStyle(Theme.ink)
                        .multilineTextAlignment(.center)
                        .accessibilityAddTraits(.isHeader)
                    Text("Your circle is forming. Others who understand what you have been through are finding their way here. You will not be waiting alone.")
                        .font(.subheadline)
                        .foregroundStyle(Theme.muted)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
            }
            .listRowBackground(Color.clear)

            if let draft = store.draft, !isEditing {
                savedDraft(draft)
            } else if !dismissed {
                compose
            }
        }
        .scrollContentBackground(.hidden)
        .sensoryFeedback(.success, trigger: savedCount)
        .confirmationDialog("Delete your message?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Delete", role: .destructive) {
                Task {
                    do { try await store.deleteDraft() } catch { errorMessage = "That didn't delete. Please try again." }
                }
            }
        }
        .task { await store.listenForMembers() }
    }

    private func savedDraft(_ draft: CircleStore.Draft) -> some View {
        Section {
            Text(draft.content)
                .foregroundStyle(Theme.ink)
            Button("Edit", systemImage: "pencil") {
                text = draft.content
                isEditing = true
                focused = true
            }
            Button("Delete", systemImage: "trash", role: .destructive) {
                confirmDelete = true
            }
        } header: {
            VStack(alignment: .leading, spacing: 4) {
                Text("Your words are ready.")
                    .font(.headline)
                    .foregroundStyle(Theme.ink)
                Text("When someone joins your circle your message will be there waiting for them. Thank you for being the first.")
                    .font(.subheadline)
                    .foregroundStyle(Theme.muted)
            }
            .textCase(nil)
            .padding(.bottom, 4)
        } footer: {
            if let errorMessage { Text(errorMessage).foregroundStyle(Theme.danger) }
        }
    }

    private var compose: some View {
        Section {
            TextField("Share whatever feels right. There are no wrong words here.", text: $text, axis: .vertical)
                .lineLimit(5...)
                .focused($focused)
                .onChange(of: text) { _, new in
                    if new.count > CircleStore.maxLength { text = String(new.prefix(CircleStore.maxLength)) }
                }

            Button {
                save()
            } label: {
                HStack {
                    Spacer()
                    if isSaving {
                        ProgressView().accessibilityLabel("Saving")
                    } else {
                        Text("Save for My Circle").font(.headline)
                    }
                    Spacer()
                }
            }
            .disabled(trimmed.isEmpty || isSaving)

            Button(isEditing ? "Cancel" : "Maybe Later") {
                if isEditing { isEditing = false } else { dismissed = true }
                focused = false
            }
            .foregroundStyle(Theme.muted)
        } header: {
            VStack(alignment: .leading, spacing: 4) {
                Text("Would you like to share something while you wait?")
                    .font(.headline)
                    .foregroundStyle(Theme.ink)
                Text("Your words will be the first thing your circle sees when they arrive. Even one sentence can mean everything to someone who finally feels understood.")
                    .font(.subheadline)
                    .foregroundStyle(Theme.muted)
            }
            .textCase(nil)
            .padding(.bottom, 4)
        } footer: {
            if let errorMessage {
                Text(errorMessage).foregroundStyle(Theme.danger)
            } else {
                Text("\(text.count)/\(CircleStore.maxLength) · Only you can see this until someone joins.")
            }
        }
    }

    private func save() {
        errorMessage = nil
        isSaving = true
        Task {
            do {
                try await store.saveDraft(trimmed)
                text = ""
                isEditing = false
                focused = false
                savedCount += 1
            } catch {
                errorMessage = "That didn't save. Please check your connection and try again."
            }
            isSaving = false
        }
    }
}
