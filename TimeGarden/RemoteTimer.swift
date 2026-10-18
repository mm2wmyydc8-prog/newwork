import Foundation
import Security
import SwiftUI
import UserNotifications

enum ServerCredential {
    private static var query: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "TimeGarden.Server", kSecAttrAccount as String: "access-key"]
    }
    static func load() -> String? {
        var q = query
        q[kSecReturnData as String] = true
        var result: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    static func save(_ key: String) throws {
        let values = [kSecValueData as String: Data(key.utf8)]
        let result = SecItemUpdate(query as CFDictionary, values as CFDictionary)
        if result == errSecItemNotFound {
            var q = query
            q[kSecValueData as String] = Data(key.utf8)
            q[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
            guard SecItemAdd(q as CFDictionary, nil) == errSecSuccess else { throw RemoteError.message("접속 키 저장에 실패했어요.") }
        } else if result != errSecSuccess { throw RemoteError.message("접속 키 저장에 실패했어요.") }
    }
}

enum RemoteError: LocalizedError {
    case message(String)
    var errorDescription: String? { if case let .message(text) = self { return text }; return nil }
}

struct TimerSnapshot: Decodable {
    let day: String
    let totalSeconds: Int
    let remainingSeconds: Int
    let running: Bool
    let shutdownStatus: String
    let warning: Bool
}

@MainActor
final class RemoteTimer: ObservableObject {
    @Published var snapshot: TimerSnapshot?
    @Published var receivedAt = Date.now
    @Published var error: String?
    @Published var busy = false
    @Published var connectionMessage: String?
    @Published var configured = false
    private var sentBudget: String?
    private var notificationDeadline: Date?
    var serverURL: String { UserDefaults.standard.string(forKey: "timerServerURL") ?? "" }

    init() { configured = !serverURL.isEmpty && ServerCredential.load() != nil }

    func remaining(at now: Date) -> Int {
        guard let snapshot else { return 0 }
        let elapsed = snapshot.running ? max(0, Int(now.timeIntervalSince(receivedAt))) : 0
        return max(0, snapshot.remainingSeconds - elapsed)
    }

    private func request<T: Decodable>(_ path: String, body: [String: Any]? = nil) async throws -> T {
        guard let root = URL(string: serverURL), root.scheme == "https", root.host != nil,
              let key = ServerCredential.load() else { throw RemoteError.message("부모님 메뉴에서 HTTPS 서버와 접속 키를 설정해 주세요.") }
        var req = URLRequest(url: root.appendingPathComponent(path), timeoutInterval: 15)
        req.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        if let body {
            req.httpMethod = "POST"
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw RemoteError.message("서버 응답을 확인할 수 없어요.") }
        guard (200...299).contains(http.statusCode) else {
            if http.statusCode == 401 { throw RemoteError.message("서버 접속 키를 확인해 주세요.") }
            if http.statusCode == 409 { throw RemoteError.message("남은 시간이 없거나 모니터 끄기를 처리 중이에요.") }
            throw RemoteError.message("서버 연결을 확인해 주세요. (\(http.statusCode))")
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func accept(_ value: TimerSnapshot) {
        snapshot = value; receivedAt = .now; error = nil
        let deadline = Date.now.addingTimeInterval(TimeInterval(value.remainingSeconds))
        if value.running, let scheduled = notificationDeadline,
           abs(deadline.timeIntervalSince(scheduled)) <= 2 { return }
        notificationDeadline = value.running ? deadline : nil
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["viewing-warning", "viewing-end"])
        if value.running {
            for (id, seconds, title, text) in [
                ("viewing-warning", value.remainingSeconds - 300, "5분 뒤에 마칠 시간이에요", "보고 있는 영상을 마무리해 주세요."),
                ("viewing-end", value.remainingSeconds, "오늘 시청 시간이 끝났어요", "서버에서 모니터 끄기를 처리합니다. 연결 상태에 따라 지연될 수 있어요.")
            ] where seconds > 0 {
                let content = UNMutableNotificationContent()
                content.title = title; content.body = text; content.sound = .default
                let trigger = UNTimeIntervalNotificationTrigger(timeInterval: TimeInterval(seconds), repeats: false)
                center.add(UNNotificationRequest(identifier: id, content: content, trigger: trigger))
            }
        }
    }

    private func sync(_ allowance: Allowance) async throws {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        formatter.dateFormat = "yyyy-MM-dd"
        let day = formatter.string(from: .now)
        let signature = "\(day):\(allowance.dailyMinutes):\(allowance.limit())"
        guard sentBudget != signature else { return }
        let value: TimerSnapshot = try await request("budget", body: ["day": day, "baseMinutes": allowance.dailyMinutes, "totalMinutes": allowance.limit()])
        sentBudget = signature; accept(value)
    }

    func refresh(_ allowance: Allowance) async {
        guard configured, !busy else { return }
        busy = true; defer { busy = false }
        do { try await sync(allowance); let value: TimerSnapshot = try await request("timer"); accept(value) }
        catch { self.error = "서버 연결이 안 돼요. 아래 시간은 마지막 확인값 기준이에요.\n" + error.localizedDescription }
    }

    func action(_ command: String, allowance: Allowance) async {
        guard configured, !busy else { return }
        busy = true; defer { busy = false }
        do {
            try await sync(allowance)
            let value: TimerSnapshot = try await request("timer/\(command)", body: [:])
            accept(value)
        } catch { self.error = error.localizedDescription }
    }

    func connect(url: String, key: String, allowance: Allowance) async {
        guard let parsed = URL(string: url.trimmingCharacters(in: .whitespacesAndNewlines)), parsed.scheme == "https",
              parsed.host != nil, parsed.user == nil, parsed.password == nil, parsed.query == nil, parsed.fragment == nil,
              key.utf8.count >= 32 else { error = "HTTPS 서버 주소와 32바이트 이상의 접속 키를 입력해 주세요."; return }
        do {
            try ServerCredential.save(key)
            UserDefaults.standard.set(parsed.absoluteString, forKey: "timerServerURL")
            configured = true; sentBudget = nil
            let result: IntegrationStatus = try await request("integration")
            connectionMessage = "SmartThings 연결됨 · 전원 \(result.power == "on" ? "켜짐" : result.power == "off" ? "꺼짐" : "확인 필요")"
            _ = try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound])
            await refresh(allowance)
        } catch { self.error = error.localizedDescription; connectionMessage = nil }
    }
    private struct IntegrationStatus: Decodable { let connected: Bool; let power: String }
}

