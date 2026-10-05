import XCTest

/// Logs in with a real account and uses the circle like a member would.
///
/// Needs TEST_EMAIL and TEST_PASSWORD in the test runner's environment (see
/// ios/README.md); every test is skipped without them. The account must have
/// finished onboarding and be in a circle with at least one other member.
///
/// These write to whatever database the app is built against: the post and
/// reply are real and the rest of that circle sees them until the test
/// deletes them. Use an account whose circle holds only test accounts.
final class SignedInFlowTests: XCTestCase {
    private var app: XCUIApplication!
    private var email = ""
    private var password = ""

    override func setUp() async throws {
        let environment = ProcessInfo.processInfo.environment
        guard let email = environment["TEST_EMAIL"], !email.isEmpty,
              let password = environment["TEST_PASSWORD"], !password.isEmpty else {
            throw XCTSkip("Set TEST_EMAIL and TEST_PASSWORD to run the signed-in tests. See ios/README.md.")
        }
        self.email = email
        self.password = password

        continueAfterFailure = false
        app = await XCUIApplication()
        await app.launch()
    }

    @MainActor
    func testLogInAndLoadFeed() throws {
        app.signOutIfSignedIn()
        logIn()
        waitForFeed()
    }

    @MainActor
    func testPostReactReplyEditDelete() throws {
        openFeed()

        // A run that failed halfway can leave its post behind.
        for _ in 0..<3 where bubble(containing: "UI test post").exists {
            delete(bubble(containing: "UI test post"))
        }

        // Digits, because autocorrect leaves them alone.
        let token = String(Int(Date().timeIntervalSince1970))
        let post = bubble(containing: "UI test post", token)

        // Post
        let composer = textInput(placeholder: "Share something with your circle…")
        composer.tap()
        composer.typeText("UI test post \(token)")
        app.buttons["Send"].tap()
        XCTAssertTrue(post.waitForExistence(timeout: 15), "The new post didn't appear in the feed")

        // React
        chooseFromMenu(of: post, "I hear you")
        XCTAssertTrue(app.buttons["I hear you, 1"].waitForExistence(timeout: 10), "The reaction didn't show on the post")

        // Reply
        chooseFromMenu(of: post, "Reply")
        XCTAssertTrue(app.navigationBars["Thread"].waitForExistence(timeout: 5), "The thread didn't open")
        let replyBox = textInput(placeholder: "Reply in thread…")
        replyBox.tap()
        replyBox.typeText("UI test reply \(token)")
        app.buttons["Send"].tap()
        XCTAssertTrue(bubble(containing: "UI test reply", token).waitForExistence(timeout: 15), "The reply didn't appear in the thread")
        app.navigationBars["Thread"].buttons.firstMatch.tap()
        XCTAssertTrue(post.waitForExistence(timeout: 5), "Going back from the thread didn't return to the feed")

        // Edit
        chooseFromMenu(of: post, "Edit")
        XCTAssertTrue(app.navigationBars["Edit post"].waitForExistence(timeout: 5), "The edit sheet didn't open")
        let editor = textInput(holding: token)
        editor.tap()
        editor.typeText(" edited")
        app.navigationBars["Edit post"].buttons["Save"].tap()
        XCTAssertTrue(bubble(containing: token, "edited").waitForExistence(timeout: 15), "The edit didn't show in the feed")

        // Delete (takes the reply with it)
        delete(post)
        XCTAssertTrue(post.waitForNonExistence(timeout: 15), "The post is still in the feed after deleting it")
    }

    @MainActor
    func testProfileAndResources() throws {
        openFeed()

        app.profileButton.tap()
        XCTAssertTrue(app.navigationBars["Profile"].waitForExistence(timeout: 5), "Profile didn't open")
        XCTAssertTrue(app.buttons["Blocked members"].waitForExistence(timeout: 5), "Profile opened but its content didn't show")
        app.navigationBars["Profile"].buttons.firstMatch.tap()

        app.buttons["Resources"].tap()
        XCTAssertTrue(app.navigationBars["Resources"].waitForExistence(timeout: 5), "Resources didn't open")
        let helpline = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", "findahelpline.com")).firstMatch
        XCTAssertTrue(helpline.waitForExistence(timeout: 5), "The crisis line link is missing from Resources")
    }
}

