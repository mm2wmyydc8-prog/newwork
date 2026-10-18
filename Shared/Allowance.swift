import Foundation

struct TimeEntry: Codable, Identifiable {
    var id = UUID()
    var date = Date()
    let minutes: Int
    let reason: String
}

struct Allowance: Codable {
    var dailyMinutes = 30
    var entries: [TimeEntry] = []

    func limit(on date: Date = Date(), calendar: Calendar = .current) -> Int {
        let change = entries.filter { calendar.isDate($0.date, inSameDayAs: date) }
            .reduce(0) { $0 + $1.minutes }
        return min(240, max(0, dailyMinutes + change))
    }

    mutating func adjust(_ minutes: Int, reason: String, now: Date = Date()) {
        // Record the applied change so the history always matches the daily limit.
        let applied = min(240, max(0, limit(on: now) + minutes)) - limit(on: now)
        guard applied != 0 else { return }
        entries.insert(TimeEntry(date: now, minutes: applied, reason: reason), at: 0)
        let cutoff = Calendar.current.date(byAdding: .day, value: -90, to: now) ?? .distantPast
        entries.removeAll { $0.date < cutoff }
    }
}

enum SharedStore {
    static let group = "group.com.example.timegarden"
    static var defaults: UserDefaults {
        #if BASIC_DEMO
        return .standard
        #else
        return UserDefaults(suiteName: group)!
        #endif
    }
    static let selectionKey = "selectedApps"

    static func load() -> Allowance {
        guard let data = defaults.data(forKey: "allowance"),
              let value = try? JSONDecoder().decode(Allowance.self, from: data) else {
            return Allowance()
        }
        return value
    }

    static func save(_ value: Allowance) {
        if let data = try? JSONEncoder().encode(value) { defaults.set(data, forKey: "allowance") }
    }
}
