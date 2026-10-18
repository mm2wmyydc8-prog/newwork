import SwiftUI
import FamilyControls

@main
struct TimeGardenApp: App {
    var body: some Scene { WindowGroup { GardenView() } }
}

@MainActor
final class GardenModel: ObservableObject {
    @Published var allowance = SharedStore.load()
    @Published var missions = MissionStore.load()
    @Published var selection = ScreenTime.selection
    @Published var error: String?
    @Published var authorized = AppMode.screenTimeEnabled && AuthorizationCenter.shared.authorizationStatus == .approved

    func refresh() {
        allowance = SharedStore.load()
        missions = MissionStore.load()
        authorized = AppMode.screenTimeEnabled && AuthorizationCenter.shared.authorizationStatus == .approved
    }
    func connect() async {
        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            refresh()
            try apply()
        } catch { self.error = error.localizedDescription }
    }
    func apply() throws {
        SharedStore.save(allowance)
        ScreenTime.selection = selection
        if authorized { try ScreenTime.configure() }
    }
    func save() {
        do { try apply() }
        catch { self.error = "제한 설정을 적용하지 못했습니다. 다시 시도해 주세요.\n" + error.localizedDescription }
    }
    func adjust(_ minutes: Int, reason: String) {
        allowance.adjust(minutes, reason: reason)
        save()
    }
    func saveMission(_ mission: Mission) {
        guard !mission.title.isEmpty, mission.title.count <= 60, (1...120).contains(mission.minutes) else { return }
        if let index = missions.firstIndex(where: { $0.id == mission.id }) { missions[index] = mission }
        else { missions.append(mission) }
        MissionStore.save(missions)
    }
    func deleteMission(_ id: UUID) {
        missions.removeAll { $0.id == id }
        MissionStore.save(missions)
    }
}

struct GardenView: View {
    @StateObject private var model = GardenModel()
    @StateObject private var remote = RemoteTimer()
    @Environment(\.scenePhase) private var scenePhase
    @State private var showPIN = false
    @State private var showParent = false
    @Environment(\.horizontalSizeClass) private var sizeClass
    private let green = PocketTheme.blue
    private var totalTime: String {
        let minutes = model.allowance.limit()
        if minutes < 60 { return "\(minutes)분" }
        if minutes % 60 == 0 { return "\(minutes / 60)시간" }
        return "\(minutes / 60)시간 \(minutes % 60)분"
    }
    private var todaysChange: Int { model.allowance.limit() - model.allowance.dailyMinutes }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    HStack {
                        Label("연우의 포켓 타임", systemImage: "bolt.circle.fill").font(.headline).foregroundStyle(green)
                        Spacer()
                        Button { showPIN = true } label: {
                            Label("부모님", systemImage: "lock.fill").font(.subheadline.weight(.semibold))
                        }.buttonStyle(.bordered).tint(green)
                    }
                    AdventureBanner()
                    if remote.configured {
                        ViewingTimerCard(remote: remote, allowance: model.allowance)
                    } else {
                        PracticeTimerCard(totalMinutes: model.allowance.limit())
                    }
                    VStack(spacing: 18) {
                        HStack(spacing: 10) {
                            AdventureBall().frame(width: 36, height: 36)
                            Text("연우의 마스터 시간볼").font(.subheadline.bold()).foregroundStyle(green)
                        }
                        Label("오늘 볼 수 있는 시간", systemImage: "play.rectangle.fill")
                            .font(.headline)
                        Text(totalTime)
                            .font(.system(size: 54, weight: .bold, design: .rounded))
                            .monospacedDigit().lineLimit(1).minimumScaleFactor(0.5)
                            .foregroundStyle(green)
                            .contentTransition(.numericText())
                            .accessibilityLabel("오늘 유튜브 총 허용 시간 \(totalTime)")
                        if model.allowance.limit() >= 60 {
                            Text("모두 합쳐 \(model.allowance.limit())분이에요!")
                                .font(.subheadline.weight(.semibold)).foregroundStyle(green)
                        }
                        HStack(spacing: 12) {
                            Label("기본 \(model.allowance.dailyMinutes)분", systemImage: "sun.max.fill")
                            Text("오늘 \(todaysChange >= 0 ? "+" : "−")\(abs(todaysChange))분")
                        }.font(.subheadline.weight(.medium))
                            .padding(.horizontal, 16).padding(.vertical, 10)
                            .background(.white.opacity(0.7), in: Capsule())
                        Text("오늘의 총시간이에요. 이미 본 시간도 포함돼요.")
                            .font(.caption).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    }.frame(maxWidth: .infinity).padding(28)
                        .background(PocketTheme.red.opacity(0.10), in: RoundedRectangle(cornerRadius: 30))
                        .animation(.easeInOut(duration: 0.25), value: model.allowance.limit())