// MARK: - Steps

@MainActor
private extension SignedInFlowTests {
    /// Gets to the feed from wherever the app launched, logging in if needed.
    func openFeed() {
        XCTAssertTrue(app.waitForFirstScreen(), "Neither the welcome screen nor the circle appeared")
        if !app.profileButton.exists {
            // Another account without a circle may have been left signed in.
            app.signOutIfSignedIn()
            logIn()
        }
        waitForFeed()
    }

    func logIn() {
        app.welcomeLogInButton.tap()

        let emailField = app.textFields["Email"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 5), "Log in screen didn't open")
        emailField.tap()
        emailField.typeText(email)

        let passwordField = app.secureTextFields["Password"]
        passwordField.tap()
        passwordField.typeText(password + "\n")

        // iOS may offer to save the password; that sheet belongs to the system.
        let notNow = XCUIApplication(bundleIdentifier: "com.apple.springboard").buttons["Not Now"]
        let error = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Error:")).firstMatch
        let deadline = Date().addingTimeInterval(30)
        while Date() < deadline, !app.profileButton.exists {
            if notNow.exists { notNow.tap() }
            if app.buttons["Not Now"].exists { app.buttons["Not Now"].tap() }
            if error.exists { XCTFail("Log in was refused. \(error.label)") }
            _ = app.profileButton.waitForExistence(timeout: 1)
        }
        XCTAssertTrue(app.profileButton.exists, "Logging in didn't reach the circle. Has the test account finished onboarding?")
    }

    func waitForFeed() {
        // Only the feed has the composer; the waiting room doesn't.
        if app.buttons["Send"].waitForExistence(timeout: 20) { return }
        if app.staticTexts["You are the first one here."].exists {
            XCTFail("The test account is alone in its circle, so there is no feed. Put a second test account in the same circle.")
        } else {
            XCTFail("The feed didn't load")
        }
    }

    /// A post's bubble, found by words in its text.
    func bubble(containing words: String...) -> XCUIElement {
        let format = words.map { _ in "label CONTAINS %@" }.joined(separator: " AND ")
        return app.descendants(matching: .any).matching(NSPredicate(format: format, argumentArray: words)).firstMatch
    }

    /// Multi-line fields show up as text views on some iOS versions and text
    /// fields on others, so look in both.
    func textInput(placeholder: String) -> XCUIElement {
        textInput(NSPredicate(format: "placeholderValue == %@ OR label == %@ OR value == %@", placeholder, placeholder, placeholder))
    }

    func textInput(holding text: String) -> XCUIElement {
        textInput(NSPredicate(format: "value CONTAINS %@", text))
    }

    func textInput(_ predicate: NSPredicate) -> XCUIElement {
        let view = app.textViews.matching(predicate).firstMatch
        if view.waitForExistence(timeout: 3) { return view }
        return app.textFields.matching(predicate).firstMatch
    }

    /// Long-presses a post and taps an item in its menu.
    func chooseFromMenu(of post: XCUIElement, _ item: String) {
        post.press(forDuration: 1.0)
        XCTAssertTrue(app.buttons["Copy"].waitForExistence(timeout: 5), "The post's menu didn't open")
        tapOnScreenButton(item)
    }

    func delete(_ post: XCUIElement) {
        chooseFromMenu(of: post, "Delete")
        XCTAssertTrue(app.staticTexts["This can't be undone."].waitForExistence(timeout: 5), "The delete confirmation didn't appear")
        tapOnScreenButton("Delete")
    }

    /// Taps the button with this label that can actually be tapped. The feed
    /// behind a menu or dialog has buttons with the same labels ("Reply").
    func tapOnScreenButton(_ label: String) {
        let matches = app.buttons.matching(NSPredicate(format: "label ENDSWITH %@", label))
        let deadline = Date().addingTimeInterval(5)
        repeat {
            if let button = matches.allElementsBoundByIndex.last(where: { $0.exists && $0.isHittable }) {
                button.tap()
                return
            }
            usleep(250_000)
        } while Date() < deadline
        XCTFail("No \"\(label)\" button to tap")
    }
}
