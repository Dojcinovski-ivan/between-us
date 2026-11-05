import XCTest

/// Walks through every App Store guideline 1.2 safeguard slowly, for a
/// screen recording to attach for App Review. Skipped unless REVIEW_VIDEO
/// is set.
///
/// App Review signs in as the first test account, so this leaves its circle
/// with posts from the second account (Report and Block only show on other
/// people's posts) and unblocks that account again at the end.
final class ReviewVideoTests: XCTestCase {
    private var app: XCUIApplication!
    private var env: [String: String] { ProcessInfo.processInfo.environment }

    override func setUp() async throws {
        guard env["REVIEW_VIDEO"] != nil,
              env["TEST_EMAIL"] != nil, env["TEST_EMAIL_2"] != nil, env["TEST_PASSWORD"] != nil else {
            throw XCTSkip("Set REVIEW_VIDEO, TEST_EMAIL, TEST_EMAIL_2 and TEST_PASSWORD to record the review video.")
        }
        continueAfterFailure = false
        app = await XCUIApplication()
    }

    /// Run first, before recording: the second account posts what the
    /// first will report and block.
    @MainActor
    func test1_SecondMemberPosts() throws {
        app.launch()
        app.signOutIfSignedIn()
        logIn(env["TEST_EMAIL_2"]!)
        for text in [
            "Evenings are the hardest part for me. Does anyone else find that?",
            "I started writing things down before bed and it helps a little.",
            "Thank you all for being here this week.",
        ] {
            post(text)
        }
        app.signOutIfSignedIn()
    }

    /// The part that is recorded.
    @MainActor
    func test2_Walkthrough() throws {
        app.launch()
        app.signOutIfSignedIn()
        logIn(env["TEST_EMAIL"]!, agree: false)

        // 1. Terms with zero tolerance, agreed before the circle opens.
        XCTAssertTrue(app.agreeToTermsButton.waitForExistence(timeout: 30), "The terms screen didn't appear")
        pause(6)
        // The system's save-password sheet can arrive late and swallow a tap.
        let notNow = XCUIApplication(bundleIdentifier: "com.apple.springboard").buttons["Not Now"]
        for _ in 0..<5 where app.agreeToTermsButton.exists {
            if notNow.exists { notNow.tap(); pause(1) }
            app.agreeToTermsButton.tap()
            pause(2)
        }
        XCTAssertTrue(app.buttons["Send"].waitForExistence(timeout: 30), "The feed didn't load")
        pause(3)

        // 2. Filtering: a post with blocked language is refused.
        post("just go die", expectRefusal: true)

        // 3. Flagging, which also removes the post from the feed at once.
        let first = bubble("Evenings are the hardest part")
        XCTAssertTrue(first.waitForExistence(timeout: 10), "The second member's post isn't in the feed")
        openMenu(of: first)
        tap("Report")
        pause(2)
        tap("Harassment")
        pause(3)
        tap("Done")
        pause(3)

        // 4. Blocking an abusive member.
        let second = bubble("helps a little")
        XCTAssertTrue(second.waitForExistence(timeout: 10))
        openMenu(of: second)
        tap("Block ui_test_2")
        pause(2)
        tap("Block")
        pause(3)

        // 5. Contact information, and the blocked list.
        app.profileButton.tap()
        let contact = app.buttons["Report a problem or contact us"]
        for _ in 0..<8 where !(contact.exists && contact.isHittable) { app.swipeUp() }
        pause(5)
        for _ in 0..<8 where !app.buttons["Blocked members"].isHittable { app.swipeDown() }
        app.buttons["Blocked members"].tap()
        pause(3)
        // Leave App Review's account with someone to report and block.
        tap("Unblock ui_test_2")
        pause(3)
    }
}

// MARK: - Steps

@MainActor
private extension ReviewVideoTests {
    func pause(_ seconds: UInt32) { sleep(seconds) }

    func logIn(_ email: String, agree: Bool = true) {
        app.welcomeLogInButton.tap()
        let emailField = app.textFields["Email"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 5))
        emailField.tap()
        emailField.typeText(email)
        let passwordField = app.secureTextFields["Password"]
        passwordField.tap()
        passwordField.typeText(env["TEST_PASSWORD"]! + "\n")

        let notNow = XCUIApplication(bundleIdentifier: "com.apple.springboard").buttons["Not Now"]
        let deadline = Date().addingTimeInterval(30)
        while Date() < deadline, !app.profileButton.exists {
            if notNow.exists { notNow.tap() }
            if app.buttons["Not Now"].exists { app.buttons["Not Now"].tap() }
            if app.agreeToTermsButton.exists {
                guard agree else {
                    // iOS offers to save the password just after login, on
                    // top of the terms; clear it so the terms can be tapped.
                    if notNow.waitForExistence(timeout: 6) { notNow.tap() }
                    return
                }
                app.agreeToTermsButton.tap()
            }
            _ = app.profileButton.waitForExistence(timeout: 1)
        }
    }

    func post(_ text: String, expectRefusal: Bool = false) {
        let composer = app.textViews.firstMatch.exists ? app.textViews.firstMatch : app.textFields.firstMatch
        XCTAssertTrue(composer.waitForExistence(timeout: 10))
        composer.tap()
        composer.typeText(text)
        pause(1)
        app.buttons["Send"].tap()
        if expectRefusal {
            XCTAssertTrue(app.alerts["That didn't post"].waitForExistence(timeout: 10), "The blocked post wasn't refused")
            pause(5)
            app.alerts.buttons["OK"].tap()
            // Focus can take a moment to come back after the alert.
            for _ in 0..<5 where !(composer.value(forKey: "hasKeyboardFocus") as? Bool ?? false) {
                pause(1)
                composer.tap()
            }
            composer.clearText()
            app.keyboards.buttons["Hide keyboard"].firstMatch.tapIfPresent()
        } else {
            // Matched on the first word only, in case the keyboard still
            // autocorrects the rest.
            let firstWord = String(text.split(separator: " ").first ?? "")
            XCTAssertTrue(bubble(firstWord).waitForExistence(timeout: 15), "The post didn't appear")
        }
        pause(1)
    }

    func bubble(_ words: String) -> XCUIElement {
        app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", words)).firstMatch
    }

    /// Taps the ⋯ button on the same row as this post.
    func openMenu(of post: XCUIElement) {
        let buttons = app.buttons.matching(NSPredicate(format: "label == %@", "Report, block and more")).allElementsBoundByIndex
        let target = buttons
            .filter { $0.frame.maxY <= post.frame.minY + 4 }
            .max { $0.frame.maxY < $1.frame.maxY }
        XCTAssertNotNil(target, "No ⋯ button above the post")
        target?.tap()
        pause(2)
    }

    func tap(_ label: String) {
        let matches = app.buttons.matching(NSPredicate(format: "label == %@", label))
        let deadline = Date().addingTimeInterval(8)
        repeat {
            if let button = matches.allElementsBoundByIndex.last(where: { $0.exists && $0.isHittable }) {
                button.tap()
                return
            }
            usleep(250_000)
        } while Date() < deadline
        XCTFail("No tappable \(label) button")
    }
}

private extension XCUIElement {
    func tapIfPresent() { if exists && isHittable { tap() } }

    func clearText() {
        guard let value = value as? String, !value.isEmpty else { return }
        typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: value.count))
    }
}