                    if AppMode.screenTimeEnabled {
                    Label(model.authorized && ScreenTime.hasSelection ? "스크린 타임 제한이 연결되어 있어요" : "부모님 메뉴에서 스크린 타임을 연결해 주세요",
                          systemImage: model.authorized && ScreenTime.hasSelection ? "checkmark.shield.fill" : "exclamationmark.shield")
                        .font(.subheadline).foregroundStyle(green)
                    }
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Label("오늘의 미션", systemImage: "map.fill").font(.title3.bold()).foregroundStyle(green)
                            Spacer()
                            Button { showPIN = true } label: { Image(systemName: "plus.circle.fill").font(.title2) }
                                .accessibilityLabel("부모님 확인 후 미션 추가하기")
                        }
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), alignment: .leading), count: sizeClass == .regular ? 2 : 1), spacing: 12) {
                            ForEach(model.missions) { mission in
                                promise(mission.icon, mission.title, "+\(mission.minutes)분", PocketTheme.blue)
                                    .padding(16).background(PocketTheme.background, in: RoundedRectangle(cornerRadius: 18))
                            }
                        }
                        if model.missions.isEmpty {
                            Text("부모님과 함께 첫 미션을 추가해 보세요.").font(.subheadline).foregroundStyle(.secondary)
                        }
                        promise("clock.badge.exclamationmark", "약속을 지키지 않으면", "−5분", .orange)
                        Text("부모님이 확인하고 직접 반영해요. 보상과 차감은 오늘만 적용돼요.")
                            .font(.caption).foregroundStyle(.secondary)
                    }.padding(22).background(.white, in: RoundedRectangle(cornerRadius: 24))
                    HStack { Label("연우의 모험 기록", systemImage: "star.circle.fill").font(.title3.bold()); Spacer(); Text("최근 기록").font(.caption).foregroundStyle(.secondary) }
                    if model.allowance.entries.isEmpty {
                        Text("아직 기록이 없어요. 첫 번째 약속을 함께 정해 보세요.")
                            .font(.subheadline).foregroundStyle(.secondary).padding(.vertical, 8)
                    }
                    ForEach(Array(model.allowance.entries.prefix(30))) { entry in
                        HStack(spacing: 14) {
                            Image(systemName: entry.minutes > 0 ? "star.fill" : "minus.circle.fill")
                                .foregroundStyle(entry.minutes > 0 ? green : .orange)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(entry.reason).font(.subheadline.weight(.medium))
                                Text(entry.date, format: .dateTime.month().day().hour().minute())
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text("\(entry.minutes > 0 ? "+" : "")\(entry.minutes)분").font(.headline)
                        }.padding(18).background(.white, in: RoundedRectangle(cornerRadius: 18))
                    }
                }.padding(24).frame(maxWidth: 900).frame(maxWidth: .infinity)
            }.background(PocketTheme.background)
                .toolbar(.hidden, for: .navigationBar)
        }
        .tint(PocketTheme.blue)
        .preferredColorScheme(.light)
        .sheet(isPresented: $showPIN) {
            ParentPINView { showPIN = false; showParent = true }
                .presentationDetents([.medium])
        }
        .sheet(isPresented: $showParent) { ParentView(model: model, remote: remote) }
        .alert("확인이 필요해요", isPresented: Binding(get: { model.error != nil }, set: { if !$0 { model.error = nil } })) {
            Button("확인") { model.error = nil }
        } message: { Text(model.error ?? "") }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { model.refresh() }
            if phase == .background { showParent = false; showPIN = false }
        }
        .onReceive(Timer.publish(every: 60, on: .main, in: .common).autoconnect()) { _ in model.refresh() }
        .task {
            while !Task.isCancelled {
                if scenePhase == .active { await remote.refresh(model.allowance) }
                do { try await Task.sleep(for: .seconds(5)) } catch { break }
            }
        }
        .onChange(of: model.allowance.limit()) { _, _ in Task { await remote.refresh(model.allowance) } }
        .onChange(of: model.allowance.dailyMinutes) { _, _ in Task { await remote.refresh(model.allowance) } }
    }
    private func promise(_ icon: String, _ title: String, _ amount: String, _ color: Color) -> some View {
        HStack { Image(systemName: icon).frame(width: 24).foregroundStyle(green); Text(title).font(.subheadline); Spacer(); Text(amount).font(.subheadline.bold()).foregroundStyle(color) }
    }
}

