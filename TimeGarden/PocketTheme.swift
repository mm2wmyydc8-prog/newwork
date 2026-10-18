import SwiftUI

enum PocketTheme {
    static let blue = Color(red: 0.28, green: 0.16, blue: 0.48)
    static let red = Color(red: 0.48, green: 0.28, blue: 0.77)
    static let pink = Color(red: 0.94, green: 0.48, blue: 0.69)
    static let yellow = Color(red: 1.0, green: 0.82, blue: 0.25)
    static let background = Color(red: 0.96, green: 0.94, blue: 1)
}

enum AppMode {
    static var screenTimeEnabled: Bool {
        #if BASIC_DEMO
        return false
        #else
        return true
        #endif
    }
}

struct AdventureBall: View {
    var body: some View {
        GeometryReader { proxy in
            let side = min(proxy.size.width, proxy.size.height)
            ZStack {
                Circle().fill(.white)
                Rectangle().fill(PocketTheme.red)
                    .frame(width: side, height: side / 2).offset(y: -side / 4)
                Ellipse().fill(PocketTheme.pink)
                    .frame(width: side * 0.28, height: side * 0.34)
                    .rotationEffect(.degrees(30)).offset(x: -side * 0.35, y: -side * 0.29)
                Ellipse().fill(PocketTheme.pink)
                    .frame(width: side * 0.28, height: side * 0.34)
                    .rotationEffect(.degrees(-30)).offset(x: side * 0.35, y: -side * 0.29)
                Text("M").font(.system(size: side * 0.23, weight: .black, design: .rounded))
                    .foregroundStyle(.white).offset(y: -side * 0.25)
                Rectangle().fill(PocketTheme.blue).frame(height: side * 0.09)
                Circle().fill(.white).frame(width: side * 0.30)
                    .overlay(Circle().stroke(PocketTheme.blue, lineWidth: side * 0.065))
                Circle().fill(PocketTheme.yellow).frame(width: side * 0.13)
            }.frame(width: side, height: side)
                .clipShape(Circle())
                .overlay(Circle().stroke(PocketTheme.blue, lineWidth: side * 0.045))
                .rotationEffect(.degrees(-12))
        }.aspectRatio(1, contentMode: .fit)
            .accessibilityHidden(true)
    }
}

struct AdventureBanner: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 10) {
                    Label("연우의 오늘 모험", systemImage: "sparkles")
                        .font(.caption.bold()).padding(.horizontal, 12).padding(.vertical, 7)
                        .background(.white.opacity(0.8), in: Capsule())
                    Text("뮤·뮤츠와 함께\n미션 출발!")
                    .font(.system(size: 28, weight: .heavy, design: .rounded))
                    .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
                AdventureBall().frame(width: 66, height: 66)
                    .shadow(color: PocketTheme.red.opacity(0.2), radius: 0, x: 0, y: 5)
            }
            HStack(alignment: .bottom, spacing: 16) {
                companion("Mew", name: "뮤", subtitle: "작은 도전도 좋아!", color: PocketTheme.pink)
                companion("Mewtwo", name: "뮤츠", subtitle: "연우, 넌 할 수 있어!", color: PocketTheme.red)
            }
            Text("미션을 깨고 즐거운 시간을 모으자!")
                .font(.subheadline.weight(.semibold))
        }.foregroundStyle(PocketTheme.blue).padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(LinearGradient(colors: [Color(red: 0.90, green: 0.85, blue: 1), Color(red: 1, green: 0.90, blue: 0.95)], startPoint: .topLeading, endPoint: .bottomTrailing), in: RoundedRectangle(cornerRadius: 28))
    }

    private func companion(_ asset: String, name: String, subtitle: String, color: Color) -> some View {
        VStack(spacing: 8) {
            Image(asset).resizable().scaledToFit().frame(height: 132)
                .shadow(color: color.opacity(0.18), radius: 10, y: 6)
                .accessibilityLabel(name)
            Text(name).font(.headline)
            Text(subtitle).font(.caption.weight(.medium)).multilineTextAlignment(.center)
        }.padding(12).frame(maxWidth: .infinity)
            .background(.white.opacity(0.65), in: RoundedRectangle(cornerRadius: 22))
    }
}
