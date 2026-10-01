import XCTest

/// Taps through the signed-out screens like a person would. Needs no
/// account and writes nothing to the database. Run with ⌘U in Xcode.
final class SignedOutFlowTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() async throws {
        continueAfterFailure = false
        app = await XCUIApplication()
        await app.launch()
    }

    @MainActor
    func testWelcomeToLogIn() throws {
        let logIn = app.buttons["I already have an account"]
        XCTAssertTrue(logIn.waitForExistence(timeout: 20), "Welcome screen didn't appear")
        logIn.tap()

        XCTAssertTrue(app.navigationBars["Welcome back"].waitForExistence(timeout: 5), "Log in screen didn't open")
        XCTAssertTrue(app.textFields["Email"].exists)
        XCTAssertTrue(app.secureTextFields["Password"].exists)

        app.buttons["Forgot password?"].tap()
        XCTAssertTrue(app.navigationBars["Reset password"].waitForExistence(timeout: 5), "Reset screen didn't open")
    }

    @MainActor
    func testWelcomeToRegister() throws {
        let findCircle = app.buttons["Find your circle"]
        XCTAssertTrue(findCircle.waitForExistence(timeout: 20), "Welcome screen didn't appear")
        findCircle.tap()

        XCTAssertTrue(app.navigationBars["Create account"].waitForExistence(timeout: 5), "Register screen didn't open")
        XCTAssertTrue(app.textFields["Email"].exists)
        XCTAssertTrue(app.datePickers.firstMatch.exists)
    }
}