struct ViewingTimerCard: View {
    @ObservedObject var remote: RemoteTimer
    let allowance: Allowance

    var body: some View {
        VStack(spacing: 16) {
            Label("내 시청 시간", systemImage: "tv.fill").font(.headline)
            if let snapshot = remote.snapshot {
                TimelineView(.periodic(from: .now, by: 1)) { context in
                    let seconds = remote.remaining(at: context.date)
                    Text(String(format: "%02d:%02d:%02d", seconds / 3600, seconds / 60 % 60, seconds % 60))
                        .font(.system(size: 48, weight: .bold, design: .rounded)).monospacedDigit()
                        .minimumScaleFactor(0.5).lineLimit(1)
                        .accessibilityLabel("남은 시간 \(seconds / 60)분 \(seconds % 60)초")
                    Text(seconds == 0 ? "이제 쉬는 시간이에요 🌱" : snapshot.running ? (seconds <= 300 ? "곧 마칠 시간이에요" : "즐겁게 보고 약속도 지켜요") : "볼 때 시작 버튼을 눌러요")
                        .font(.subheadline)
                }
                HStack {
                    Button { Task { await remote.action(snapshot.running ? "pause" : "start", allowance: allowance) } } label: {
                        Label(snapshot.running ? "잠깐 멈춤" : "보기 시작", systemImage: snapshot.running ? "pause.fill" : "play.fill")
                    }.buttonStyle(.borderedProminent)
                    Button("다 봤어요") { Task { await remote.action("stop", allowance: allowance) } }
                        .buttonStyle(.bordered)
                }.disabled(remote.busy)
                switch snapshot.shutdownStatus {
                case "failed": Text("모니터 끄기에 실패했어요. 서버가 다시 시도 중이에요. 부모님이 확인해 주세요.").foregroundStyle(.red)
                case "pending": Text("모니터 끄기를 요청하고 있어요.")
                case "sent": Text("모니터 끄기 명령을 보냈어요.")
                default: EmptyView()
                }
            } else {
                Text(remote.configured ? "서버 시간을 확인하고 있어요…" : "부모님 메뉴에서 M5 타이머를 연결해 주세요.")
                    .font(.subheadline)
            }
            if let error = remote.error { Text(error).font(.caption).foregroundStyle(.red) }
            Text("TV나 패드로 보기 시작할 때 눌러요. ‘다 봤어요’는 M5도 꺼요. ‘잠깐 멈춤’은 타이머만 멈춰요.")
                .font(.caption).foregroundStyle(.secondary)
        }.padding(24).frame(maxWidth: .infinity)
            .background(.white, in: RoundedRectangle(cornerRadius: 26))
    }
}