struct ParentPINView: View {
    var onSuccess: () -> Void
    @State private var pin = ""
    @State private var confirmation = ""
    @State private var message = ""
    @State private var configured = ParentLock.isConfigured
    @AppStorage("pinFailures") private var failures = 0
    @AppStorage("pinLockedUntil") private var lockedUntil = 0.0

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    SecureField("숫자 6자리", text: $pin).keyboardType(.numberPad)
                    if !configured { SecureField("한 번 더 입력", text: $confirmation).keyboardType(.numberPad) }
                } header: { Text(configured ? "부모 비밀번호" : "부모 비밀번호 만들기") }
                Text("처음 설정은 부모님이 직접 해 주세요. 비밀번호를 잊으면 앱 안에서 복구할 수 없어요.")
                    .font(.caption).foregroundStyle(.secondary)
                if !message.isEmpty { Text(message).foregroundStyle(.red) }
                Button(configured ? "부모님 메뉴 열기" : "설정하고 시작") { submit() }
                    .disabled(pin.count != 6 || !pin.allSatisfy({ $0.isASCII && $0.isNumber }))
            }.navigationTitle(configured ? "부모님 확인" : "안전하게 시작해요")
        }
    }
    private func submit() {
        guard Date.now.timeIntervalSince1970 >= lockedUntil else { message = "잠시 후 다시 시도해 주세요. 5회 실패하면 1분 동안 잠겨요."; return }
        if !configured {
            guard pin == confirmation else { message = "두 비밀번호가 달라요."; return }
            do { try ParentLock.create(pin); failures = 0; onSuccess() }
            catch { message = error.localizedDescription }
        } else if ParentLock.verify(pin) {
            failures = 0; lockedUntil = 0; onSuccess()
        } else {
            failures += 1
            if failures >= 5 { lockedUntil = Date.now.addingTimeInterval(60).timeIntervalSince1970; failures = 0 }
            pin = ""; message = "비밀번호를 다시 확인해 주세요."
        }
    }
}

struct ParentView: View {
    @ObservedObject var model: GardenModel
    @ObservedObject var remote: RemoteTimer
    @Environment(\.dismiss) private var dismiss
    @State private var picker = false
    @State private var reason = ""
    @State private var minutes = 10
    @State private var serverURL = ""
    @State private var serverKey = ""
    @State private var missionEditor: MissionEditorRequest?

