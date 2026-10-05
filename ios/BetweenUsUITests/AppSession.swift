import XCTest

/// Getting the app into a known signed-in or signed-out state. The login
/// is kept in the simulator's keychain between runs, so a test can't assume
/// either.
extension XCUIApplication {
    var welcomeLogInButton: XCUIElement { buttons["I already have an account"] }
    /// In the circle's toolbar, so it is there for any signed-in member.
    var profileButton: XCUIElement { buttons["Profile"] }
    /// Signed in but not in a circle ("No circle yet", or still onboarding):
    /// those screens carry their own Log Out.
    var logOutButton: XCUIElement { buttons["Log Out"] }

    private var isOnFirstScreen: Bool {
        welcomeLogInButton.exists || profileButton.exists || logOutButton.exists
    }

    /// Waits for the launch spinner to give way to the welcome screen, the
    /// circle, or a signed-in screen without a circle. False if none shows up.
    func waitForFirstScreen(timeout: TimeInterval = 30) -> Bool {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if isOnFirstScreen { return true }
            _ = welcomeLogInButton.waitForExistence(timeout: 0.5)
        }
        return isOnFirstScreen
    }

    /// Logs out if someone is signed in, through Profile or straight from a
    /// screen that has no circle to show.
    func signOutIfSignedIn() {
        guard waitForFirstScreen(), !welcomeLogInButton.exists else { return }

        if !profileButton.exists {
            logOutButton.tap()
            XCTAssertTrue(welcomeLogInButton.waitForExistence(timeout: 10), "Logging out didn't return to the welcome screen")
            return
        }
        profileButton.tap()

        let logOut = logOutButton
        for _ in 0..<6 where !(logOut.exists && logOut.isHittable) { swipeUp() }
        logOut.tap()
        XCTAssertTrue(welcomeLogInButton.waitForExistence(timeout: 10), "Logging out didn't return to the welcome screen")
    }
}
