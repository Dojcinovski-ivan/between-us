import SwiftUI

/// The text field pinned above the keyboard. Grows to six lines, then
/// scrolls. Used by the feed and, later, by threads.
struct ComposerBar: View {
    @Binding var text: String
    var placeholder = "Share something with your circle…"
    var isPromptResponse = false
    var onClearPromptResponse: () -> Void = {}
    var focus: FocusState<Bool>.Binding
    var onSend: (String) async -> Bool

    @State private var isSending = false
    @State private var sentCount = 0

    private var trimmed: String { text.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var remaining: Int { CircleStore.maxLength - text.count }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if isPromptResponse {
                HStack(spacing: 4) {
                    Text("Responding to this week's prompt")
                    Button("Cancel prompt response", systemImage: "xmark.circle.fill", action: onClearPromptResponse)
                        .labelStyle(.iconOnly)
                }
                .font(.caption)
                .foregroundStyle(Theme.muted)
            }

            HStack(alignment: .bottom, spacing: 8) {
                TextField(placeholder, text: $text, axis: .vertical)
                    .lineLimit(1...6)
                    .focused(focus)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(Theme.surface, in: RoundedRectangle(cornerRadius: 20))
                    .overlay(RoundedRectangle(cornerRadius: 20).strokeBorder(Theme.border))
                    .onChange(of: text) { _, new in
                        if new.count > CircleStore.maxLength { text = String(new.prefix(CircleStore.maxLength)) }
                    }

                Button {
                    send()
                } label: {
                    if isSending {
                        ProgressView().frame(width: 34, height: 34)
                    } else {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 34))
                            .foregroundStyle(trimmed.isEmpty ? Theme.border : Theme.accent)
                    }
                }
                .disabled(trimmed.isEmpty || isSending)
                .accessibilityLabel("Send")
            }

            if remaining < 100 {
                Text("\(remaining) characters left")
                    .font(.caption2)
                    .foregroundStyle(remaining < 20 ? Theme.danger : Theme.muted)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.bar)
        .sensoryFeedback(.success, trigger: sentCount)
    }

    private func send() {
        let content = trimmed
        guard !content.isEmpty, !isSending else { return }
        isSending = true
        Task {
            if await onSend(content) {
                text = ""
                sentCount += 1
            }
            isSending = false
        }
    }
}
