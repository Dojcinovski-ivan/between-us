import SwiftUI

/// The website's onboarding wizard as a native navigation flow: a consent
/// screen, seven questions, then the anonymous name. Back is the normal
/// back button and swipe.
struct OnboardingView: View {
    enum Step: Int, Hashable, CaseIterable {
        case feltExperience = 1, whoWasIt, mechanisms, journeyStage, ageRange, gender, country, username
    }

    @State private var model = OnboardingModel()
    @State private var path: [Step] = []
    @Environment(SessionStore.self) private var session

    var body: some View {
        NavigationStack(path: $path) {
            Group {
                switch model.loading {
                case .loading:
                    ProgressView()
                        .accessibilityLabel("Loading")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                case .failed(let message):
                    ContentUnavailableView {
                        Label("Can't load the questions", systemImage: "wifi.exclamationmark")
                    } description: {
                        Text(message)
                    } actions: {
                        Button("Try Again") { Task { await model.load() } }
                            .buttonStyle(.borderedProminent)
                    }
                case .loaded:
                    ConsentScreen(model: model) { path.append(.feltExperience) }
                }
            }
            .background(Theme.background)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Log Out") { Task { await session.signOut() } }
                }
            }
            .navigationDestination(for: Step.self) { step in
                if case .loaded(let options) = model.loading {
                    screen(for: step, options: options)
                        .background(Theme.background)
                        .toolbar {
                            ToolbarItem(placement: .principal) {
                                ProgressView(value: Double(step.rawValue), total: Double(Step.allCases.count))
                                    .frame(width: 120)
                                    .accessibilityLabel("Step \(step.rawValue) of \(Step.allCases.count)")
                            }
                        }
                }
            }
        }
        .task { await model.load() }
    }

    private func advance(from step: Step) {
        if let next = Step(rawValue: step.rawValue + 1) { path.append(next) }
    }

    @ViewBuilder
    private func screen(for step: Step, options: OnboardingOptions) -> some View {
        switch step {
        case .feltExperience:
            SingleChoiceScreen(
                heading: "Which of these feels closest to where you are right now?",
                subtext: "Choose the one that resonates most. You can always explore more later.",
                warmNote: "Whatever you choose, you will find understanding here.",
                options: options.feltExperiences,
                selection: $model.feltExperience
            ) { advance(from: step) }
        case .whoWasIt:
            SingleChoiceScreen(
                heading: "Who is this mostly about?",
                subtext: "This helps us find people who truly understand your experience.",
                warmNote: "There is no right answer. Just what feels truest.",
                options: options.whoWasIt,
                selection: $model.whoWasIt
            ) { advance(from: step) }
        case .mechanisms:
            MultiChoiceScreen(
                heading: "What was it like? Choose everything that fits.",
                subtext: "You can select more than one.",
                warmNote: "Your experience is valid whatever it looked like.",
                options: options.mechanisms,
                selection: $model.mechanisms
            ) { advance(from: step) }
        case .journeyStage:
            SingleChoiceScreen(
                heading: "How long have you been carrying this?",
                subtext: "This helps us connect you with people at a similar point in their journey.",
                warmNote: "Wherever you are is exactly where you need to be.",
                options: options.journeyStages,
                selection: $model.journeyStage
            ) { advance(from: step) }
        case .ageRange:
            SingleChoiceScreen(
                heading: "How old are you?",
                subtext: "We use this to connect you with people at a similar stage of life. It is never shown to other members.",
                warmNote: nil,
                options: options.ageRanges,
                selection: $model.ageRange
            ) { advance(from: step) }
        case .gender:
            SingleChoiceScreen(
                heading: "How do you identify?",
                subtext: "Some people feel more comfortable in circles with others who share their identity.",
                warmNote: "Whatever you choose, you will find understanding here.",
                options: options.genders,
                selection: $model.gender
            ) { advance(from: step) }
        case .country:
            CountryScreen(countries: options.countries, selection: $model.country) { advance(from: step) }
        case .username:
            UsernameScreen(model: model, options: options) {
                Task {
                    if await model.submit() { await session.reload() }
                }
            }
        }
    }
}

