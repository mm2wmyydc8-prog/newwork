import SwiftUI

// Basic on-device flow. An absolute start date preserves elapsed time when the
// app goes to the background; no server or TV connection is required.
@MainActor
final class PracticeTimer: ObservableObject {
    private struct State: Codable {
        var day: Date
        var usedSeconds: TimeInterval = 0
        var startedAt: Date?
    }
    @Published private var state: State
    private let key = "practiceViewingTimer"

    init() {
        if let data = UserDefaults.standard.data(forKey: key),
           let saved = try? JSONDecoder().decode(State.self, from: data) {
            state = saved
        } else { state = State(day: Calendar.current.startOfDay(for: .now)) }
    }
    var running: Bool { state.startedAt != nil }
    func remaining(totalMinutes: Int, at now: Date) -> Int {
        guard Calendar.current.isDate(state.day, inSameDayAs: now) else { return totalMinutes * 60 }
        let elapsed = state.startedAt.map { max(0, now.timeIntervalSince($0)) } ?? 0
        return max(0, Int(ceil(Double(totalMinutes * 60) - state.usedSeconds - elapsed)))
    }
    func refresh(totalMinutes: Int, now: Date = .now) {
        if !Calendar.current.isDate(state.day, inSameDayAs: now) {
            state = State(day: Calendar.current.startOfDay(for: now))
            save()
        } else if running && remaining(totalMinutes: totalMinutes, at: now) == 0 {
            pause(now: now)
        }
    }
    func start(totalMinutes: Int) {
        refresh(totalMinutes: totalMinutes)
        guard !running, remaining(totalMinutes: totalMinutes, at: .now) > 0 else { return }
        state.startedAt = .now
        save()
    }
    func pause(now: Date = .now) {
        if let started = state.startedAt { state.usedSeconds += max(0, now.timeIntervalSince(started)) }
        state.startedAt = nil
        save()
    }
    private func save() {
        if let data = try? JSONEncoder().encode(state) { UserDefaults.standard.set(data, forKey: key) }
    }
}

struct PracticeTimerCard: View {
    @StateObject private var timer = PracticeTimer()
    let totalMinutes: Int

    var body: some View {
        VStack(spacing: 18) {
            Label("연우의 남은 시간", systemImage: "timer")
                .font(.headline)
                .foregroundStyle(PocketTheme.blue)
            TimelineView(.periodic(from: .now, by: 1)) { context in
                let seconds = timer.remaining(totalMinutes: totalMinutes, at: context.date)
                Text(String(format: "%02d:%02d:%02d", seconds / 3600, seconds / 60 % 60, seconds % 60))
                    .font(.system(size: 52, weight: .bold, design: .rounded))
                    .monospacedDigit().lineLimit(1).minimumScaleFactor(0.5)
                    .foregroundStyle(PocketTheme.blue)
                    .accessibilityLabel("남은 시간 \(seconds / 60)분 \(seconds % 60)초")
                Text(seconds == 0 ? "모험 끝! 이제 쉬러 가자 ⭐" : timer.running ? "연우의 즐거운 시간!" : "준비됐어, 연우? 시작을 눌러 봐!")
                    .font(.subheadline)
            }
            HStack(spacing: 12) {
                Button {
                    if timer.running { timer.pause() } else { timer.start(totalMinutes: totalMinutes) }
                } label: {
                    Label(timer.running ? "잠깐 멈춤" : "보기 시작", systemImage: timer.running ? "pause.fill" : "play.fill")
                        .padding(.vertical, 8)
                }.buttonStyle(.borderedProminent).tint(PocketTheme.red)
                Button("다 봤어요") { timer.pause() }
                    .buttonStyle(.bordered).tint(PocketTheme.blue)
            }
            Text("지금은 연습용이에요. TV 전원은 직접 꺼 주세요.")
                .font(.caption).foregroundStyle(.secondary)
        }.padding(24).frame(maxWidth: .infinity)
            .background(.white, in: RoundedRectangle(cornerRadius: 26))
            .onReceive(Timer.publish(every: 1, on: .main, in: .common).autoconnect()) { now in
                timer.refresh(totalMinutes: totalMinutes, now: now)
            }
            .onChange(of: totalMinutes) { _, _ in timer.refresh(totalMinutes: totalMinutes) }
            .onAppear { timer.refresh(totalMinutes: totalMinutes) }
    }
}
