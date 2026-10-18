import Foundation
import SwiftUI

struct Mission: Codable, Identifiable, Equatable {
    var id = UUID()
    var title: String
    var minutes: Int
    var icon = "star.fill"

    static let initial: [Mission] = [
        Mission(title: "한글 공부", minutes: 30, icon: "character.book.closed.fill"),
        Mission(title: "북클럽 오늘 학습", minutes: 30, icon: "ipad"),
        Mission(title: "책읽기", minutes: 30, icon: "book.closed.fill")
    ]
}

enum MissionStore {
    private static let key = "rewardMissions"
    static func load() -> [Mission] {
        if let data = SharedStore.defaults.data(forKey: key),
           let missions = try? JSONDecoder().decode([Mission].self, from: data) {
            return missions
        }
        let missions = Mission.initial
        save(missions)
        return missions
    }
    static func save(_ missions: [Mission]) {
        if let data = try? JSONEncoder().encode(missions) {
            SharedStore.defaults.set(data, forKey: key)
        }
    }
}

struct MissionEditorRequest: Identifiable {
    let id = UUID()
    let mission: Mission?
}

struct MissionEditor: View {
    @Environment(\.dismiss) private var dismiss
    @State private var draft: Mission
    @State private var confirmDelete = false
    let isNew: Bool
    let onSave: (Mission) -> Void
    let onDelete: (UUID) -> Void

    init(mission: Mission?, onSave: @escaping (Mission) -> Void, onDelete: @escaping (UUID) -> Void) {
        _draft = State(initialValue: mission ?? Mission(title: "", minutes: 30))
        isNew = mission == nil
        self.onSave = onSave
        self.onDelete = onDelete
    }

    private var trimmedTitle: String { draft.title.trimmingCharacters(in: .whitespacesAndNewlines) }

    var body: some View {
        NavigationStack {
            Form {
                Section("어떤 미션인가요?") {
                    TextField("예: 장난감 정리하기", text: $draft.title)
                }
                Section("완료하면 받는 시간") {
                    Stepper("보상 \(draft.minutes)분", value: $draft.minutes, in: 1...120)
                    HStack {
                        ForEach([5, 10, 15, 30], id: \.self) { value in
                            Button("\(value)분") { draft.minutes = value }
                                .buttonStyle(.bordered)
                                .tint(draft.minutes == value ? .green : .secondary)
                        }
                    }
                    Text("부모님이 완료를 확인하면 이 시간만큼 추가돼요. 보상 시간을 바꿔도 이미 받은 시간은 바뀌지 않아요.")
                        .font(.caption).foregroundStyle(.secondary)
                }
                if !isNew {
                    Section {
                        Button("미션 삭제", role: .destructive) { confirmDelete = true }
                    }
                }
            }
            .navigationTitle(isNew ? "새 미션 추가" : "미션 수정")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("취소") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("저장") {
                        draft.title = trimmedTitle
                        onSave(draft)
                        dismiss()
                    }.disabled(trimmedTitle.isEmpty || trimmedTitle.count > 60)
                }
            }
            .confirmationDialog("이 미션을 삭제할까요? 이미 받은 보상과 기록은 유지돼요.", isPresented: $confirmDelete, titleVisibility: .visible) {
                Button("미션 삭제", role: .destructive) { onDelete(draft.id); dismiss() }
                Button("취소", role: .cancel) { }
            }
        }
    }
}
