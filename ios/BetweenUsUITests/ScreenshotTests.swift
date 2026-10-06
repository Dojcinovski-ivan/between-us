import XCTest

/// Takes the App Store screenshots from the app's demo mode (Core/Demo.swift),
/// so they show a full circle without touching a real one. Skipped unless
/// SCREENSHOTS is set; ./take-screenshots.sh sets it and collects the images.
final class ScreenshotTests: XCTestCase {
    override func setUp() async throws {
        guard ProcessInfo.processInfo.environment["SCREENSHOTS"] != nil else {
            throw XCTSkip("Run ./take-screenshots.sh to take the App Store screenshots.")
        }
        continueAfterFailure = false
    }

    @MainActor
    func testSignedOutScreens() throws {
        let app = XCUIApplication()
        app.launch()
        app.signOutIfSignedIn()

        XCTAssertTrue(app.welcomeLogInButton.waitForExistence(timeout: 30))
        capture("1-welcome")

        app.buttons["Find your circle"].tap()
        XCTAssertTrue(app.navigationBars["Create account"].waitForExistence(timeout: 5))
        capture("5-create-account")
    }

    @MainActor
    func testCircle() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-demo"]
        app.launch()

        XCTAssertTrue(app.profileButton.waitForExistence(timeout: 30))
        // The opening animation has to finish first.
        sleep(3)
        capture("2-circle")

        let post = app.descendants(matching: .any)
            .matching(NSPredicate(format: "label CONTAINS %@", "quiet evenings")).firstMatch
        post.press(forDuration: 1)
        app.buttons["Reply"].firstMatch.tap()
        XCTAssertTrue(app.navigationBars["Thread"].waitForExistence(timeout: 5))
        sleep(1)
        capture("3-thread")
        app.navigationBars["Thread"].buttons.firstMatch.tap()

        app.buttons["Resources"].tap()
        XCTAssertTrue(app.navigationBars["Resources"].waitForExistence(timeout: 5))
        sleep(2)
        capture("4-resources")
    }

    @MainActor
    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
