import SwiftUI
import UIKit

/// The website's colour tokens (src/app/globals.css), each with its dark
/// variant, so the app follows the system Light/Dark setting.
///
/// Where the website's colour is too faint for body text on these
/// backgrounds (sage links, the lighter accent), a deeper shade is used in
/// light mode so text keeps at least 4.5:1 contrast.
enum Theme {
    static let background = Color(light: 0xF7F3EE, dark: 0x2A2118)
    static let surface = Color(light: 0xFFFFFF, dark: 0x352A20)
    static let surface2 = Color(light: 0xF0EAE2, dark: 0x3F3228)
    static let border = Color(light: 0xE8DDD4, dark: 0x4A3C30)
    static let ink = Color(light: 0x2C1810, dark: 0xF2EDE6)
    static let muted = Color(light: 0x6B4F3A, dark: 0xC8B5A5)
    static let accent = Color(light: 0xB3735A, dark: 0xC4846A)
    static let link = Color(light: 0x8A5540, dark: 0xE0AE95)
    static let sage = Color(light: 0x8FA68E, dark: 0x8FA68E)
    static let danger = Color(light: 0xB54A35, dark: 0xE0674A)
}

extension Color {
    init(light: UInt32, dark: UInt32) {
        self.init(uiColor: UIColor { traits in
            UIColor(hex: traits.userInterfaceStyle == .dark ? dark : light)
        })
    }
}

private extension UIColor {
    convenience init(hex: UInt32) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}

extension Font {
    /// Headlines use a serif, like the website's Georgia/Fraunces headings.
    /// Built on text styles so they scale with Dynamic Type.
    static func serif(_ style: Font.TextStyle) -> Font {
        .system(style, design: .serif)
    }
}