    var body: some View {
        NavigationStack {
            Form {
                Section("미션과 보상 시간") {
                    ForEach(model.missions) { mission in
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 4) {
                                Label(mission.title, systemImage: mission.icon)
                                Text("완료하면 +\(mission.minutes)분").font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Button("완료") { model.adjust(mission.minutes, reason: "\(mission.title) 완료") }
                                .buttonStyle(.bordered)
                                .accessibilityLabel("\(mission.title) 완료하고 \(mission.minutes)분 보상하기")
                            Button {
                                missionEditor = MissionEditorRequest(mission: mission)
                            } label: { Image(systemName: "pencil") }
                                .buttonStyle(.borderless)
                                .accessibilityLabel("\(mission.title) 수정")
                        }
                    }
                    Button {
                        missionEditor = MissionEditorRequest(mission: nil)
                    } label: { Label("미션 추가", systemImage: "plus.circle.fill") }
                    Text("미션별 보상 시간을 자유롭게 정하세요. 완료 보상은 오늘의 시청 시간에 반영돼요.")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Section {
                    DisclosureGroup("TV 자동 끄기 · 나중에 연결") {
                    TextField("HTTPS 타이머 서버 주소", text: $serverURL)
                        .textInputAutocapitalization(.never).autocorrectionDisabled().keyboardType(.URL)
                    SecureField("앱 접속 키 (SmartThings 토큰 아님)", text: $serverKey)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                    Button("연결 확인하고 저장") {
                        Task { await remote.connect(url: serverURL, key: serverKey, allowance: model.allowance); serverKey = "" }
                    }.disabled(remote.busy)
                    if let message = remote.connectionMessage { Text(message).foregroundStyle(.green) }
                    if let error = remote.error { Text(error).foregroundStyle(.red).font(.caption) }
                    Text("SmartThings 인증 정보는 서버에만 보관해요. 서버가 켜져 있어야 앱을 닫아도 자동 끄기가 동작해요. 시간 기준은 한국 시간입니다.")
                        .font(.caption).foregroundStyle(.secondary)
                    }
                }
                if AppMode.screenTimeEnabled {
                Section("시청 시간 연결") {
                    Label(model.authorized ? "스크린 타임 승인됨" : "승인이 필요해요", systemImage: "checkmark.shield")
                    if !model.authorized { Button("이 기기 스크린 타임 승인") { Task { await model.connect() } } }
                    Button("제한할 앱·웹사이트 선택") { picker = true }.disabled(!model.authorized)
                    Text("YouTube와 필요한 웹사이트를 직접 선택하세요. 선택한 앱들의 사용 시간은 합산됩니다. 이 버전은 아이 기기에서 직접 설정하며, 다른 기기의 원격 제어는 지원하지 않습니다.")
                        .font(.caption).foregroundStyle(.secondary)
                }
                }
                Section("매일 기본 시간") {
                    Stepper("\(model.allowance.dailyMinutes)분", value: $model.allowance.dailyMinutes, in: 0...180, step: 5)
                    Text("매일 자정에 보상·차감이 초기화돼요. 하루 최대 240분까지 설정할 수 있어요.")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Section("시간 차감") {
                    Button("약속 미준수 · −5분", role: .destructive) { model.adjust(-5, reason: "약속을 다시 연습해요") }
                }
                Section("직접 기록하기") {
                    TextField("이유를 적어 주세요", text: $reason)
                    Stepper("조절할 시간 \(minutes)분", value: $minutes, in: 5...60, step: 5)
                    Button("\(minutes)분 보상하기") { record(minutes) }.disabled(reason.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    Button("\(minutes)분 줄이기", role: .destructive) { record(-minutes) }.disabled(reason.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                Section {
                    Text("아이와 함께 정한 약속을 기준으로 사용하세요. 앱 삭제나 스크린 타임 승인 해제를 막는 강제 보호 기능은 포함되어 있지 않습니다.")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }.navigationTitle("연우의 미션 관리")
                .sheet(item: $missionEditor) { request in
                    MissionEditor(mission: request.mission, onSave: model.saveMission, onDelete: model.deleteMission)
                }
                .onAppear { serverURL = remote.serverURL }
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("완료") { dismiss() } } }
                .familyActivityPicker(isPresented: $picker, selection: $model.selection)
                .onChange(of: picker) { _, visible in if !visible { model.save() } }
                .onChange(of: model.allowance.dailyMinutes) { _, _ in model.save() }
                .alert("설정을 적용하지 못했어요", isPresented: Binding(get: { model.error != nil }, set: { if !$0 { model.error = nil } })) {
                    Button("확인") { model.error = nil }
                } message: { Text(model.error ?? "") }
        }
    }
    private func record(_ amount: Int) {
        model.adjust(amount, reason: String(reason.trimmingCharacters(in: .whitespacesAndNewlines).prefix(100)))
        reason = ""
    }
}
