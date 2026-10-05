import SwiftUI

/// The Between Us mark, drawn from the same paths as the website's
/// LogoMark (src/app/_landing/LogoMark.tsx): a figure held by two arcs.
struct LogoMark: View {
    var color: Color = Theme.accent

    var body: some View {
        ZStack {
            Part(.head).stroke(color.opacity(0.9), style: Self.stroke)
            Part(.outerArc).stroke(color.opacity(0.55), style: Self.stroke)
            Part(.innerArc).stroke(color, style: Self.stroke)
        }
        .aspectRatio(1, contentMode: .fit)
        .accessibilityHidden(true)
    }

    // In the website's 40-point drawing space; Part scales it to fit.
    private static let stroke = StrokeStyle(lineWidth: 1.6, lineCap: .round)

    private struct Part: Shape {
        enum Kind { case head, outerArc, innerArc }
        let kind: Kind

        init(_ kind: Kind) { self.kind = kind }

        func path(in rect: CGRect) -> Path {
            var path = Path()
            switch kind {
            case .head:
                path.addEllipse(in: CGRect(x: 14, y: 8.5, width: 12, height: 12))
            case .outerArc:
                path.move(to: CGPoint(x: 4, y: 30))
                path.addCurve(to: CGPoint(x: 20, y: 20.4), control1: CGPoint(x: 8.6, y: 23.6), control2: CGPoint(x: 14, y: 20.4))
                path.addCurve(to: CGPoint(x: 36, y: 30), control1: CGPoint(x: 26, y: 20.4), control2: CGPoint(x: 31.4, y: 23.6))
            case .innerArc:
                path.move(to: CGPoint(x: 8, y: 34.5))
                path.addCurve(to: CGPoint(x: 20, y: 27.6), control1: CGPoint(x: 11.6, y: 29.9), control2: CGPoint(x: 15.6, y: 27.6))
                path.addCurve(to: CGPoint(x: 32, y: 34.5), control1: CGPoint(x: 24.4, y: 27.6), control2: CGPoint(x: 28.4, y: 29.9))
            }
            let scale = min(rect.width, rect.height) / 40
            return path.applying(CGAffineTransform(translationX: rect.minX, y: rect.minY).scaledBy(x: scale, y: scale))
        }
    }
}

#Preview {
    LogoMark().frame(width: 120)
}
