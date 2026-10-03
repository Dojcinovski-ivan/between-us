import XCTest

/// Getting the app into a known signed-in or signed-out state. The login
/// is kept in the simulator's keychain between runs, so a test can't assume
/// either.
extension XCUIApplication {
    var welcomeLogInButton: XCUIElement { buttons["I already have an account"] }
    /// In the circle's toolbar, so it is there for any signed-in member.
    var profileButton: XCUIElement { buttons["Profile"] }

    /// Waits for the launch spinner to give way to either the welcome screen
    /// or the circle. False if neither shows up.
    func waitForFirstScreen(timeout: TimeInterval = 30) -> Bool {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if welcomeLogInButton.exists || profileButton.exists { return true }
            _ = welcomeLogInButton.waitForExistence(timeout: 0.5)
        }
        return welcomeLogInButton.exists || profileButton.exists
    }

    /// Logs out through Profile if someone is signed in.
    func signOutIfSignedIn() {
        guard waitForFirstScreen(), profileButton.exists else { return }
        profileButton.tap()

        let logOut = buttons["Log Out"]
        for _ in 0..<6 where !(logOut.exists && logOut.isHittable) { swipeUp() }
        logOut.tap()
        XCTAssertTrue(welcomeLogInButton.waitForExistence(timeout: 10), "Logging out didn't return to the welcome screen")
    }
}