// MARK: - Consent (step 0)

/// The Article 9 gate, same wording as the website. Explicit means a
/// separate, deliberate act, so it is its own switch that starts off, and
/// nothing moves on until it is on.
private struct ConsentScreen: View {
    @Bindable var model: OnboardingModel
    var onContinue: () -> Void

    var body: some View {
        Form {
            Section {
                VStack(alignment: .leading, spacing: 12) {
                    Text("You are in the right place.")
                        .font(.serif(.title))
                        .foregroundStyle(Theme.ink)
                        .accessibilityAddTraits(.isHeader)
                    Text("We want to make sure you find the right circle. We will ask you a few gentle questions. There are no wrong answers. Take your time.")
                        .foregroundStyle(Theme.muted)
                }
                .padding(.vertical, 4)
            }
            .listRowBackground(Color.clear)

            Section {
                Text("Some of what we ask next is sensitive. Your answers describe experiences of addiction, abuse or emotional harm, and data protection law treats that as a special category that needs your clear permission before we can hold it at all.")
                    .foregroundStyle(Theme.ink)
                Text("We use these answers for one thing only: matching you to a circle of people with similar experiences. They are never shown to other members, never used for advertising, and never shared with anyone outside Between Us. You can withdraw this at any time from your profile, which erases those answers.")
                    .font(.subheadline)
                    .foregroundStyle(Theme.muted)
                Toggle("I explicitly consent to Between Us holding my answers about my experiences in order to match me with a circle.", isOn: $model.sensitiveConsent)
            } footer: {
                Text("Our [Privacy Policy](https://betweenussupport.com/privacy) explains how this is stored and how long we keep it.")
                    .tint(Theme.link)
            }

            Section {
                Button(action: onContinue) {
                    Text("I Am Ready")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .disabled(!model.sensitiveConsent)
            }
        }
        .scrollContentBackground(.hidden)
        .sensoryFeedback(.selection, trigger: model.sensitiveConsent)
    }
}

// MARK: - Shared question layout

private struct QuestionHeader: View {
    let heading: String
    let subtext: String
    let warmNote: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(heading)
                .font(.serif(.title2))
                .foregroundStyle(Theme.ink)
                .accessibilityAddTraits(.isHeader)
            Text(subtext)
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
            if let warmNote {
                Text(warmNote)
                    .font(.footnote.italic())
                    .foregroundStyle(Theme.link)
            }
        }
        .textCase(nil)
        .padding(.bottom, 8)
    }
}

private struct OptionRow: View {
    let label: String
    let isSelected: Bool
    let systemImage: String

    var body: some View {
        HStack(spacing: 12) {
            Text(label)
                .foregroundStyle(Theme.ink)
                .frame(maxWidth: .infinity, alignment: .leading)
            Image(systemName: isSelected ? systemImage : "circle")
                .foregroundStyle(isSelected ? Theme.accent : Theme.border)
                .imageScale(.large)
                .accessibilityHidden(true)
        }
        .padding(.vertical, 6)
        .contentShape(Rectangle())
    }
}

private struct SingleChoiceScreen: View {
    let heading: String
    let subtext: String
    let warmNote: String?
    let options: [OnboardingOptions.Option]
    @Binding var selection: String?
    var onChosen: () -> Void

    var body: some View {
        List {
            Section {
                ForEach(options) { option in
                    Button {
                        selection = option.slug
                        onChosen()
                    } label: {
                        OptionRow(label: option.label, isSelected: selection == option.slug, systemImage: "checkmark.circle.fill")
                    }
                    .accessibilityAddTraits(selection == option.slug ? .isSelected : [])
                }
            } header: {
                QuestionHeader(heading: heading, subtext: subtext, warmNote: warmNote)
            }
        }
        .scrollContentBackground(.hidden)
        .sensoryFeedback(.selection, trigger: selection)
    }
}

private struct MultiChoiceScreen: View {
    let heading: String
    let subtext: String
    let warmNote: String?
    let options: [OnboardingOptions.Option]
    @Binding var selection: Set<String>
    var onContinue: () -> Void

    var body: some View {
        List {
            Section {
                ForEach(options) { option in
                    let isSelected = selection.contains(option.slug)
                    Button {
                        if isSelected { selection.remove(option.slug) } else { selection.insert(option.slug) }
                    } label: {
                        OptionRow(label: option.label, isSelected: isSelected, systemImage: "checkmark.square.fill")
                    }
                    .accessibilityAddTraits(isSelected ? .isSelected : [])
                }
            } header: {
                QuestionHeader(heading: heading, subtext: subtext, warmNote: warmNote)
            }

            Section {
                Button(action: onContinue) {
                    Text("Continue").font(.headline).frame(maxWidth: .infinity)
                }
                .disabled(selection.isEmpty)
            }
        }
        .scrollContentBackground(.hidden)
        .sensoryFeedback(.selection, trigger: selection)
    }
}

// MARK: - Country

private struct CountryScreen: View {
    let countries: [String]
    @Binding var selection: String?
    var onChosen: () -> Void

    @State private var search = ""

    private var filtered: [String] {
        search.isEmpty ? countries : countries.filter { $0.localizedCaseInsensitiveContains(search) }
    }

    var body: some View {
        List {
            Section {
                ForEach(filtered, id: \.self) { country in
                    Button {
                        selection = country
                        onChosen()
                    } label: {
                        OptionRow(label: country, isSelected: selection == country, systemImage: "checkmark.circle.fill")
                    }
                    .accessibilityAddTraits(selection == country ? .isSelected : [])
                }
            } header: {
                VStack(alignment: .leading, spacing: 12) {
                    QuestionHeader(
                        heading: "Which country are you in?",
                        subtext: "We use this to show you the right crisis resources if you ever need them. It is never shown to other members.",
                        warmNote: nil
                    )
                    Text("Between Us is currently available in English only. Your country does not affect which circle you join. All circles are conducted in English.")
                        .font(.footnote)
                        .foregroundStyle(Theme.muted)
                        .textCase(nil)
                        .padding(.bottom, 8)
                }
            }
        }
        .scrollContentBackground(.hidden)
        .searchable(text: $search, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search countries")
        .sensoryFeedback(.selection, trigger: selection)
    }
}

// MARK: - Username

private struct UsernameScreen: View {
    @Bindable var model: OnboardingModel
    let options: OnboardingOptions
    var onJoin: () -> Void

    @FocusState private var focused: Bool

    var body: some View {
        Form {
            Section {
                TextField("Username", text: $model.username)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .textContentType(.nickname)
                    .focused($focused)
                    .submitLabel(.join)
                    .onSubmit(onJoin)

                Button {
                    model.username = options.suggestName()
                } label: {
                    Label("Suggest another name", systemImage: "arrow.triangle.2.circlepath")
                }
                .foregroundStyle(Theme.link)
            } header: {
                QuestionHeader(
                    heading: "Choose your name here.",
                    subtext: "This is the only name anyone will ever see. No real names. Ever.",
                    warmNote: "This is your safe space."
                )
            } footer: {
                if let error = model.errorMessage {
                    Text(error)
                        .foregroundStyle(Theme.danger)
                } else {
                    Text("3 to 20 characters: letters, numbers and underscores.")
                }
            }

            Section {
                Button(action: onJoin) {
                    HStack {
                        Spacer()
                        if model.isSubmitting {
                            ProgressView().accessibilityLabel("Joining your circle")
                        } else {
                            Text("Join Your Circle").font(.headline)
                        }
                        Spacer()
                    }
                }
                .disabled(model.isSubmitting || model.username.trimmingCharacters(in: .whitespaces).isEmpty)
            } footer: {
                Text("By joining, you agree to our [community guidelines](https://betweenussupport.com/guidelines).")
                    .tint(Theme.link)
            }
        }
        .scrollContentBackground(.hidden)
        .sensoryFeedback(.error, trigger: model.failedAttempts)
        .onChange(of: model.errorMessage) { _, message in
            if let message { AccessibilityNotification.Announcement(message).post() }
        }
    }
}
